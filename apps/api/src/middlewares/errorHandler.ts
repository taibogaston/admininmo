import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/errors";

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, details: err.details ?? null });
    return;
  }

  console.error(err);
  res.status(500).json({ message: "Error interno del servidor" });
};
