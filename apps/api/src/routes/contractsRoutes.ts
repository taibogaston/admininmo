import { Router } from "express";
import {
  listContractsController,
  createContractController,
  updateContractController,
  uploadContratoArchivoController,
  listContratoArchivosController,
  downloadContratoArchivoController,
  contratoPagosController,
  contratoMovimientosController,
  createContratoDescuentoController,
  listContratoDescuentosController,
} from "../controllers/contractController";
import { requireAuth, requireRole } from "../auth";
import { contractUpload } from "../middlewares/upload";
import { UserRole } from "@admin-inmo/shared";
import { asyncHandler } from "../utils/asyncHandler";

export const contratosRoutes = Router();

contratosRoutes.use(requireAuth);

contratosRoutes.get("/", asyncHandler(listContractsController));
contratosRoutes.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(createContractController)
);
contratosRoutes.put(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(updateContractController)
);
contratosRoutes.post(
  "/:id/archivos",
  contractUpload.single("archivo"),
  asyncHandler(uploadContratoArchivoController)
);
contratosRoutes.get("/:id/archivos", asyncHandler(listContratoArchivosController));
contratosRoutes.get("/:id/archivos/:archivoId", asyncHandler(downloadContratoArchivoController));
contratosRoutes.get("/:id/pagos", asyncHandler(contratoPagosController));
contratosRoutes.get("/:id/movimientos", asyncHandler(contratoMovimientosController));
contratosRoutes.get("/:id/descuentos", asyncHandler(listContratoDescuentosController));
contratosRoutes.post("/:id/descuentos", asyncHandler(createContratoDescuentoController));

