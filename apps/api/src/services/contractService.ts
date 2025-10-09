import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AuthTokenPayload, UserRole } from "@admin-inmo/shared";
import { getPrisma } from "../utils/prisma";
import { HttpError } from "../utils/errors";

const prisma = getPrisma();

const contractInputSchema = z.object({
  propietarioId: z.string().min(1),
  inquilinoId: z.string().min(1),
  direccion: z.string().min(1),
  montoMensual: z.number().positive(),
  comisionMensual: z.number().min(0).default(0),
  diaVencimiento: z.number().int().min(1).max(31).default(10),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
  ajusteFrecuenciaMeses: z.number().int().min(1).max(60).default(12),
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});

type ContractInput = z.infer<typeof contractInputSchema>;

const contractUpdateSchema = contractInputSchema.partial();

const ensureTenantAdmin = (actor: AuthTokenPayload) => {
  if (actor.role === UserRole.SUPER_ADMIN) {
    return;
  }
  if (actor.role !== UserRole.ADMIN) {
    throw new HttpError(403, "Solo administradores pueden realizar esta accion");
  }
  if (!actor.inmobiliariaId) {
    throw new HttpError(400, "Administrador sin inmobiliaria asociada");
  }
};

const ensureTenantAccess = (actor: AuthTokenPayload, inmobiliariaId: string) => {
  if (actor.role === UserRole.SUPER_ADMIN) {
    return;
  }
  if (actor.role === UserRole.ADMIN) {
    if (!actor.inmobiliariaId || actor.inmobiliariaId !== inmobiliariaId) {
      throw new HttpError(403, "No tienes acceso a esta inmobiliaria");
    }
    return;
  }
};

export const listContractsForUser = async (actor: AuthTokenPayload) => {
  if (actor.role === UserRole.SUPER_ADMIN) {
    return prisma.contrato.findMany({
      include: { propietario: true, inquilino: true, pagos: true, descuentos: true },
      orderBy: { createdAt: "desc" },
    });
  }

  if (actor.role === UserRole.ADMIN) {
    if (!actor.inmobiliariaId) {
      throw new HttpError(400, "Administrador sin inmobiliaria asociada");
    }
    return prisma.contrato.findMany({
      where: { inmobiliariaId: actor.inmobiliariaId },
      include: { propietario: true, inquilino: true, pagos: true, descuentos: true },
      orderBy: { createdAt: "desc" },
    });
  }

  if (actor.role === UserRole.PROPIETARIO) {
    return prisma.contrato.findMany({
      where: { propietarioId: actor.id },
      include: { propietario: true, inquilino: true, pagos: true, descuentos: true },
      orderBy: { createdAt: "desc" },
    });
  }

  return prisma.contrato.findMany({
    where: { inquilinoId: actor.id },
    include: { propietario: true, inquilino: true, pagos: true, descuentos: true },
    orderBy: { createdAt: "desc" },
  });
};

export const createContract = async (data: unknown, actor: AuthTokenPayload) => {
  ensureTenantAdmin(actor);

  if (actor.role !== UserRole.ADMIN) {
    throw new HttpError(403, "Solo un administrador puede crear contratos");
  }

  const tenantId = actor.inmobiliariaId;
  if (!tenantId) {
    throw new HttpError(400, "Administrador sin inmobiliaria asociada");
  }

  const parsed = contractInputSchema.parse(data);

  const [propietario, inquilino] = await Promise.all([
    prisma.user.findUnique({ where: { id: parsed.propietarioId } }),
    prisma.user.findUnique({ where: { id: parsed.inquilinoId } }),
  ]);

  if (!propietario || propietario.rol !== UserRole.PROPIETARIO) {
    throw new HttpError(400, "Propietario invalido");
  }

  if (!inquilino || inquilino.rol !== UserRole.INQUILINO) {
    throw new HttpError(400, "Inquilino invalido");
  }

  if (propietario.inmobiliariaId !== tenantId || inquilino.inmobiliariaId !== tenantId) {
    throw new HttpError(403, "Los usuarios deben pertenecer a la misma inmobiliaria");
  }

  if (parsed.fechaFin <= parsed.fechaInicio) {
    throw new HttpError(400, "La fecha de fin debe ser posterior a la fecha de inicio");
  }

  return prisma.contrato.create({
    data: {
      inmobiliariaId: tenantId,
      propietarioId: parsed.propietarioId,
      inquilinoId: parsed.inquilinoId,
      direccion: parsed.direccion,
      montoMensual: new Prisma.Decimal(parsed.montoMensual),
      comisionMensual: new Prisma.Decimal(parsed.comisionMensual),
      diaVencimiento: parsed.diaVencimiento,
      fechaInicio: parsed.fechaInicio,
      fechaFin: parsed.fechaFin,
      ajusteFrecuenciaMeses: parsed.ajusteFrecuenciaMeses,
      estado: parsed.estado as any,
    },
  });
};

