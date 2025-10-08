import { Request, Response } from "express";
import path from "path";
import { listTransferenciasPendientes, verificarTransferencia, getTransferenciaFile } from "../services/transferService";
import { HttpError } from "../utils/errors";
import { AuthTokenPayload } from "@admin-inmo/shared";

interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const transferenciasPendientesController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const transferencias = await listTransferenciasPendientes(req.user);
  res.json(transferencias);
};

export const verificarTransferenciaController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const transferencia = await verificarTransferencia(req.params.id, req.user, req.body);
  res.json(transferencia);
};

export const transferenciaComprobanteController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const transferencia = await getTransferenciaFile(req.params.id, req.user);
  res.sendFile(path.resolve(transferencia.comprobantePath));
};
