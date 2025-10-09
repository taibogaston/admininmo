import { Request, Response } from "express";
import { AuthTokenPayload } from "@admin-inmo/shared";
import { createInmobiliaria, listInmobiliarias } from "../services/inmobiliariaService";
import { HttpError } from "../utils/errors";

interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const createInmobiliariaController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "No autenticado");
  }
  const { inmobiliaria, admin } = await createInmobiliaria(req.body, req.user);
  res.status(201).json({
    inmobiliaria: {
      id: inmobiliaria.id,
      nombre: inmobiliaria.nombre,
      slug: inmobiliaria.slug,
      createdAt: inmobiliaria.createdAt.toISOString(),
      updatedAt: inmobiliaria.updatedAt.toISOString(),
    },
    admin: {
      id: admin.id,
      email: admin.email,
      nombre: admin.nombre,
      apellido: admin.apellido,
    },
  });
};

export const listInmobiliariasController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "No autenticado");
  }
  const inmobiliarias = await listInmobiliarias(req.user);
  res.json(
    inmobiliarias.map((item) => ({
      id: item.id,
      nombre: item.nombre,
      slug: item.slug,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      usuarios: item._count.usuarios,
      contratos: item._count.contratos,
    }))
  );
};
