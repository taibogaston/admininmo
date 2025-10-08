import jwt from "jsonwebtoken";
import { AuthTokenPayload } from "@admin-inmo/shared";
import { env } from "../env";

const TOKEN_TTL = "12h";

export const signToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_TTL });
};

export const verifyToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
};
