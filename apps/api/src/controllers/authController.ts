import { Request, Response } from "express";
import { signToken } from "../auth";
import { env } from "../env";
import { registerUser, authenticateUser, getUserById } from "../services/authService";
import { JWT_COOKIE_NAME, AuthTokenPayload } from "@admin-inmo/shared";

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
  const user = await registerUser(req.body, {
    allowSelfSignup: env.ALLOW_SELF_SIGNUP,
    creator: req.user,
  });
  res.status(201).json({
    id: user.id,
    email: user.email,
    rol: user.rol,
    nombre: user.nombre,
    apellido: user.apellido,
  });
};

export const loginController = async (req: Request, res: Response) => {
  const { user, tokenPayload } = await authenticateUser(req.body);
  const token = signToken(tokenPayload);
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
      },
    });
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
  });
};

export const logoutController = async (_req: Request, res: Response) => {
  res.clearCookie(JWT_COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ message: "Sesión cerrada" });
};
