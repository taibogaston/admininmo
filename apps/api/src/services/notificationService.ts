import { getPrisma } from "../utils/prisma";
import { PagoEstado } from "@admin-inmo/shared";

const prisma = getPrisma();

export interface NotificationData {
  tipo: string;
  titulo: string;
  mensaje: string;
  userId?: string;
  inmobiliariaId?: string;
  pagoId?: string;
}

export const createNotification = async (data: NotificationData) => {
  return prisma.notificacion.create({
    data: {
      tipo: data.tipo,
      titulo: data.titulo,
      mensaje: data.mensaje,
      userId: data.userId,
      inmobiliariaId: data.inmobiliariaId,
      pagoId: data.pagoId,
    },
  });
};

export const createBulkNotifications = async (notifications: NotificationData[]) => {
  return prisma.notificacion.createMany({
    data: notifications,
  });
};

export const getNotificationsByUser = async (userId: string, limit: number = 50) => {
  return prisma.notificacion.findMany({
    where: {
      OR: [
        { userId },
        { 
          inmobiliariaId: {
            not: null
          }
        }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

export const markNotificationAsRead = async (notificationId: string) => {
  return prisma.notificacion.update({
    where: { id: notificationId },
    data: { leida: true },
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  return prisma.notificacion.updateMany({
    where: { userId },
    data: { leida: true },
  });
};

// Funciones específicas para notificaciones de pagos
export const notifyPagoApproved = async (pagoId: string) => {
  const pago = await prisma.pago.findUnique({
    where: { id: pagoId },
    include: {
      contrato: {
        include: {
          inmobiliaria: true,
          propietario: true,
          inquilino: true,
        }
      }
    }
  });

  if (!pago) return;

  const notifications = [
    {
      tipo: 'PAGO_APROBADO',
      titulo: 'Pago Aprobado',
      mensaje: `Tu pago del mes ${pago.mes} por $${pago.monto} ha sido aprobado.`,
      userId: pago.contrato.inquilinoId,
      pagoId: pago.id,
    },
    {
      tipo: 'PAGO_APROBADO',
      titulo: 'Pago Aprobado',
      mensaje: `El pago del inquilino ${pago.contrato.inquilino.nombre} ${pago.contrato.inquilino.apellido} del mes ${pago.mes} ha sido aprobado.`,
      userId: pago.contrato.propietarioId,
      pagoId: pago.id,
    },
    {
      tipo: 'PAGO_APROBADO',
      titulo: 'Pago Aprobado',
      mensaje: `El pago del mes ${pago.mes} en el contrato ${pago.contrato.direccion} ha sido aprobado.`,
      inmobiliariaId: pago.contrato.inmobiliariaId,
      pagoId: pago.id,
    }
  ];

  await createBulkNotifications(notifications);
};

export const notifyPagoRejected = async (pagoId: string, motivo?: string) => {
  const pago = await prisma.pago.findUnique({
    where: { id: pagoId },
    include: {
      contrato: {
        include: {
          inmobiliaria: true,
          propietario: true,
          inquilino: true,
        }
      }
    }
  });

  if (!pago) return;

  const motivoText = motivo ? ` Motivo: ${motivo}` : '';
  
  const notifications = [
    {
      tipo: 'PAGO_RECHAZADO',
      titulo: 'Pago Rechazado',
      mensaje: `Tu pago del mes ${pago.mes} por $${pago.monto} ha sido rechazado.${motivoText}`,
      userId: pago.contrato.inquilinoId,
      pagoId: pago.id,
    },
    {
      tipo: 'PAGO_RECHAZADO',
      titulo: 'Pago Rechazado',
      mensaje: `El pago del inquilino ${pago.contrato.inquilino.nombre} ${pago.contrato.inquilino.apellido} del mes ${pago.mes} ha sido rechazado.${motivoText}`,
      userId: pago.contrato.propietarioId,
      pagoId: pago.id,
    },
    {
      tipo: 'PAGO_RECHAZADO',
      titulo: 'Pago Rechazado',
      mensaje: `El pago del mes ${pago.mes} en el contrato ${pago.contrato.direccion} ha sido rechazado.${motivoText}`,
      inmobiliariaId: pago.contrato.inmobiliariaId,
      pagoId: pago.id,
    }
  ];

  await createBulkNotifications(notifications);
};

export const notifyTransferenciaVerificada = async (pagoId: string, aprobada: boolean) => {
  const pago = await prisma.pago.findUnique({
    where: { id: pagoId },
    include: {
      contrato: {
        include: {
          inmobiliaria: true,
          propietario: true,
          inquilino: true,
        }
      }
    }
  });

  if (!pago) return;

  const tipo = aprobada ? 'TRANSFERENCIA_APROBADA' : 'TRANSFERENCIA_RECHAZADA';
  const titulo = aprobada ? 'Transferencia Aprobada' : 'Transferencia Rechazada';
  const mensaje = aprobada 
    ? `Tu transferencia del mes ${pago.mes} ha sido verificada y aprobada.`
    : `Tu transferencia del mes ${pago.mes} ha sido rechazada. Por favor, contacta a la administración.`;

  const notifications = [
    {
      tipo,
      titulo,
      mensaje,
      userId: pago.contrato.inquilinoId,
      pagoId: pago.id,
    }
  ];

  await createBulkNotifications(notifications);
};
