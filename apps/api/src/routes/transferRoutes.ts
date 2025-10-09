import { Router } from "express";
import {
  transferenciasPendientesController,
  verificarTransferenciaController,
  transferenciaComprobanteController,
} from "../controllers/transferController";
import { requireAuth, requireRole } from "../auth";
import { UserRole } from "@admin-inmo/shared";
import { asyncHandler } from "../utils/asyncHandler";

export const transferRoutes = Router();

transferRoutes.use(requireAuth, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN));

transferRoutes.get("/pendientes", asyncHandler(transferenciasPendientesController));
transferRoutes.get("/:id/comprobante", asyncHandler(transferenciaComprobanteController));
transferRoutes.post("/:id/verificar", asyncHandler(verificarTransferenciaController));

