import { Request, Response } from "express";
import { registerUser } from "../services/authService";
import { env } from "../env";
import { HttpError } from "../utils/errors";
import { AuthTokenPayload, UserRole } from "@admin-inmo/shared";
import { listUsers } from "../services/userService";

interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const createUserController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const user = await registerUser(req.body, { allowSelfSignup: env.ALLOW_SELF_SIGNUP, creator: req.user });
  res.status(201).json({
    id: user.id,
    email: user.email,
    rol: user.rol,
    nombre: user.nombre,
    apellido: user.apellido,
  });
};

export const listUsersController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  const rolesQuery = Array.isArray(req.query.rol) ? req.query.rol : [req.query.rol].filter(Boolean);
  const parsedRoles = rolesQuery
    .map((role) => (typeof role === "string" ? role.toUpperCase() : null))
    .filter((role): role is keyof typeof UserRole => !!role && role in UserRole)
    .map((role) => UserRole[role]);
  const users = await listUsers(parsedRoles);
  res.json(users);
};
