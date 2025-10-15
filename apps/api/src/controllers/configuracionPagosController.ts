import { Request, Response } from "express";
import { getConfiguracionPagos, createOrUpdateConfiguracionPagos, getConfiguracionPagosPublica } from "../services/configuracionPagosService";
import { HttpError } from "../utils/errors";
import { AuthTokenPayload } from "@admin-inmo/shared";

interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const getConfiguracionPagosController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const { inmobiliariaId } = req.params;
  const configuracion = await getConfiguracionPagos(inmobiliariaId, req.user);
  res.json(configuracion);
};

export const createOrUpdateConfiguracionPagosController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  
  try {
    const { inmobiliariaId } = req.params;
    const configuracion = await createOrUpdateConfiguracionPagos(inmobiliariaId, req.body, req.user);
    res.json(configuracion);
  } catch (error) {
    console.error("Error en createOrUpdateConfiguracionPagosController:", error);
    throw error;
  }
};

export const getConfiguracionPagosPublicaController = async (req: Request, res: Response) => {
  const { inmobiliariaId } = req.params;
  const configuracion = await getConfiguracionPagosPublica(inmobiliariaId);
  res.json(configuracion);
};
