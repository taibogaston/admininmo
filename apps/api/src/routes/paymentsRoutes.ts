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
import { asyncHandler } from "../utils/asyncHandler";

export const pagosRoutes = Router();

pagosRoutes.use(requireAuth);

pagosRoutes.post(
  "/generar",
  requireRole(UserRole.ADMIN, UserRole.PROPIETARIO, UserRole.SUPER_ADMIN),
  asyncHandler(generatePagoController)
);
pagosRoutes.post("/:pagoId/mp/preference", asyncHandler(createPreferenceController));
pagosRoutes.post(
  "/:pagoId/transferencia",
  transferenciaUpload.single("comprobante"),
  asyncHandler(registerTransferenciaController)
);
pagosRoutes.get("/:pagoId", asyncHandler(getPagoController));

