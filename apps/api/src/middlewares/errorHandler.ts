import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import type { MulterError } from "multer";
import { ZodError } from "zod";
import { HttpError, isHttpError } from "../utils/errors";

type ErrorResponse = {
  status: "error";
  message: string;
  code: string;
  requestId?: string;
  details?: unknown;
  issues?: Array<{ path: string; message: string }>;
};

const isMulterError = (error: unknown): error is MulterError =>
  typeof error === "object" && error !== null && (error as MulterError).name === "MulterError";

const normaliseMessage = (message: string): string => message.trim() || "Ocurrio un error inesperado";

const buildResponse = (req: Request, base: Omit<ErrorResponse, "status">, status: number) => {
  const response: ErrorResponse = { status: "error", ...base };
  if (req.requestId) {
    response.requestId = req.requestId;
  }
  return { status, payload: response };
};

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  const requestLabel = `[${req.requestId ?? "unknown"}] ${req.method} ${req.originalUrl}`;

  let status = 500;
  let response: ErrorResponse = {
    status: "error",
    code: "INTERNAL_SERVER_ERROR",
    message: "Ocurrio un error inesperado",
  };

  if (isHttpError(err)) {
    status = err.status;
    response = {
      status: "error",
      code: err.code,
      message: normaliseMessage(err.message),
      details: err.details,
    };
  } else if (err instanceof ZodError) {
    status = 422;
    response = {
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Los datos enviados no son validos",
      issues: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: normaliseMessage(issue.message),
      })),
    };
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    status = err.code === "P2002" ? 409 : 400;
    response = {
      status: "error",
      code: err.code,
      message:
        err.code === "P2002"
          ? "El recurso ya existe con los datos enviados"
          : "No se pudo completar la operacion con la base de datos",
    };
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    status = 400;
    response = {
      status: "error",
      code: "DATABASE_VALIDATION_ERROR",
      message: "Los datos enviados no son compatibles con la base de datos",
    };
  } else if (isMulterError(err)) {
    status = 400;
    response = {
      status: "error",
      code: `UPLOAD_${err.code}`,
      message: normaliseMessage(err.message),
    };
  } else if (err instanceof SyntaxError) {
    const parseError = err as SyntaxError & { type?: string };
    if (parseError.type === "entity.parse.failed") {
      status = 400;
      response = {
        status: "error",
        code: "INVALID_JSON",
        message: "El cuerpo enviado no es un JSON valido",
      };
    } else {
      response = {
        status: "error",
        code: "INTERNAL_SERVER_ERROR",
        message: normaliseMessage(parseError.message),
      };
    }
  } else if (err instanceof Error) {
    response = {
      status: "error",
      code: "INTERNAL_SERVER_ERROR",
      message: normaliseMessage(err.message),
    };
  }

  if (req.requestId) {
    res.setHeader("x-request-id", req.requestId);
    response.requestId = req.requestId;
  }

  if (status >= 500) {
    console.error(`${requestLabel} ->`, err);
  } else {
    console.warn(`${requestLabel} ->`, err);
  }

  res.status(status).json(response);
};
