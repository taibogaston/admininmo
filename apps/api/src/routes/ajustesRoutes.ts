import { Router } from "express";
import { calcularAjusteController } from "../controllers/ajusteController";
import { asyncHandler } from "../utils/asyncHandler";

export const ajustesRoutes = Router();

ajustesRoutes.get("/calcular", asyncHandler(calcularAjusteController));
