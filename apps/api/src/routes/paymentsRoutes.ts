import { Router } from "express";
import {
  generatePagoController,
  createPreferenceController,
  registerTransferenciaController,
  getPagoController,
} from "../controllers/paymentController";
import { requireAuth, requireRole } from "../auth";
import { transferenciaUpload } from "../middlewares/upload";
import { UserRole } from "@admin-inmo/shared";

export const pagosRoutes = Router();

pagosRoutes.use(requireAuth);

pagosRoutes.post("/generar", requireRole(UserRole.ADMIN, UserRole.PROPIETARIO), generatePagoController);
pagosRoutes.post("/:pagoId/mp/preference", createPreferenceController);
pagosRoutes.post("/:pagoId/transferencia", transferenciaUpload.single("comprobante"), registerTransferenciaController);
pagosRoutes.get("/:pagoId", getPagoController);
