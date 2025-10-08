import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AuthTokenPayload, DescuentoEstado, UserRole } from "@admin-inmo/shared";
import { getPrisma } from "../utils/prisma";
import { HttpError } from "../utils/errors";
import { assertContratoAccess } from "./contractService";

const prisma = getPrisma();

const descuentoCreateSchema = z.object({
  monto: z.number().positive(),
  motivo: z.string().min(3).max(500),
});

const descuentoEstadoSchema = z.object({
  estado: z.nativeEnum(DescuentoEstado),
});

export const createContratoDescuento = async (contratoId: string, actor: AuthTokenPayload, data: unknown) => {
  const contrato = await assertContratoAccess(contratoId, actor);

  if (![UserRole.INQUILINO, UserRole.ADMIN].includes(actor.role)) {
    throw new HttpError(403, "Solo el inquilino puede cargar descuentos");
  }

  if (actor.role === UserRole.INQUILINO && contrato.inquilinoId !== actor.id) {
    throw new HttpError(403, "No tenes acceso a este contrato");
  }

  const parsed = descuentoCreateSchema.parse(data);

  const descuento = await prisma.descuento.create({
    data: {
      contratoId,
      inquilinoId: contrato.inquilinoId,
      monto: new Prisma.Decimal(parsed.monto),
      motivo: parsed.motivo,
    },
  });

  return descuento;
};

export const listContratoDescuentos = async (contratoId: string, actor: AuthTokenPayload) => {
  await assertContratoAccess(contratoId, actor);
  return prisma.descuento.findMany({
    where: { contratoId },
    orderBy: { createdAt: "desc" },
  });
};

export const listDescuentos = async (actor: AuthTokenPayload) => {
  if (actor.role !== UserRole.ADMIN) {
    throw new HttpError(403, "Solo el administrador puede ver todos los descuentos");
  }

  return prisma.descuento.findMany({
    include: {
      contrato: {
        include: { propietario: true, inquilino: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const updateDescuentoEstado = async (descuentoId: string, actor: AuthTokenPayload, data: unknown) => {
  if (actor.role !== UserRole.ADMIN) {
    throw new HttpError(403, "Solo el administrador puede actualizar descuentos");
  }

  const parsed = descuentoEstadoSchema.parse(data);

  return prisma.descuento.update({
    where: { id: descuentoId },
    data: { estado: parsed.estado },
    include: {
      contrato: {
        include: { propietario: true, inquilino: true },
      },
    },
  });
};
