import { Router } from "express";
import { requireAuth } from "../auth/requireAuth";
import { requireRole } from "../auth/requireRole";
import { UserRole } from "@admin-inmo/shared";
import {
  getConfiguracionPagosController,
  createOrUpdateConfiguracionPagosController,
  getConfiguracionPagosPublicaController,
} from "../controllers/configuracionPagosController";

const router = Router();

// Rutas públicas (sin autenticación)
router.get("/publica/:inmobiliariaId", getConfiguracionPagosPublicaController);

// Rutas protegidas
router.use(requireAuth);

// Solo SUPER_ADMIN puede ver y modificar la configuración
router.get("/:inmobiliariaId", requireRole(UserRole.SUPER_ADMIN), getConfiguracionPagosController);
router.post("/:inmobiliariaId", requireRole(UserRole.SUPER_ADMIN), createOrUpdateConfiguracionPagosController);
router.put("/:inmobiliariaId", requireRole(UserRole.SUPER_ADMIN), createOrUpdateConfiguracionPagosController);

export default router;
