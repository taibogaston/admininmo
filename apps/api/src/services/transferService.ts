import { z } from "zod";
import fs from "fs";
import { getPrisma } from "../utils/prisma";
import { AuthTokenPayload, TransferenciaEstado, UserRole, PagoMetodo } from "@admin-inmo/shared";
import { HttpError } from "../utils/errors";
import { markPagoAsApproved } from "./paymentService";
import { TipoComprobante } from "@prisma/client";

const prisma = getPrisma();

export const listTransferenciasPendientes = async (actor: AuthTokenPayload) => {
  if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN && actor.role !== UserRole.PROPIETARIO) {
    throw new HttpError(403, "No tienes permisos para ver transferencias");
  }

  let where;
  
  if (actor.role === UserRole.ADMIN && actor.inmobiliariaId) {
    // Admin ve transferencias de su inmobiliaria
    where = {
      verificado: TransferenciaEstado.PENDIENTE_VERIFICACION,
      pago: { contrato: { inmobiliariaId: actor.inmobiliariaId } },
    };
  } else if (actor.role === UserRole.PROPIETARIO) {
    // Propietario ve solo transferencias de sus contratos
    where = {
      verificado: TransferenciaEstado.PENDIENTE_VERIFICACION,
      pago: { contrato: { propietarioId: actor.id } },
    };
  } else {
    // Super Admin ve todas las transferencias pendientes
    where = { verificado: TransferenciaEstado.PENDIENTE_VERIFICACION };
  }

  return prisma.transferencia.findMany({
    where,
    include: {
      pago: {
        include: {
          contrato: {
            include: { propietario: true, inquilino: true },
          },
        },
      },
      verificaciones: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

const verifySchema = z.object({
  aprobar: z.boolean(),
  comentario: z.string().max(500).optional(),
});

export const verificarTransferencia = async (
  transferenciaId: string,
  actor: AuthTokenPayload,
  body: unknown
) => {
  if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw new HttpError(403, "Sólo administradores");
  }

  const parsed = verifySchema.parse(body);

  const transferencia = await prisma.transferencia.findUnique({
    where: { id: transferenciaId },
    include: {
      pago: {
        include: { contrato: true },
      },
    },
  });

  if (!transferencia) {
    throw new HttpError(404, "Transferencia no encontrada");
  }

  if (
    actor.role === UserRole.ADMIN &&
    actor.inmobiliariaId &&
    transferencia.pago.contrato.inmobiliariaId !== actor.inmobiliariaId
  ) {
    throw new HttpError(403, "No tienes acceso a esta transferencia");
  }

  const estado = parsed.aprobar ? TransferenciaEstado.APROBADO : TransferenciaEstado.RECHAZADO;

  const updated = await prisma.transferencia.update({
    where: { id: transferenciaId },
    data: {
      verificado: estado,
      comentario: parsed.comentario,
      verificadoPorId: actor.id,
      verificadoAt: new Date(),
    },
    include: {
      pago: {
        include: { contrato: true },
      },
    },
  });

  if (estado === TransferenciaEstado.APROBADO) {
    await markPagoAsApproved(updated.pagoId, { metodo: PagoMetodo.TRANSFERENCIA });
  }

  return updated;
};

export const getTransferenciaFile = async (id: string, actor: AuthTokenPayload) => {
  if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw new HttpError(403, "Sólo administradores");
  }

  const transferencia = await prisma.transferencia.findUnique({
    where: { id },
    include: {
      pago: {
        include: { contrato: true },
      },
    },
  });
  if (!transferencia) {
    throw new HttpError(404, "Transferencia no encontrada");
  }

  if (
    actor.role === UserRole.ADMIN &&
    actor.inmobiliariaId &&
    transferencia.pago.contrato.inmobiliariaId !== actor.inmobiliariaId
  ) {
    throw new HttpError(403, "No tienes acceso a esta transferencia");
  }

  // Verificar que al menos uno de los comprobantes existe
  const propietarioExists = transferencia.comprobantePropietarioPath && fs.existsSync(transferencia.comprobantePropietarioPath);
  const inmobiliariaExists = transferencia.comprobanteInmobiliariaPath && fs.existsSync(transferencia.comprobanteInmobiliariaPath);
  
  if (!propietarioExists && !inmobiliariaExists) {
    throw new HttpError(404, "Archivos no encontrados");
  }

  return transferencia;
};

export const getTransferenciaFilePropietario = async (id: string, actor: AuthTokenPayload) => {
  if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN && actor.role !== UserRole.PROPIETARIO) {
    throw new HttpError(403, "No tenés permisos suficientes");
  }

  const transferencia = await prisma.transferencia.findUnique({
    where: { id },
    include: {
      pago: {
        include: { contrato: true },
      },
    },
  });
  if (!transferencia) {
    throw new HttpError(404, "Transferencia no encontrada");
  }

  // Validar permisos según el rol
  if (actor.role === UserRole.PROPIETARIO) {
    // El propietario solo puede ver su propio comprobante
    if (transferencia.pago.contrato.propietarioId !== actor.id) {
      throw new HttpError(403, "No tenés acceso a esta transferencia");
    }
  } else if (
    actor.role === UserRole.ADMIN &&
    actor.inmobiliariaId &&
    transferencia.pago.contrato.inmobiliariaId !== actor.inmobiliariaId
  ) {
    throw new HttpError(403, "No tienes acceso a esta transferencia");
  }

  if (!transferencia.comprobantePropietarioPath || !fs.existsSync(transferencia.comprobantePropietarioPath)) {
    throw new HttpError(404, "Comprobante del propietario no encontrado");
  }

  return transferencia;
};

