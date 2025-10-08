import { Router } from "express";
import { calcularAjusteController } from "../controllers/ajusteController";

export const ajustesRoutes = Router();

ajustesRoutes.get("/calcular", calcularAjusteController);
