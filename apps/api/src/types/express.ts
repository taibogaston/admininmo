import "express";
import { AuthTokenPayload } from "@admin-inmo/shared";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthTokenPayload;
    }
  }
}

export {};
