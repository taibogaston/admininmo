import { Router } from "express";
import {
  transferenciasPendientesController,
  verificarTransferenciaController,
  transferenciaComprobanteController,
  transferenciaComprobantePropietarioController,
  transferenciaComprobanteInmobiliariaController,
} from "../controllers/transferController";
import { requireAuth, requireRole } from "../auth";
import { UserRole } from "@admin-inmo/shared";
import { asyncHandler } from "../utils/asyncHandler";

export const transferRoutes = Router();

// Rutas que requieren solo autenticación (para PROPIETARIO)
transferRoutes.get("/:id/comprobante-propietario", requireAuth, asyncHandler(transferenciaComprobantePropietarioController));

// Rutas que requieren rol ADMIN o SUPER_ADMIN
transferRoutes.use(requireAuth, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN));

transferRoutes.get("/pendientes", asyncHandler(transferenciasPendientesController));
transferRoutes.get("/:id/comprobante", asyncHandler(transferenciaComprobanteController));
transferRoutes.get("/:id/comprobante-inmobiliaria", asyncHandler(transferenciaComprobanteInmobiliariaController));
transferRoutes.post("/:id/verificar", asyncHandler(verificarTransferenciaController));