export const getTransferenciaFileInmobiliaria = async (id: string, actor: AuthTokenPayload) => {
  if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw new HttpError(403, "Sólo administradores");
  }

  const transferencia = await prisma.transferencia.findUnique({
    where: { id },
    include: {
      pago: {
        include: { contrato: true },
      },
    },
  });
  if (!transferencia) {
    throw new HttpError(404, "Transferencia no encontrada");
  }

  if (
    actor.role === UserRole.ADMIN &&
    actor.inmobiliariaId &&
    transferencia.pago.contrato.inmobiliariaId !== actor.inmobiliariaId
  ) {
    throw new HttpError(403, "No tienes acceso a esta transferencia");
  }

  if (!transferencia.comprobanteInmobiliariaPath || !fs.existsSync(transferencia.comprobanteInmobiliariaPath)) {
    throw new HttpError(404, "Comprobante de la inmobiliaria no encontrado");
  }

  return transferencia;
};

const verifyComprobanteSchema = z.object({
  aprobar: z.boolean(),
  comentario: z.string().min(1, "El comentario es requerido al rechazar").max(500).optional(),
});

export const verificarComprobanteIndividual = async (
  transferenciaId: string,
  tipoComprobante: "PROPIETARIO" | "INMOBILIARIA",
  actor: AuthTokenPayload,
  body: unknown
) => {
  // Validar permisos según el tipo de comprobante
  if (tipoComprobante === "PROPIETARIO") {
    // Solo PROPIETARIO y SUPER_ADMIN pueden verificar comprobante del propietario
    if (actor.role !== UserRole.PROPIETARIO && actor.role !== UserRole.SUPER_ADMIN) {
      throw new HttpError(403, "Solo el propietario puede verificar su comprobante");
    }
  } else if (tipoComprobante === "INMOBILIARIA") {
    // Solo ADMIN y SUPER_ADMIN pueden verificar comprobante de la inmobiliaria
    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      throw new HttpError(403, "Solo la inmobiliaria puede verificar su comprobante");
    }
  }

  const parsed = verifyComprobanteSchema.parse(body);
  
  // Si está rechazando, el comentario es obligatorio
  if (!parsed.aprobar && !parsed.comentario) {
    throw new HttpError(400, "Debes proporcionar un comentario al rechazar un comprobante");
  }

  const transferencia = await prisma.transferencia.findUnique({
    where: { id: transferenciaId },
    include: {
      pago: {
        include: { contrato: true },
      },
      verificaciones: true,
    },
  });

  if (!transferencia) {
    throw new HttpError(404, "Transferencia no encontrada");
  }

  // Validar acceso según el rol
  if (actor.role === UserRole.ADMIN && actor.inmobiliariaId) {
    // Admin solo puede acceder a transferencias de su inmobiliaria
    if (transferencia.pago.contrato.inmobiliariaId !== actor.inmobiliariaId) {
      throw new HttpError(403, "No tienes acceso a esta transferencia");
    }
  } else if (actor.role === UserRole.PROPIETARIO) {
    // Propietario solo puede verificar comprobantes de sus propios contratos
    if (transferencia.pago.contrato.propietarioId !== actor.id) {
      throw new HttpError(403, "Solo puedes verificar comprobantes de tus propios contratos");
    }
    // Propietario solo puede verificar el comprobante del propietario
    if (tipoComprobante !== "PROPIETARIO") {
      throw new HttpError(403, "Solo puedes verificar tu propio comprobante");
    }
  }

  // Verificar que el comprobante correspondiente exista
  const comprobantePath = tipoComprobante === "PROPIETARIO" 
    ? transferencia.comprobantePropietarioPath 
    : transferencia.comprobanteInmobiliariaPath;

  if (!comprobantePath) {
    throw new HttpError(404, `Comprobante de ${tipoComprobante === "PROPIETARIO" ? "propietario" : "inmobiliaria"} no encontrado`);
  }

  // Crear o actualizar la verificación del comprobante
  const verificacion = await prisma.verificacionComprobante.upsert({
    where: {
      transferenciaId_tipoComprobante: {
        transferenciaId: transferenciaId,
        tipoComprobante: tipoComprobante as TipoComprobante,
      },
    },
    create: {
      transferenciaId: transferenciaId,
      tipoComprobante: tipoComprobante as TipoComprobante,
      verificado: parsed.aprobar,
      verificadoPorId: actor.id,
      comentario: parsed.comentario || null,
    },
    update: {
      verificado: parsed.aprobar,
      verificadoPorId: actor.id,
      comentario: parsed.comentario || null,
      verificadoAt: new Date(),
    },
  });

  // Obtener todas las verificaciones para esta transferencia
  const verificaciones = await prisma.verificacionComprobante.findMany({
    where: { transferenciaId: transferenciaId },
  });

  // Si ambos comprobantes están presentes y aprobados, aprobar el pago
  const tienePropietario = transferencia.comprobantePropietarioPath !== null;
  const tieneInmobiliaria = transferencia.comprobanteInmobiliariaPath !== null;
  
  const propietarioAprobado = verificaciones.find(v => v.tipoComprobante === "PROPIETARIO")?.verificado === true;
  const inmobiliariaAprobado = verificaciones.find(v => v.tipoComprobante === "INMOBILIARIA")?.verificado === true;

  // Determinar el estado de la transferencia
  let estadoTransferencia = transferencia.verificado;
  
  // Si ambos comprobantes están presentes y ambos están aprobados
  if (tienePropietario && tieneInmobiliaria && propietarioAprobado && inmobiliariaAprobado) {
    estadoTransferencia = TransferenciaEstado.APROBADO;
    await markPagoAsApproved(transferencia.pagoId, { metodo: PagoMetodo.TRANSFERENCIA });
  } 
  // Si solo hay un comprobante y está aprobado
  else if ((tienePropietario && !tieneInmobiliaria && propietarioAprobado) ||
           (!tienePropietario && tieneInmobiliaria && inmobiliariaAprobado)) {
    estadoTransferencia = TransferenciaEstado.APROBADO;
    await markPagoAsApproved(transferencia.pagoId, { metodo: PagoMetodo.TRANSFERENCIA });
  }
  // Si alguno fue rechazado
  else if (verificaciones.some(v => v.verificado === false)) {
    estadoTransferencia = TransferenciaEstado.RECHAZADO;
  }
  // Si tiene verificaciones pero no están todas aprobadas aún
  else if (verificaciones.length > 0) {
    estadoTransferencia = TransferenciaEstado.VERIFICADO;
  }

  // Actualizar el estado de la transferencia
  const updatedTransferencia = await prisma.transferencia.update({
    where: { id: transferenciaId },
    data: {
      verificado: estadoTransferencia,
      verificadoPorId: actor.id,
      verificadoAt: new Date(),
    },
    include: {
      pago: {
        include: { contrato: true },
      },
      verificaciones: true,
    },
  });

  return { transferencia: updatedTransferencia, verificacion };
};

