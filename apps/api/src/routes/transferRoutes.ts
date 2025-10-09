import { Router } from "express";
import {
  transferenciasPendientesController,
  verificarTransferenciaController,
  transferenciaComprobanteController,
} from "../controllers/transferController";
import { requireAuth, requireRole } from "../auth";
import { UserRole } from "@admin-inmo/shared";

export const transferRoutes = Router();

transferRoutes.use(requireAuth, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN));

transferRoutes.get("/pendientes", transferenciasPendientesController);
transferRoutes.get("/:id/comprobante", transferenciaComprobanteController);
transferRoutes.post("/:id/verificar", verificarTransferenciaController);

