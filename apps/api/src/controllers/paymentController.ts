import { Request, Response } from "express";
import { generatePago, registerTransferencia, processMercadoPagoWebhook, getPagoById, verificarTransferencia, ejecutarTransferenciasManuales, listTransferenciasPendientes, listTransferenciasInmobiliaria, listTransferenciasPropietario, calcularDivisionMontos } from "../services/paymentService";
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
  // TODO: Implementar createMercadoPagoPreference si es necesario
  res.json({ message: "MercadoPago preference creation not implemented yet" });
};

export const registerTransferenciaController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const transferencia = await registerTransferencia(req.params.pagoId, req.user, req.files, req.body);
  res.status(201).json(transferencia);
};

export const getPagoController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const pago = await getPagoById(req.params.pagoId, req.user);
  res.json(pago);
};

export const mercadoPagoWebhookController = async (req: Request, res: Response) => {
  await processMercadoPagoWebhook(req.body);
  res.status(200).json({ received: true });
};

export const verificarTransferenciaController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const { pagoId } = req.params;
  const transferencia = await verificarTransferencia(pagoId, req.body, req.user);
  res.json(transferencia);
};

export const ejecutarTransferenciasManualesController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const { pagoId } = req.params;
  const transferencia = await ejecutarTransferenciasManuales(pagoId, req.body, req.user);
  res.json(transferencia);
};

export const listTransferenciasPendientesController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const { inmobiliariaId } = req.params;
  const transferencias = await listTransferenciasPendientes(inmobiliariaId, req.user);
  res.json(transferencias);
};

export const listTransferenciasInmobiliariaController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const transferencias = await listTransferenciasInmobiliaria(req.user);
  res.json(transferencias);
};

export const listTransferenciasPropietarioController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const { propietarioId } = req.params;
  const transferencias = await listTransferenciasPropietario(propietarioId, req.user);
  res.json(transferencias);
};

export const getDivisionMontosController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const { pagoId } = req.params;
  const divisionMontos = await calcularDivisionMontos(pagoId);
  res.json(divisionMontos);
};
