import { Router } from "express";
import { requireAuth, requireRole } from "../auth";
import { createInmobiliariaController, listInmobiliariasController } from "../controllers/inmobiliariaController";
import { UserRole } from "@admin-inmo/shared";
import { asyncHandler } from "../utils/asyncHandler";

export const inmobiliariaRoutes = Router();

inmobiliariaRoutes.use(requireAuth, requireRole(UserRole.SUPER_ADMIN));
inmobiliariaRoutes.get("/", asyncHandler(listInmobiliariasController));
inmobiliariaRoutes.post("/", asyncHandler(createInmobiliariaController));
