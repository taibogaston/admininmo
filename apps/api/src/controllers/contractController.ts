import { Request, Response } from "express";
import path from "path";
import {
  listContractsForUser,
  createContract,
  saveContratoArchivo,
  listContratoArchivos,
  getContratoArchivo,
  getContratoPagos,
  getContratoMovimientos,
  updateContract,
} from "../services/contractService";
import { createContratoDescuento, listContratoDescuentos } from "../services/descuentoService";
import { HttpError } from "../utils/errors";
import { AuthTokenPayload } from "@admin-inmo/shared";

interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const listContractsController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const contratos = await listContractsForUser(req.user);
  res.json(contratos);
};

export const createContractController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const contrato = await createContract(req.body, req.user);
  res.status(201).json(contrato);
};

export const updateContractController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const contrato = await updateContract(req.params.id, req.body, req.user);
  res.json(contrato);
};

export const uploadContratoArchivoController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  if (!req.file) {
    throw new HttpError(400, "No se envió archivo");
  }
  const contratoId = req.params.id;
  const archivo = await saveContratoArchivo(contratoId, req.user, req.file);
  res.status(201).json(archivo);
};

export const listContratoArchivosController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const archivos = await listContratoArchivos(req.params.id, req.user);
  res.json(archivos);
};

export const downloadContratoArchivoController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const archivo = await getContratoArchivo(req.params.archivoId, req.user);
  res.setHeader("Content-Type", archivo.mimeType);
  res.sendFile(path.resolve(archivo.filePath));
};

export const contratoPagosController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const pagos = await getContratoPagos(req.params.id, req.user);
  res.json(pagos);
};

export const contratoMovimientosController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const movimientos = await getContratoMovimientos(req.params.id, req.user);
  res.json(movimientos);
};

export const createContratoDescuentoController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const descuento = await createContratoDescuento(req.params.id, req.user, req.body);
  res.status(201).json(descuento);
};

export const listContratoDescuentosController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const descuentos = await listContratoDescuentos(req.params.id, req.user);
  res.json(descuentos);
};
