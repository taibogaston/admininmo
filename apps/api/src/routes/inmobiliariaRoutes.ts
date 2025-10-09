import { Router } from "express";
import { requireAuth, requireRole } from "../auth";
import { createInmobiliariaController, listInmobiliariasController } from "../controllers/inmobiliariaController";
import { UserRole } from "@admin-inmo/shared";

export const inmobiliariaRoutes = Router();

inmobiliariaRoutes.use(requireAuth, requireRole(UserRole.SUPER_ADMIN));
inmobiliariaRoutes.get("/", listInmobiliariasController);
inmobiliariaRoutes.post("/", createInmobiliariaController);
