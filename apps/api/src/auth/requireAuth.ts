import { NextFunction, Request, Response } from "express";
import { verifyToken } from "./jwt";
import { HttpError } from "../utils/errors";
import { JWT_COOKIE_NAME, AuthTokenPayload } from "@admin-inmo/shared";

interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  const cookieToken = req.cookies?.[JWT_COOKIE_NAME];
  if (cookieToken) {
    return cookieToken;
  }
  return null;
};

export const requireAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const token = extractToken(req);
  if (!token) {
    throw new HttpError(401, "Autenticación requerida");
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch (error) {
    throw new HttpError(401, "Token inválido");
  }
};
