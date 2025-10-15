import { Request, Response } from "express";
import { signToken } from "../auth";
import { env } from "../env";
import { registerUser, authenticateUser, getUserById, changePassword } from "../services/authService";
import { JWT_COOKIE_NAME, AuthTokenPayload } from "@admin-inmo/shared";
import { HttpError } from "../utils/errors";
import { AuditService } from "../services/auditService";
import { AuditAction } from "@prisma/client";

interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  maxAge: 12 * 60 * 60 * 1000,
};

export const registerController = async (req: AuthenticatedRequest, res: Response) => {
  const { user, temporaryPassword } = await registerUser(req.body, {
    allowSelfSignup: env.ALLOW_SELF_SIGNUP,
    creator: req.user,
  });

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
      apellido: user.apellido,
      dni: user.dni ?? null,
      mustChangePassword: user.mustChangePassword,
      inmobiliariaId: user.inmobiliariaId ?? null,
      inmobiliaria: user.inmobiliaria
        ? {
            id: user.inmobiliaria.id,
            nombre: user.inmobiliaria.nombre,
            slug: user.inmobiliaria.slug,
            createdAt: user.inmobiliaria.createdAt.toISOString(),
            updatedAt: user.inmobiliaria.updatedAt.toISOString(),
          }
        : null,
    },
    temporaryPassword: temporaryPassword ?? null,
  });
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { user, tokenPayload } = await authenticateUser(req.body);
    const token = signToken(tokenPayload);

    await AuditService.logSuccess(
      tokenPayload, 
      AuditAction.LOGIN, 
      req.originalUrl, 
      user.id,
      { email: user.email, rol: user.rol, inmobiliariaId: user.inmobiliariaId },
      req.ip, 
      req.get('User-Agent')
    );

    res
      .cookie(JWT_COOKIE_NAME, token, COOKIE_OPTIONS)
      .json({
      token,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        nombre: user.nombre,
        apellido: user.apellido,
        dni: user.dni ?? null,
        mustChangePassword: user.mustChangePassword,
        inmobiliariaId: user.inmobiliariaId ?? null,
        inmobiliaria: user.inmobiliaria
          ? {
              id: user.inmobiliaria.id,
              nombre: user.inmobiliaria.nombre,
              slug: user.inmobiliaria.slug,
              createdAt: user.inmobiliaria.createdAt.toISOString(),
              updatedAt: user.inmobiliaria.updatedAt.toISOString(),
            }
          : null,
      },
    });
  } catch (error) {
    await AuditService.logFailure(
      null, 
      AuditAction.LOGIN_FAILED, 
      error instanceof Error ? error.message : 'Unknown error',
      req.originalUrl, 
      undefined, 
      { email: req.body?.email },
      req.ip, 
      req.get('User-Agent')
    );
    throw error;
  }
};

export const meController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "No autenticado" });
    return;
  }

  const user = await getUserById(req.user.id);

  res.json({
    id: user.id,
    email: user.email,
    rol: user.rol,
    nombre: user.nombre,
    apellido: user.apellido,
    dni: user.dni ?? null,
    mustChangePassword: user.mustChangePassword,
    inmobiliariaId: user.inmobiliariaId ?? null,
    inmobiliaria: user.inmobiliaria
      ? {
          id: user.inmobiliaria.id,
          nombre: user.inmobiliaria.nombre,
          slug: user.inmobiliaria.slug,
          createdAt: user.inmobiliaria.createdAt.toISOString(),
          updatedAt: user.inmobiliaria.updatedAt.toISOString(),
        }
      : null,
  });
};

export const changePasswordController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  try {
    await changePassword(req.user.id, req.body);
    await AuditService.logSuccess(
      req.user, 
      AuditAction.PASSWORD_CHANGE, 
      req.originalUrl, 
      req.user.id,
      { hasCurrentPassword: !!req.body?.currentPassword, hasNewPassword: !!req.body?.newPassword },
      req.ip, 
      req.get('User-Agent')
    );
    res.json({ message: "Contrasena actualizada" });
  } catch (error) {
    await AuditService.logFailure(
      req.user, 
      AuditAction.PASSWORD_CHANGE, 
      error instanceof Error ? error.message : 'Unknown error',
      req.originalUrl, 
      req.user.id,
      { hasCurrentPassword: !!req.body?.currentPassword, hasNewPassword: !!req.body?.newPassword },
      req.ip, 
      req.get('User-Agent')
    );
    throw error;
  }
};

export const logoutController = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    await AuditService.logSuccess(
      req.user, 
      AuditAction.LOGOUT, 
      req.originalUrl, 
      req.user.id,
      { userId: req.user.id, email: req.user.email },
      req.ip, 
      req.get('User-Agent')
    );
  }
  res.clearCookie(JWT_COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ message: "Sesion cerrada" });
};
