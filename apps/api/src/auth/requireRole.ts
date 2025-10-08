import { NextFunction, Request, Response } from "express";
import { UserRole, AuthTokenPayload } from "@admin-inmo/shared";
import { HttpError } from "../utils/errors";

interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new HttpError(401, "Autenticación requerida");
    }
    if (!roles.includes(req.user.role)) {
      throw new HttpError(403, "No tenés permisos suficientes");
    }
    next();
  };
};
