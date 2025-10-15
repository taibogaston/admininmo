import { Request, Response, NextFunction } from "express";
import { AuditService } from "../services/auditService";
import { AuditAction } from "@prisma/client";
import { AuthTokenPayload } from "@admin-inmo/shared";

interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const auditMiddleware = (action: AuditAction, resourceIdExtractor?: (req: Request) => string | undefined) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    let error: Error | null = null;

    res.on('finish', async () => {
      const duration = Number(process.hrtime.bigint() - start) / 1_000_000; // ms
      const success = res.statusCode >= 200 && res.statusCode < 400;
      const errorMessage = error ? error.message : null;
      const resourceId = resourceIdExtractor ? resourceIdExtractor(req) : undefined;

      await AuditService.log(
        req.user || null,
        action,
        success,
        errorMessage,
        req.originalUrl,
        resourceId,
        {
          method: req.method,
          statusCode: res.statusCode,
          durationMs: duration,
        },
        req.ip,
        req.get('User-Agent')
      );
    });

    res.on('error', (err) => {
      error = err;
    });

    next();
  };
};
