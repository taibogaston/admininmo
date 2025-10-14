import { Router } from "express";
import {
  generatePagoController,
  createPreferenceController,
  registerTransferenciaController,
  getPagoController,
  verificarTransferenciaController,
  ejecutarTransferenciasManualesController,
  listTransferenciasPendientesController,
  listTransferenciasInmobiliariaController,
  getDivisionMontosController,
} from "../controllers/paymentController";
import { requireAuth, requireRole } from "../auth";
import { transferenciaUpload } from "../middlewares/upload";
import { UserRole } from "@admin-inmo/shared";
import { asyncHandler } from "../utils/asyncHandler";

export const pagosRoutes = Router();

pagosRoutes.use(requireAuth);

pagosRoutes.post(
  "/generar",
  requireRole(UserRole.ADMIN, UserRole.PROPIETARIO, UserRole.SUPER_ADMIN, UserRole.INQUILINO),
  asyncHandler(generatePagoController)
);
// Ruta para listar transferencias pendientes (solo SUPER_ADMIN)
pagosRoutes.get(
  "/transferencias-pendientes/:inmobiliariaId",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(listTransferenciasPendientesController)
);

// Ruta para que ADMIN vea transferencias de su inmobiliaria (solo lectura)
pagosRoutes.get(
  "/transferencias-inmobiliaria",
  requireRole(UserRole.ADMIN),
  asyncHandler(listTransferenciasInmobiliariaController)
);

// Ruta para obtener división de montos (solo SUPER_ADMIN)
pagosRoutes.get(
  "/:pagoId/division-montos",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(getDivisionMontosController)
);

pagosRoutes.post("/:pagoId/mp/preference", asyncHandler(createPreferenceController));
pagosRoutes.post(
  "/:pagoId/transferencia",
  transferenciaUpload.single("comprobante"),
  asyncHandler(registerTransferenciaController)
);
pagosRoutes.get("/:pagoId", asyncHandler(getPagoController));

// Rutas para verificación y ejecución de transferencias manuales (solo SUPER_ADMIN)
pagosRoutes.post(
  "/:pagoId/verificar",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(verificarTransferenciaController)
);
pagosRoutes.post(
  "/:pagoId/ejecutar-transferencias",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(ejecutarTransferenciasManualesController)
);

