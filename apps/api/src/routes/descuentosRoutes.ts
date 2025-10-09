import { Router } from "express";
import { requireAuth, requireRole } from "../auth";
import { listDescuentosController, updateDescuentoEstadoController } from "../controllers/descuentoController";
import { UserRole } from "@admin-inmo/shared";

export const descuentosRoutes = Router();

descuentosRoutes.use(requireAuth);

descuentosRoutes.get("/", requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), listDescuentosController);
descuentosRoutes.patch("/:id", requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), updateDescuentoEstadoController);

