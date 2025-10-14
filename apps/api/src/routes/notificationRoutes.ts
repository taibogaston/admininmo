import { Router } from "express";
import { requireAuth, requireRole } from "../auth";
import { UserRole } from "@admin-inmo/shared";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  createNotificationController,
} from "../controllers/notificationController";

const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Rutas para usuarios autenticados
router.get("/", asyncHandler(getNotificationsController));
router.put("/:notificationId/read", asyncHandler(markNotificationAsReadController));
router.put("/mark-all-read", asyncHandler(markAllNotificationsAsReadController));

// Ruta para crear notificaciones (solo SUPER_ADMIN)
router.post("/", requireRole(UserRole.SUPER_ADMIN), asyncHandler(createNotificationController));

export default router;
