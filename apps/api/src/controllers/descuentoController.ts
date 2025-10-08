import { Request, Response } from "express";
import { listDescuentos, updateDescuentoEstado } from "../services/descuentoService";
import { HttpError } from "../utils/errors";
import { AuthTokenPayload } from "@admin-inmo/shared";

interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const listDescuentosController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const descuentos = await listDescuentos(req.user);
  res.json(descuentos);
};

export const updateDescuentoEstadoController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const descuento = await updateDescuentoEstado(req.params.id, req.user, req.body);
  res.json(descuento);
};
