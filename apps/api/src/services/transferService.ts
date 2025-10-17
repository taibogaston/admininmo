import { z } from "zod";
import fs from "fs";
import { getPrisma } from "../utils/prisma";
import { AuthTokenPayload, TransferenciaEstado, UserRole, PagoMetodo } from "@admin-inmo/shared";
import { HttpError } from "../utils/errors";
import { markPagoAsApproved } from "./paymentService";

const prisma = getPrisma();

export const listTransferenciasPendientes = async (actor: AuthTokenPayload) => {
  if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw new HttpError(403, "Sólo administradores");
  }

  const where =
    actor.role === UserRole.ADMIN && actor.inmobiliariaId
      ? {
          verificado: TransferenciaEstado.PENDIENTE_VERIFICACION,
          pago: { contrato: { inmobiliariaId: actor.inmobiliariaId } },
        }
      : { verificado: TransferenciaEstado.PENDIENTE_VERIFICACION };

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

