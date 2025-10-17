import { Router } from "express";
import { requireAuth } from "../auth/requireAuth";
import { requireRole } from "../auth/requireRole";
import { UserRole } from "@admin-inmo/shared";
import {
  getConfiguracionPagosController,
  createOrUpdateConfiguracionPagosController,
  createOrUpdateConfiguracionPagosInmobiliariaController,
  createOrUpdateConfiguracionPagosPropietarioController,
  getConfiguracionPagosPublicaController,
} from "../controllers/configuracionPagosController";

const router = Router();

// Rutas públicas (sin autenticación)
router.get("/publica/:inmobiliariaId", getConfiguracionPagosPublicaController);

// Rutas protegidas
router.use(requireAuth);

// Solo ADMIN puede ver y modificar la configuración
router.get("/:inmobiliariaId", requireRole(UserRole.ADMIN), getConfiguracionPagosController);

// Configuración de pagos para inmobiliaria (solo ADMIN)
router.post("/:inmobiliariaId/inmobiliaria", requireRole(UserRole.ADMIN), createOrUpdateConfiguracionPagosInmobiliariaController);
router.put("/:inmobiliariaId/inmobiliaria", requireRole(UserRole.ADMIN), createOrUpdateConfiguracionPagosInmobiliariaController);

// Configuración de pagos para propietario (solo ADMIN)
router.post("/:inmobiliariaId/propietario", requireRole(UserRole.ADMIN), createOrUpdateConfiguracionPagosPropietarioController);
router.put("/:inmobiliariaId/propietario", requireRole(UserRole.ADMIN), createOrUpdateConfiguracionPagosPropietarioController);

// Mantener compatibilidad con la configuración anterior (solo SUPER_ADMIN)
router.post("/:inmobiliariaId", requireRole(UserRole.SUPER_ADMIN), createOrUpdateConfiguracionPagosController);
router.put("/:inmobiliariaId", requireRole(UserRole.SUPER_ADMIN), createOrUpdateConfiguracionPagosController);

export default router;
