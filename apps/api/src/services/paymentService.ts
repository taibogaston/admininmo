import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getPrisma } from "../utils/prisma";
import { HttpError } from "../utils/errors";
import { AuthTokenPayload, MovimientoTipo, PagoEstado, PagoMetodo, UserRole, TransferenciaEstado } from "@admin-inmo/shared";
import { assertContratoAccess } from "./contractService";
import { mpClient } from "../utils/mp";
import { env } from "../env";
import { notifyPagoApproved, notifyPagoRejected, notifyTransferenciaVerificada } from "./notificationService";

const prisma = getPrisma();

const generateSchema = z.object({
  contratoId: z.string().min(1),
  mes: z.string().regex(/^\d{4}-\d{2}$/),
  monto: z.number().positive().optional(),
});

type GenerateInput = z.infer<typeof generateSchema>;

export const generatePago = async (data: unknown, actor: AuthTokenPayload) => {
  if (![UserRole.ADMIN, UserRole.PROPIETARIO, UserRole.SUPER_ADMIN, UserRole.INQUILINO].includes(actor.role)) {
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

  // El monto total del alquiler (lo que paga el inquilino)
  const montoTotal = parsed.monto ?? Number(contrato.montoTotalAlquiler);
  
  // Obtener el porcentaje de comisión del contrato (para la inmobiliaria)
  const porcentajeComisionInmobiliaria = Number(contrato.porcentajeComisionInmobiliaria);
  const comisionInmobiliaria = (montoTotal * porcentajeComisionInmobiliaria) / 100;
  
  // El monto que se muestra al inquilino es el total del alquiler
  const monto = montoTotal;
  const comision = comisionInmobiliaria;

  // Generar external ID único con formato: ALQ-YYYYMM-<timestamp>
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-8);
  const externalId = `ALQ-${year}${month}-${timestamp}`;

  const pago = await prisma.pago.create({
    data: {
      contratoId: parsed.contratoId,
      mes: parsed.mes,
      monto: new Prisma.Decimal(monto),
      comision: new Prisma.Decimal(comision),
      estado: PagoEstado.PENDIENTE,
      externalId,
    } as any, // Temporary fix until Prisma client is regenerated
  });

  await prisma.movimiento.create({
    data: {
      contratoId: parsed.contratoId,
      tipo: MovimientoTipo.CARGO,
      concepto: `Alquiler ${parsed.mes}`,
      monto: new Prisma.Decimal(monto),
      pagoId: pago.id,
    },
  });

  return pago;
};

export const getPagoById = async (pagoId: string, actor: AuthTokenPayload) => {
  const pago = await prisma.pago.findUnique({
    where: { id: pagoId },
    include: {
      contrato: {
        include: {
          inmobiliaria: true,
          propietario: true,
          inquilino: true,
        },
      },
      transferencia: true,
    },
  });

  if (!pago) {
    throw new HttpError(404, "Pago no encontrado");
  }

  await assertContratoAccess(pago.contratoId, actor);
  return pago;
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

  // Verificar si ya existe un movimiento para este pago
  const existingMovimiento = await prisma.movimiento.findUnique({
    where: { pagoId: pago.id }
  });

  if (existingMovimiento) {
    // Actualizar el movimiento existente
    await prisma.movimiento.update({
      where: { id: existingMovimiento.id },
      data: {
        tipo: MovimientoTipo.PAGO,
        concepto: `Pago ${pago.mes} (${data.metodo})`,
      },
    });
  } else {
    // Crear nuevo movimiento si no existe
    await prisma.movimiento.create({
      data: {
        contratoId: pago.contratoId,
        tipo: MovimientoTipo.PAGO,
        concepto: `Pago ${pago.mes} (${data.metodo})`,
        monto: pago.monto,
        pagoId: pago.id,
      },
    });
  }

  return pago;
};

