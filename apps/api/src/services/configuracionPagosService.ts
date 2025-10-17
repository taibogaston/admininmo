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
  porcentajeComision: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 3.0;
    return Math.max(0, Math.min(100, num));
  }).default(3.0),
});

const configuracionInmobiliariaSchema = z.object({
  cbuDestino: z.string().min(20).max(22),
  aliasCbu: z.string().max(50).optional(),
  banco: z.string().max(100).optional(),
  qrCode: z.string().optional(),
  activo: z.boolean().default(true),
});

const configuracionPropietarioSchema = z.object({
  cbuDestino: z.string().min(20).max(22),
  aliasCbu: z.string().max(50).optional(),
  banco: z.string().max(100).optional(),
  qrCode: z.string().optional(),
  activo: z.boolean().default(true),
});

type ConfiguracionInput = z.infer<typeof configuracionSchema>;
type ConfiguracionInmobiliariaInput = z.infer<typeof configuracionInmobiliariaSchema>;
type ConfiguracionPropietarioInput = z.infer<typeof configuracionPropietarioSchema>;

export const getConfiguracionPagos = async (inmobiliariaId: string, actor: AuthTokenPayload) => {
  if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(actor.role)) {
    throw new HttpError(403, "No tenés permisos para ver la configuración de pagos");
  }

  const inmobiliaria = await prisma.inmobiliaria.findUnique({
    where: { id: inmobiliariaId },
    include: { 
      configuracionPagosInmobiliaria: true,
      configuracionPagosPropietario: true 
    },
  });

  if (!inmobiliaria) {
    throw new HttpError(404, "Inmobiliaria no encontrada");
  }

  // Verificar que el usuario pertenece a esta inmobiliaria (excepto super admin)
  if (actor.role === UserRole.ADMIN && actor.inmobiliariaId !== inmobiliariaId) {
    throw new HttpError(403, "No tenés permisos para ver esta configuración");
  }

  return {
    inmobiliaria: inmobiliaria.configuracionPagosInmobiliaria,
    propietario: inmobiliaria.configuracionPagosPropietario,
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

  const configuracion = await prisma.configuracionPagosInmobiliaria.upsert({
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

export const createOrUpdateConfiguracionPagosInmobiliaria = async (
  inmobiliariaId: string,
  data: unknown,
  actor: AuthTokenPayload
) => {
  if (actor.role !== UserRole.ADMIN) {
    throw new HttpError(403, "Solo los administradores pueden configurar pagos");
  }

  const inmobiliaria = await prisma.inmobiliaria.findUnique({
    where: { id: inmobiliariaId },
  });

  if (!inmobiliaria) {
    throw new HttpError(404, "Inmobiliaria no encontrada");
  }

  // Verificar que el usuario pertenece a esta inmobiliaria
  if (actor.inmobiliariaId !== inmobiliariaId) {
    throw new HttpError(403, "No tenés permisos para configurar esta inmobiliaria");
  }

  const parsed: ConfiguracionInmobiliariaInput = configuracionInmobiliariaSchema.parse(data);

  const configuracion = await prisma.configuracionPagosInmobiliaria.upsert({
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

export const createOrUpdateConfiguracionPagosPropietario = async (
  inmobiliariaId: string,
  data: unknown,
  actor: AuthTokenPayload
) => {
  if (actor.role !== UserRole.ADMIN) {
    throw new HttpError(403, "Solo los administradores pueden configurar pagos");
  }

  const inmobiliaria = await prisma.inmobiliaria.findUnique({
    where: { id: inmobiliariaId },
  });

  if (!inmobiliaria) {
    throw new HttpError(404, "Inmobiliaria no encontrada");
  }

  // Verificar que el usuario pertenece a esta inmobiliaria
  if (actor.inmobiliariaId !== inmobiliariaId) {
    throw new HttpError(403, "No tenés permisos para configurar esta inmobiliaria");
  }

  const parsed: ConfiguracionPropietarioInput = configuracionPropietarioSchema.parse(data);

  const configuracion = await prisma.configuracionPagosPropietario.upsert({
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
    include: { 
      configuracionPagosInmobiliaria: true,
      configuracionPagosPropietario: true 
    },
  });

  if (!inmobiliaria) {
    throw new HttpError(404, "Inmobiliaria no encontrada");
  }

  // Verificar que al menos una configuración esté activa
  const inmobiliariaActiva = inmobiliaria.configuracionPagosInmobiliaria?.activo;
  const propietarioActivo = inmobiliaria.configuracionPagosPropietario?.activo;

  if (!inmobiliariaActiva && !propietarioActivo) {
    throw new HttpError(404, "Configuración de pagos no disponible");
  }

  // Solo devolver datos públicos necesarios para el pago
  return {
    inmobiliaria: inmobiliaria.configuracionPagosInmobiliaria?.activo ? {
      cbuDestino: inmobiliaria.configuracionPagosInmobiliaria.cbuDestino,
      aliasCbu: inmobiliaria.configuracionPagosInmobiliaria.aliasCbu,
      banco: inmobiliaria.configuracionPagosInmobiliaria.banco,
      qrCode: inmobiliaria.configuracionPagosInmobiliaria.qrCode,
    } : null,
    propietario: inmobiliaria.configuracionPagosPropietario?.activo ? {
      cbuDestino: inmobiliaria.configuracionPagosPropietario.cbuDestino,
      aliasCbu: inmobiliaria.configuracionPagosPropietario.aliasCbu,
      banco: inmobiliaria.configuracionPagosPropietario.banco,
      qrCode: inmobiliaria.configuracionPagosPropietario.qrCode,
    } : null,
  };
};
