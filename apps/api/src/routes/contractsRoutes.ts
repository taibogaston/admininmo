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

export const contratosRoutes = Router();

contratosRoutes.use(requireAuth);

contratosRoutes.get("/", listContractsController);
contratosRoutes.post("/", requireRole(UserRole.ADMIN), createContractController);
contratosRoutes.put("/:id", requireRole(UserRole.ADMIN), updateContractController);
contratosRoutes.post("/:id/archivos", contractUpload.single("archivo"), uploadContratoArchivoController);
contratosRoutes.get("/:id/archivos", listContratoArchivosController);
contratosRoutes.get("/:id/archivos/:archivoId", downloadContratoArchivoController);
contratosRoutes.get("/:id/pagos", contratoPagosController);
contratosRoutes.get("/:id/movimientos", contratoMovimientosController);
contratosRoutes.get("/:id/descuentos", listContratoDescuentosController);
contratosRoutes.post("/:id/descuentos", createContratoDescuentoController);