export const processMercadoPagoWebhook = async (data: unknown) => {
  const webhookSchema = z.object({
    type: z.string(),
    data: z.object({
      id: z.string(),
    }),
  });

  const parsed = webhookSchema.parse(data);

  if (parsed.type !== "payment") {
    return { handled: false };
  }

  const paymentId = parsed.data.id;

  try {
    const payment = await mpClient.payment.get(paymentId);
    
    if (payment.status !== "approved") {
      return { handled: true };
    }

    const pago = await prisma.pago.findFirst({
      where: { mpPaymentId: paymentId },
    });

    if (!pago) {
      console.log(`Payment ${paymentId} not found in database`);
      return { handled: true };
    }

    await markPagoAsApproved(pago.id, {
      metodo: PagoMetodo.MP,
      mpPaymentId: paymentId,
    });

    console.log(`Payment ${paymentId} marked as approved`);
    return { handled: true };
  } catch (error) {
    console.error("Error processing MercadoPago webhook:", error);
    return { handled: false };
  }

  /*
  return { handled: true };
  */
};

const transferenciaSchema = z.object({
  comentario: z.string().max(500).optional(),
});

export const registerTransferencia = async (
  pagoId: string,
  actor: AuthTokenPayload,
  files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined,
  body: unknown
) => {
  const pago = await getPagoById(pagoId, actor);

  if (actor.role !== UserRole.INQUILINO) {
    throw new HttpError(403, "Sólo el inquilino puede cargar comprobantes");
  }

  if (pago.contrato.inquilinoId !== actor.id) {
    throw new HttpError(403, "Este comprobante no te pertenece");
  }

  const parsed = transferenciaSchema.parse(body);

  // Manejar upload dual
  let comprobantePropietarioPath: string | undefined;
  let comprobanteInmobiliariaPath: string | undefined;

  if (files && typeof files === 'object' && !Array.isArray(files)) {
    // Upload dual con campos separados
    if (files.comprobantePropietario && files.comprobantePropietario[0]) {
      comprobantePropietarioPath = files.comprobantePropietario[0].path;
    }
    if (files.comprobanteInmobiliaria && files.comprobanteInmobiliaria[0]) {
      comprobanteInmobiliariaPath = files.comprobanteInmobiliaria[0].path;
    }
  } else if (files && Array.isArray(files) && files[0]) {
    // Upload simple (legacy)
    comprobantePropietarioPath = files[0].path;
  }

  if (!comprobantePropietarioPath && !comprobanteInmobiliariaPath) {
    throw new HttpError(400, "Debes subir al menos un comprobante");
  }

  // Verificar si ya existe una transferencia
  const existingTransferencia = await prisma.transferencia.findUnique({
    where: { pagoId },
    include: { verificaciones: true },
  });

  // Si se está resubiendo un comprobante, eliminar la verificación anterior de ese tipo
  if (existingTransferencia) {
    const tiposAEliminar: string[] = [];
    
    if (comprobantePropietarioPath) {
      tiposAEliminar.push("PROPIETARIO");
    }
    if (comprobanteInmobiliariaPath) {
      tiposAEliminar.push("INMOBILIARIA");
    }

    // Eliminar verificaciones anteriores de los comprobantes que se están resubiendo
    if (tiposAEliminar.length > 0) {
      await prisma.verificacionComprobante.deleteMany({
        where: {
          transferenciaId: existingTransferencia.id,
          tipoComprobante: { in: tiposAEliminar as any },
        },
      });
    }
  }

  const transferencia = await prisma.transferencia.upsert({
    where: { pagoId },
    update: {
      comprobantePropietarioPath: comprobantePropietarioPath || existingTransferencia?.comprobantePropietarioPath,
      comprobanteInmobiliariaPath: comprobanteInmobiliariaPath || existingTransferencia?.comprobanteInmobiliariaPath,
      verificado: TransferenciaEstado.PENDIENTE_VERIFICACION,
      comentario: parsed.comentario,
    },
    create: {
      pagoId,
      comprobantePropietarioPath,
      comprobanteInmobiliariaPath,
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

// Función para verificar un comprobante específico (SUPER_ADMIN, ADMIN, PROPIETARIO)
export const verificarTransferencia = async (
  pagoId: string,
  data: { verificado: boolean; comentario?: string; tipoComprobante?: string },
  actor: AuthTokenPayload
) => {
  if (actor.role !== UserRole.SUPER_ADMIN && actor.role !== UserRole.ADMIN && actor.role !== UserRole.PROPIETARIO) {
    throw new HttpError(403, "No tenés permisos para verificar transferencias");
  }

  const pago = await getPagoById(pagoId, actor);
  
  const transferencia = await prisma.transferencia.findUnique({
    where: { pagoId },
    include: { 
      pago: { include: { contrato: { include: { inmobiliaria: true } } } },
      verificaciones: { include: { verificadoPor: true } }
    }
  });

  if (!transferencia) {
    throw new HttpError(404, "Transferencia no encontrada");
  }

  // Determinar qué tipo de comprobante puede verificar el usuario
  let tipoComprobante: string;
  if (actor.role === UserRole.ADMIN) {
    // ADMIN solo puede verificar comprobante de inmobiliaria
    tipoComprobante = "INMOBILIARIA";
    if (actor.inmobiliariaId && transferencia.pago.contrato.inmobiliariaId !== actor.inmobiliariaId) {
      throw new HttpError(403, "No tienes acceso a esta transferencia");
    }
  } else if (actor.role === UserRole.PROPIETARIO) {
    // PROPIETARIO solo puede verificar su comprobante
    tipoComprobante = "PROPIETARIO";
    if (transferencia.pago.contrato.propietarioId !== actor.id) {
      throw new HttpError(403, "No tienes acceso a esta transferencia");
    }
  } else {
    // SUPER_ADMIN puede verificar cualquier comprobante
    if (!data.tipoComprobante) {
      throw new HttpError(400, "Debes especificar el tipo de comprobante a verificar");
    }
    tipoComprobante = data.tipoComprobante;
  }

  // Verificar que el comprobante existe
  if (tipoComprobante === "PROPIETARIO" && !transferencia.comprobantePropietarioPath) {
    throw new HttpError(400, "No existe comprobante del propietario para verificar");
  }
  if (tipoComprobante === "INMOBILIARIA" && !transferencia.comprobanteInmobiliariaPath) {
    throw new HttpError(400, "No existe comprobante de la inmobiliaria para verificar");
  }

  // Crear o actualizar la verificación del comprobante
  const verificacion = await prisma.verificacionComprobante.upsert({
    where: {
      transferenciaId_tipoComprobante: {
        transferenciaId: transferencia.id,
        tipoComprobante: tipoComprobante as any
      }
    },
    update: {
      verificado: data.verificado,
      verificadoPorId: actor.id,
      verificadoAt: new Date(),
      comentario: data.comentario,
    },
    create: {
      transferenciaId: transferencia.id,
      tipoComprobante: tipoComprobante as any,
      verificado: data.verificado,
      verificadoPorId: actor.id,
      comentario: data.comentario,
    },
  });

  // Verificar si ambos comprobantes están aprobados para cambiar el estado general
  const verificaciones = await prisma.verificacionComprobante.findMany({
    where: { transferenciaId: transferencia.id }
  });

  const comprobantePropietarioVerificado = verificaciones.find(v => v.tipoComprobante === "PROPIETARIO" && v.verificado);
  const comprobanteInmobiliariaVerificado = verificaciones.find(v => v.tipoComprobante === "INMOBILIARIA" && v.verificado);

  let nuevoEstadoGeneral: string;
  if (data.verificado === false) {
    // Si se rechaza cualquier comprobante, la transferencia se rechaza
    nuevoEstadoGeneral = TransferenciaEstado.RECHAZADO;
  } else if (comprobantePropietarioVerificado && comprobanteInmobiliariaVerificado) {
    // Si ambos comprobantes están aprobados, la transferencia se aprueba
    nuevoEstadoGeneral = TransferenciaEstado.APROBADO;
  } else {
    // Si solo uno está aprobado, sigue pendiente
    nuevoEstadoGeneral = TransferenciaEstado.PENDIENTE_VERIFICACION;
  }

  // Actualizar el estado general de la transferencia
  const transferenciaActualizada = await prisma.transferencia.update({
    where: { pagoId },
    data: {
      verificado: nuevoEstadoGeneral as any,
      verificadoPorId: actor.id,
      verificadoAt: new Date(),
      comentario: data.comentario,
    },
    include: {
      verificaciones: { include: { verificadoPor: true } }
    }
  });

  // If fully approved, mark the payment as approved
  if (nuevoEstadoGeneral === TransferenciaEstado.APROBADO) {
    await markPagoAsApproved(pagoId, { metodo: PagoMetodo.TRANSFERENCIA });
    // Notificar a todas las partes
    await notifyPagoApproved(pagoId);
  } else if (nuevoEstadoGeneral === TransferenciaEstado.RECHAZADO) {
    // Notificar rechazo
    await notifyPagoRejected(pagoId, data.comentario);
  }

  // Notificar al inquilino sobre el estado de la verificación
  await notifyTransferenciaVerificada(pagoId, data.verificado);

  return transferenciaActualizada;
};

// Función para ejecutar transferencias manuales (SUPER_ADMIN y ADMIN)
// Función para calcular la división de montos
export const calcularDivisionMontos = async (pagoId: string) => {
  const pago = await prisma.pago.findUnique({
    where: { id: pagoId },
    include: { 
      contrato: { 
        include: { 
          inmobiliaria: true,
          propietario: true,
          inquilino: true
        } 
      } 
    }
  });

  if (!pago) {
    throw new HttpError(404, "Pago no encontrado");
  }

  const montoTotal = Number(pago.monto); // Este es el monto total que paga el inquilino
  const porcentajeComisionInmobiliaria = Number(pago.contrato.porcentajeComisionInmobiliaria);
  const porcentajeComisionApp = Number(pago.contrato.inmobiliaria.porcentajeComision ?? 2.0); // Comisión de la app (ej: 2%)
  
  // Calcular comisión de la inmobiliaria (porcentaje del total del alquiler)
  const comisionInmobiliaria = (montoTotal * porcentajeComisionInmobiliaria) / 100;
  
  // Calcular comisión de la app sobre la comisión de la inmobiliaria
  const comisionApp = (comisionInmobiliaria * porcentajeComisionApp) / 100;
  
  // La inmobiliaria recibe su comisión menos la comisión de la app
  const montoInmobiliaria = comisionInmobiliaria - comisionApp;
  
  // El propietario recibe el resto (total - comisión inmobiliaria)
  const montoPropietario = montoTotal - comisionInmobiliaria;
  
  return {
    montoTotal,
    montoPropietario,
    montoInmobiliaria,
    comisionInmobiliaria,
    comisionApp,
    porcentajeComisionInmobiliaria,
    porcentajeComisionApp,
    propietario: pago.contrato.propietario,
    inquilino: pago.contrato.inquilino,
    inmobiliaria: pago.contrato.inmobiliaria
  };
};

export const ejecutarTransferenciasManuales = async (
  pagoId: string,
  data: {
    transferenciaPropietarioId: string;
    transferenciaInmobiliariaId: string;
    comentario?: string;
  },
  actor: AuthTokenPayload
) => {
  if (actor.role !== UserRole.SUPER_ADMIN && actor.role !== UserRole.ADMIN) {
    throw new HttpError(403, "No tenés permisos para ejecutar transferencias");
  }

  const pago = await getPagoById(pagoId, actor);
  
  const transferencia = await prisma.transferencia.findUnique({
    where: { pagoId },
    include: { pago: { include: { contrato: { include: { inmobiliaria: true } } } } }
  });

  if (!transferencia) {
    throw new HttpError(404, "Transferencia no encontrada");
  }

  // Verificar que el ADMIN solo puede ejecutar transferencias de su inmobiliaria
  if (
    actor.role === UserRole.ADMIN &&
    actor.inmobiliariaId &&
    transferencia.pago.contrato.inmobiliariaId !== actor.inmobiliariaId
  ) {
    throw new HttpError(403, "No tienes acceso a esta transferencia");
  }

  if (transferencia.verificado !== TransferenciaEstado.VERIFICADO) {
    throw new HttpError(400, "La transferencia debe estar verificada antes de ejecutar");
  }

  // Calcular los montos correctamente
  const divisionMontos = await calcularDivisionMontos(pagoId);

  // Actualizar la transferencia con los IDs de las transferencias ejecutadas
  const transferenciaActualizada = await prisma.transferencia.update({
    where: { pagoId },
    data: {
      verificado: TransferenciaEstado.APROBADO,
      transferenciaPropietarioId: data.transferenciaPropietarioId,
      transferenciaInmobiliariaId: data.transferenciaInmobiliariaId,
      comentario: data.comentario,
    },
  });

  // Marcar el pago como aprobado
  await markPagoAsApproved(pagoId, { metodo: PagoMetodo.TRANSFERENCIA });

  // Notificar a todas las partes
  await notifyPagoApproved(pagoId);

  return {
    ...transferenciaActualizada,
    divisionMontos
  };
};

// Función para obtener transferencias pendientes de verificación (SUPER_ADMIN y ADMIN)
export const listTransferenciasPendientes = async (inmobiliariaId: string, actor: AuthTokenPayload) => {
  if (actor.role !== UserRole.SUPER_ADMIN && actor.role !== UserRole.ADMIN) {
    throw new HttpError(403, "No tenés permisos para ver transferencias pendientes");
  }

  // Verificar que el ADMIN solo puede ver transferencias de su inmobiliaria
  if (
    actor.role === UserRole.ADMIN &&
    actor.inmobiliariaId &&
    inmobiliariaId !== actor.inmobiliariaId
  ) {
    throw new HttpError(403, "No tienes acceso a transferencias de esta inmobiliaria");
  }

  const whereClause: any = {
    verificado: TransferenciaEstado.PENDIENTE_VERIFICACION,
    pago: {
      contrato: {
        inmobiliariaId: inmobiliariaId,
      }
    }
  };

  return prisma.transferencia.findMany({
    where: whereClause,
    include: {
      pago: {
        include: {
          contrato: {
            include: {
              inmobiliaria: true,
              propietario: true,
              inquilino: true,
            }
          }
        }
      },
      verificaciones: {
        include: {
          verificadoPor: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
};

// Función para que ADMIN vea transferencias de su inmobiliaria (solo lectura)
export const listTransferenciasInmobiliaria = async (actor: AuthTokenPayload) => {
  if (actor.role !== UserRole.ADMIN) {
    throw new HttpError(403, "Solo los administradores de inmobiliaria pueden ver estas transferencias");
  }

  if (!actor.inmobiliariaId) {
    throw new HttpError(400, "Usuario sin inmobiliaria asignada");
  }

  return prisma.transferencia.findMany({
    where: {
      pago: {
        contrato: {
          inmobiliariaId: actor.inmobiliariaId,
        }
      }
    },
    include: {
      pago: {
        include: {
          contrato: {
            include: {
              inmobiliaria: true,
              propietario: true,
              inquilino: true,
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
};

// Función para que PROPIETARIO vea sus transferencias
export const listTransferenciasPropietario = async (propietarioId: string, actor: AuthTokenPayload) => {
  if (actor.role !== UserRole.PROPIETARIO) {
    throw new HttpError(403, "Solo los propietarios pueden ver estas transferencias");
  }

  // Verificar que el propietario solo puede ver sus propias transferencias
  if (actor.id !== propietarioId) {
    throw new HttpError(403, "No tienes acceso a estas transferencias");
  }

  return prisma.transferencia.findMany({
    where: {
      pago: {
        contrato: {
          propietarioId: propietarioId,
        }
      }
    },
    include: {
      pago: {
        include: {
          contrato: {
            include: {
              inmobiliaria: true,
              propietario: true,
              inquilino: true,
            }
          }
        }
      },
      verificaciones: {
        include: {
          verificadoPor: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
};