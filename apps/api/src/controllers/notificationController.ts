import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/errors";
import { 
  getNotificationsByUser, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  createNotification 
} from "../services/notificationService";
import { AuthTokenPayload } from "@admin-inmo/shared";

export const getNotificationsController = asyncHandler(async (req: Request, res: Response) => {
  const actor = req.user as AuthTokenPayload;
  const limit = parseInt(req.query.limit as string) || 50;

  const notifications = await getNotificationsByUser(actor.id, limit);

  res.json(notifications);
});

export const markNotificationAsReadController = asyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;
  const actor = req.user as AuthTokenPayload;

  // Verificar que la notificación pertenece al usuario
  const notification = await getNotificationsByUser(actor.id);
  const userNotification = notification.find(n => n.id === notificationId);
  
  if (!userNotification) {
    throw new HttpError(404, "Notificación no encontrada");
  }

  const updatedNotification = await markNotificationAsRead(notificationId);

  res.json(updatedNotification);
});

export const markAllNotificationsAsReadController = asyncHandler(async (req: Request, res: Response) => {
  const actor = req.user as AuthTokenPayload;

  await markAllNotificationsAsRead(actor.id);

  res.json({ message: "Todas las notificaciones marcadas como leídas" });
});

export const createNotificationController = asyncHandler(async (req: Request, res: Response) => {
  const actor = req.user as AuthTokenPayload;
  
  // Solo SUPER_ADMIN puede crear notificaciones manualmente
  if (actor.role !== "SUPER_ADMIN") {
    throw new HttpError(403, "No tenés permisos para crear notificaciones");
  }

  const notification = await createNotification(req.body);

  res.status(201).json(notification);
});
