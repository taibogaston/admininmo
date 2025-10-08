import { Request, Response } from "express";
import { generatePago, createMercadoPagoPreference, registerTransferencia, processMercadoPagoWebhook, getPagoById } from "../services/paymentService";
import { HttpError } from "../utils/errors";
import { AuthTokenPayload } from "@admin-inmo/shared";

interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const generatePagoController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const pago = await generatePago(req.body, req.user);
  res.status(201).json(pago);
};

export const createPreferenceController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const { pagoId } = req.params;
  const preference = await createMercadoPagoPreference(pagoId, req.user);
  res.json(preference);
};

export const registerTransferenciaController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  if (!req.file) throw new HttpError(400, "Archivo requerido");
  const transferencia = await registerTransferencia(req.params.pagoId, req.user, req.file, req.body);
  res.status(201).json(transferencia);
};

export const getPagoController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const pago = await getPagoById(req.params.pagoId, req.user);
  res.json(pago);
};

export const mercadoPagoWebhookController = async (req: Request, res: Response) => {
  await processMercadoPagoWebhook(req.body, req.get("x-signature"));
  res.status(200).json({ received: true });
};
