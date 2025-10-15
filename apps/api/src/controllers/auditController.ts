import { Request, Response } from "express";
import { AuthTokenPayload, UserRole } from "@admin-inmo/shared";
import { HttpError } from "../utils/errors";
import { AuditService } from "../services/auditService";

interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const listAuditLogsController = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new HttpError(401, "No autenticado");
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    throw new HttpError(403, "Solo los Super Administradores pueden ver los logs de auditoría");
  }

  const { page = '1', pageSize = '10', action, userId, success } = req.query;
  const parsedPage = parseInt(page as string);
  const parsedPageSize = parseInt(pageSize as string);
  const parsedSuccess = success === 'true' ? true : success === 'false' ? false : undefined;

  const logs = await AuditService.listLogs({
    page: parsedPage,
    pageSize: parsedPageSize,
    action: action as string | undefined,
    userId: userId as string | undefined,
    success: parsedSuccess,
  });

  res.json(logs);
};
