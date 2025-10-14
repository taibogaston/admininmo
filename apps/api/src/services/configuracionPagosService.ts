import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getPrisma } from "../utils/prisma";
import { HttpError } from "../utils/errors";
import { AuthTokenPayload, UserRole } from "@admin-inmo/shared";

const prisma = getPrisma();

const configuracionSchema = z.object({
  cbuDestino: z.string().min(20).max(22),
  aliasCbu: z.string().max(50).optional(),
  banco: z.string().max(100).optional(),
  qrCode: z.string().optional(),
  activo: z.boolean().default(true),
  porcentajeComision: z.number().min(0).max(100).default(3.0),
});

type ConfiguracionInput = z.infer<typeof configuracionSchema>;

export const getConfiguracionPagos = async (inmobiliariaId: string, actor: AuthTokenPayload) => {
  if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(actor.role)) {
    throw new HttpError(403, "No tenés permisos para ver la configuración de pagos");
  }

  const inmobiliaria = await prisma.inmobiliaria.findUnique({
    where: { id: inmobiliariaId },
    include: { configuracionPagos: true },
  });

  if (!inmobiliaria) {
    throw new HttpError(404, "Inmobiliaria no encontrada");
  }

  // Verificar que el usuario pertenece a esta inmobiliaria (excepto super admin)
  if (actor.role === UserRole.ADMIN && actor.inmobiliariaId !== inmobiliariaId) {
    throw new HttpError(403, "No tenés permisos para ver esta configuración");
  }

  return {
    ...inmobiliaria.configuracionPagos,
    porcentajeComision: inmobiliaria.porcentajeComision,
  };
};

export const createOrUpdateConfiguracionPagos = async (
  inmobiliariaId: string,
  data: unknown,
  actor: AuthTokenPayload
) => {
  if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(actor.role)) {
    throw new HttpError(403, "No tenés permisos para configurar pagos");
  }

  const inmobiliaria = await prisma.inmobiliaria.findUnique({
    where: { id: inmobiliariaId },
  });

  if (!inmobiliaria) {
    throw new HttpError(404, "Inmobiliaria no encontrada");
  }

  // Verificar que el usuario pertenece a esta inmobiliaria (excepto super admin)
  if (actor.role === UserRole.ADMIN && actor.inmobiliariaId !== inmobiliariaId) {
    throw new HttpError(403, "No tenés permisos para configurar esta inmobiliaria");
  }

  const parsed: ConfiguracionInput = configuracionSchema.parse(data);

  // Actualizar el porcentaje de comisión de la inmobiliaria
  await prisma.inmobiliaria.update({
    where: { id: inmobiliariaId },
    data: { porcentajeComision: parsed.porcentajeComision },
  });

  const configuracion = await prisma.configuracionPagos.upsert({
    where: { inmobiliariaId },
    update: {
      cbuDestino: parsed.cbuDestino,
      aliasCbu: parsed.aliasCbu,
      banco: parsed.banco,
      qrCode: parsed.qrCode,
      activo: parsed.activo,
    },
    create: {
      inmobiliariaId,
      cbuDestino: parsed.cbuDestino,
      aliasCbu: parsed.aliasCbu,
      banco: parsed.banco,
      qrCode: parsed.qrCode,
      activo: parsed.activo,
    },
  });

  return configuracion;
};

export const getConfiguracionPagosPublica = async (inmobiliariaId: string) => {
  const inmobiliaria = await prisma.inmobiliaria.findUnique({
    where: { id: inmobiliariaId },
    include: { configuracionPagos: true },
  });

  if (!inmobiliaria?.configuracionPagos?.activo) {
    throw new HttpError(404, "Configuración de pagos no disponible");
  }

  // Solo devolver datos públicos necesarios para el pago
  return {
    cbuDestino: inmobiliaria.configuracionPagos.cbuDestino,
    aliasCbu: inmobiliaria.configuracionPagos.aliasCbu,
    banco: inmobiliaria.configuracionPagos.banco,
    qrCode: inmobiliaria.configuracionPagos.qrCode,
  };
};
