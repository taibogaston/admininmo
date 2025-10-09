import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getPrisma } from "../utils/prisma";
import { HttpError } from "../utils/errors";
import { AuthTokenPayload, MovimientoTipo, PagoEstado, PagoMetodo, UserRole } from "@admin-inmo/shared";
import { assertContratoAccess } from "./contractService";
import { mpClient } from "../utils/mp";
import { env } from "../env";

const prisma = getPrisma();

const generateSchema = z.object({
  contratoId: z.string().min(1),
  mes: z.string().regex(/^\d{4}-\d{2}$/),
  monto: z.number().positive().optional(),
});

type GenerateInput = z.infer<typeof generateSchema>;

export const generatePago = async (data: unknown, actor: AuthTokenPayload) => {
  if (![UserRole.ADMIN, UserRole.PROPIETARIO, UserRole.SUPER_ADMIN].includes(actor.role)) {
    throw new HttpError(403, "No tenés permisos para generar pagos");
  }
  const parsed: GenerateInput = generateSchema.parse(data);

  const contrato = await assertContratoAccess(parsed.contratoId, actor);

  const existing = await prisma.pago.findUnique({
    where: {
      contratoId_mes: {
        contratoId: parsed.contratoId,
        mes: parsed.mes,
      },
    },
  });
  if (existing) {
    throw new HttpError(409, "Ya existe un pago para el mes indicado");
  }

  const monto = parsed.monto ?? Number(contrato.montoMensual);
  const comision = Number(contrato.comisionMensual ?? 0);

  const pago = await prisma.pago.create({
    data: {
      contratoId: parsed.contratoId,
      mes: parsed.mes,
      monto: new Prisma.Decimal(monto),
      comision: new Prisma.Decimal(comision),
      estado: PagoEstado.PENDIENTE,
    },
  });

  await prisma.movimiento.create({
    data: {
      contratoId: parsed.contratoId,
      tipo: MovimientoTipo.CARGO,
      concepto: `Cargo mensual ${parsed.mes}`,
      monto: new Prisma.Decimal(monto),
      pagoId: pago.id,
    },
  });

  return pago;
};

export const getPagoById = async (pagoId: string, actor: AuthTokenPayload) => {
  const pago = await prisma.pago.findUnique({ where: { id: pagoId }, include: { contrato: true } });
  if (!pago) throw new HttpError(404, "Pago no encontrado");
  await assertContratoAccess(pago.contratoId, actor);
  return pago;
};

export const createMercadoPagoPreference = async (pagoId: string, actor: AuthTokenPayload) => {
  const pago = await getPagoById(pagoId, actor);

  if (!env.MP_ACCESS_TOKEN || env.MP_ACCESS_TOKEN.trim() === "") {
    throw new HttpError(400, "MercadoPago no está configurado. Configura MP_ACCESS_TOKEN para usar Mercado Pago");
  }

  // Temporal: MercadoPago no configurado, retornar error informativo
  throw new HttpError(503, "Funcionalidad de MercadoPago temporalmente deshabilitada. Configura MP_ACCESS_TOKEN para habilitarla.");
};

export const markPagoAsApproved = async (
  pagoId: string,
  data: { metodo: PagoMetodo; mpPaymentId?: string }
) => {
  const pago = await prisma.pago.update({
    where: { id: pagoId },
    data: {
      estado: PagoEstado.APROBADO,
      metodoPago: data.metodo,
      fechaPago: new Date(),
      mpPaymentId: data.mpPaymentId,
    },
  });

  await prisma.movimiento.create({
    data: {
      contratoId: pago.contratoId,
      tipo: MovimientoTipo.PAGO,
      concepto: `Pago ${pago.mes} (${data.metodo})`,
      monto: pago.monto,
      pagoId: pago.id,
    },
  });

  return pago;
};

export const processMercadoPagoWebhook = async (payload: any, _signature?: string) => {
  if (!env.MP_ACCESS_TOKEN || env.MP_ACCESS_TOKEN.trim() === "") {
    throw new HttpError(400, "MercadoPago no está configurado");
  }

  const type = payload?.type ?? payload?.type_id;

  if (type !== "payment") {
    return { handled: false };
  }

  const paymentId = payload?.data?.id || payload?.id;
  if (!paymentId) {
    throw new HttpError(400, "Webhook inválido");
  }

  // Temporal: MercadoPago no configurado
  throw new HttpError(503, "Webhook de MercadoPago temporalmente deshabilitado. Configura MP_ACCESS_TOKEN para habilitarlo.");
  
  /* Código comentado temporalmente:
  const response = await mpClient.payment.findById(paymentId);
  const payment = response.body;
  const externalRef = payment.external_reference;
  
  if (!externalRef) {
    throw new HttpError(400, "Pago sin referencia externa");
  }

  const pago = await prisma.pago.findUnique({ where: { id: externalRef } });
  if (!pago) {
    throw new HttpError(404, "Pago no encontrado");
  }

  if (payment.status === "approved" && pago.estado !== PagoEstado.APROBADO) {
    await markPagoAsApproved(pago.id, { metodo: PagoMetodo.MP, mpPaymentId: String(paymentId) });
  }

  return { handled: true };
  */
};

const transferenciaSchema = z.object({
  comentario: z.string().max(500).optional(),
});

export const registerTransferencia = async (
  pagoId: string,
  actor: AuthTokenPayload,
  file: Express.Multer.File,
  body: unknown
) => {
  const pago = await getPagoById(pagoId, actor);

  if (actor.role !== UserRole.INQUILINO && actor.role !== UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw new HttpError(403, "Sólo el inquilino puede cargar comprobantes");
  }

  if (actor.role === UserRole.INQUILINO && pago.contrato.inquilinoId !== actor.id) {
    throw new HttpError(403, "Este comprobante no te pertenece");
  }

  if (!file) throw new HttpError(400, "Archivo requerido");

  const parsed = transferenciaSchema.parse(body);

  const transferencia = await prisma.transferencia.upsert({
    where: { pagoId },
    update: {
      comprobantePath: file.path,
      verificado: "PENDIENTE",
      comentario: parsed.comentario,
    },
    create: {
      pagoId,
      comprobantePath: file.path,
      comentario: parsed.comentario,
    },
  });

  return transferencia;
};

export const listPagosByContrato = async (contratoId: string, actor: AuthTokenPayload) => {
  await assertContratoAccess(contratoId, actor);
  return prisma.pago.findMany({
    where: { contratoId },
    orderBy: { mes: "desc" },
  });
};

