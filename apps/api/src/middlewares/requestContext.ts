import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

export const requestContext = (req: Request, res: Response, next: NextFunction): void => {
  const headerId = (req.headers["x-request-id"] as string | undefined)?.trim();
  const requestId = headerId && headerId.length > 0 ? headerId : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  res.locals.requestId = requestId;

  next();
};
