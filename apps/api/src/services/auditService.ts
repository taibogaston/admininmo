import { getPrisma } from "../utils/prisma";
import { AuditAction, User } from "@prisma/client";
import { AuthTokenPayload } from "@admin-inmo/shared";

const prisma = getPrisma();

export class AuditService {
  static async log(
    actor: AuthTokenPayload | null,
    action: AuditAction,
    success: boolean,
    errorMessage: string | null,
    resource: string,
    resourceId: string | undefined,
    details: Record<string, unknown> | null,
    ipAddress: string | undefined,
    userAgent: string | undefined
  ) {
    await prisma.auditLog.create({
      data: {
        userId: actor?.id,
        userEmail: actor?.email,
        action,
        success,
        errorMessage,
        resource,
        resourceId,
        details: details as any,
        ipAddress,
        userAgent,
      },
    });
  }

  static async logSuccess(
    actor: AuthTokenPayload | null,
    action: AuditAction,
    resource: string,
    resourceId: string | undefined,
    details: Record<string, unknown> | null,
    ipAddress: string | undefined,
    userAgent: string | undefined
  ) {
    await this.log(actor, action, true, null, resource, resourceId, details, ipAddress, userAgent);
  }

  static async logFailure(
    actor: AuthTokenPayload | null,
    action: AuditAction,
    errorMessage: string,
    resource: string,
    resourceId: string | undefined,
    details: Record<string, unknown> | null,
    ipAddress: string | undefined,
    userAgent: string | undefined
  ) {
    await this.log(actor, action, false, errorMessage, resource, resourceId, details, ipAddress, userAgent);
  }

  static async listLogs(options: {
    page: number;
    pageSize: number;
    action?: string;
    userId?: string;
    success?: boolean;
  }) {
    const { page, pageSize, action, userId, success } = options;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (success !== undefined) where.success = success;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nombre: true,
              apellido: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
    };
  }
}
