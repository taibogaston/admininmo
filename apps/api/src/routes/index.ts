import { Router } from "express";
import { authRoutes } from "./authRoutes";
import { contratosRoutes } from "./contractsRoutes";
import { pagosRoutes } from "./paymentsRoutes";
import { transferRoutes } from "./transferRoutes";
import { ajustesRoutes } from "./ajustesRoutes";
import { descuentosRoutes } from "./descuentosRoutes";
import { webhookRoutes } from "./webhookRoutes";
import { userRoutes } from "./userRoutes";
import { inmobiliariaRoutes } from "./inmobiliariaRoutes";
import configuracionPagosRoutes from "./configuracionPagosRoutes";
import notificationRoutes from "./notificationRoutes";
import { authLimiter } from "../middlewares/rateLimiter";

export const router = Router();

router.use("/auth", authLimiter, authRoutes);
router.use("/inmobiliarias", inmobiliariaRoutes);
router.use("/usuarios", userRoutes);
router.use("/contratos", contratosRoutes);
router.use("/pagos", pagosRoutes);
router.use("/transferencias", transferRoutes);
router.use("/ajustes", ajustesRoutes);
router.use("/descuentos", descuentosRoutes);
router.use("/webhook", webhookRoutes);
router.use("/configuracion-pagos", configuracionPagosRoutes);
router.use("/notificaciones", notificationRoutes);