export const updateContract = async (contratoId: string, data: unknown, actor: AuthTokenPayload) => {
  ensureTenantAdmin(actor);

  const existing = await prisma.contrato.findUnique({ where: { id: contratoId } });
  if (!existing) {
    throw new HttpError(404, "Contrato no encontrado");
  }

  ensureTenantAccess(actor, existing.inmobiliariaId);

  const parsed = contractUpdateSchema.parse(data);

  if (parsed.fechaInicio && parsed.fechaFin && parsed.fechaFin <= parsed.fechaInicio) {
    throw new HttpError(400, "La fecha de fin debe ser posterior a la fecha de inicio");
  }

  const dataToUpdate: Prisma.ContratoUpdateInput = {};

  if (parsed.propietarioId) {
    const propietario = await prisma.user.findUnique({ where: { id: parsed.propietarioId } });
    if (!propietario || propietario.rol !== UserRole.PROPIETARIO) {
      throw new HttpError(400, "Propietario invalido");
    }
    if (propietario.inmobiliariaId !== existing.inmobiliariaId) {
      throw new HttpError(403, "El propietario debe pertenecer a la misma inmobiliaria");
    }
    dataToUpdate.propietario = { connect: { id: parsed.propietarioId } };
  }
  if (parsed.inquilinoId) {
    const inquilino = await prisma.user.findUnique({ where: { id: parsed.inquilinoId } });
    if (!inquilino || inquilino.rol !== UserRole.INQUILINO) {
      throw new HttpError(400, "Inquilino invalido");
    }
    if (inquilino.inmobiliariaId !== existing.inmobiliariaId) {
      throw new HttpError(403, "El inquilino debe pertenecer a la misma inmobiliaria");
    }
    dataToUpdate.inquilino = { connect: { id: parsed.inquilinoId } };
  }
  if (parsed.direccion !== undefined) dataToUpdate.direccion = parsed.direccion;
  if (parsed.montoMensual !== undefined) {
    dataToUpdate.montoMensual = new Prisma.Decimal(parsed.montoMensual);
  }
  if (parsed.comisionMensual !== undefined) {
    dataToUpdate.comisionMensual = new Prisma.Decimal(parsed.comisionMensual);
  }
  if (parsed.diaVencimiento !== undefined) dataToUpdate.diaVencimiento = parsed.diaVencimiento;
  if (parsed.fechaInicio !== undefined) dataToUpdate.fechaInicio = parsed.fechaInicio;
  if (parsed.fechaFin !== undefined) dataToUpdate.fechaFin = parsed.fechaFin;
  if (parsed.ajusteFrecuenciaMeses !== undefined) {
    dataToUpdate.ajusteFrecuenciaMeses = parsed.ajusteFrecuenciaMeses;
  }
  if (parsed.estado !== undefined) dataToUpdate.estado = parsed.estado as any;

  return prisma.contrato.update({
    where: { id: contratoId },
    data: dataToUpdate,
    include: {
      propietario: true,
      inquilino: true,
      pagos: true,
      descuentos: true,
    },
  });
};

export const assertContratoAccess = async (contratoId: string, actor: AuthTokenPayload) => {
  const contrato = await prisma.contrato.findUnique({ where: { id: contratoId } });
  if (!contrato) {
    throw new HttpError(404, "Contrato no encontrado");
  }

  if (actor.role === UserRole.SUPER_ADMIN) {
    return contrato;
  }

  if (actor.role === UserRole.ADMIN) {
    ensureTenantAccess(actor, contrato.inmobiliariaId);
    return contrato;
  }

  if (actor.role !== UserRole.PROPIETARIO && actor.role !== UserRole.INQUILINO) {
    throw new HttpError(403, "No tienes acceso a este contrato");
  }

  if (contrato.propietarioId !== actor.id && contrato.inquilinoId !== actor.id) {
    throw new HttpError(403, "No tienes acceso a este contrato");
  }

  return contrato;
};

export const saveContratoArchivo = async (
  contratoId: string,
  actor: AuthTokenPayload,
  file: Express.Multer.File
) => {
  await assertContratoAccess(contratoId, actor);

  return prisma.contratoArchivo.create({
    data: {
      contratoId,
      fileName: file.originalname,
      filePath: file.path,
      mimeType: file.mimetype,
    },
  });
};

export const listContratoArchivos = async (contratoId: string, actor: AuthTokenPayload) => {
  await assertContratoAccess(contratoId, actor);
  return prisma.contratoArchivo.findMany({
    where: { contratoId },
    orderBy: { uploadedAt: "desc" },
  });
};

export const getContratoArchivo = async (archivoId: string, actor: AuthTokenPayload) => {
  const archivo = await prisma.contratoArchivo.findUnique({ where: { id: archivoId } });
  if (!archivo) {
    throw new HttpError(404, "Archivo no encontrado");
  }
  await assertContratoAccess(archivo.contratoId, actor);
  return archivo;
};

export const getContratoPagos = async (contratoId: string, actor: AuthTokenPayload) => {
  await assertContratoAccess(contratoId, actor);
  return prisma.pago.findMany({
    where: { contratoId },
    orderBy: { mes: "desc" },
  });
};

export const getContratoMovimientos = async (contratoId: string, actor: AuthTokenPayload) => {
  await assertContratoAccess(contratoId, actor);
  return prisma.movimiento.findMany({
    where: { contratoId },
    orderBy: { fecha: "desc" },
  });
};




