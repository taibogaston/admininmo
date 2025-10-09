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
          verificado: TransferenciaEstado.PENDIENTE,
          pago: { contrato: { inmobiliariaId: actor.inmobiliariaId } },
        }
      : { verificado: TransferenciaEstado.PENDIENTE };

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

  if (!fs.existsSync(transferencia.comprobantePath)) {
    throw new HttpError(404, "Archivo no encontrado");
  }

  return transferencia;
};

