import { Request, Response } from "express";
import path from "path";
import fs from "fs";
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
  if (!transferencia.comprobantePath) {
    throw new HttpError(404, "Archivo no encontrado");
  }
  
  // Verificar que el archivo existe
  if (!fs.existsSync(transferencia.comprobantePath)) {
    throw new HttpError(404, "Archivo no encontrado en el sistema");
  }
  
  // Determinar el tipo de contenido basado en la extensión del archivo
  const ext = path.extname(transferencia.comprobantePath).toLowerCase();
  let contentType = 'application/octet-stream';
  
  switch (ext) {
    case '.pdf':
      contentType = 'application/pdf';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.webp':
      contentType = 'image/webp';
      break;
    case '.jfif':
      contentType = 'image/jpeg';
      break;
  }
  
  res.setHeader('Content-Type', contentType);
  res.sendFile(path.resolve(transferencia.comprobantePath));
};
