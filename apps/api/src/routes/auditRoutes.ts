import { Router } from "express";
import { requireAuth, requireRole } from "../auth";
import { UserRole } from "@admin-inmo/shared";
import { asyncHandler } from "../utils/asyncHandler";
import { listAuditLogsController } from "../controllers/auditController";

export const auditRoutes = Router();

auditRoutes.use(requireAuth, requireRole(UserRole.SUPER_ADMIN));

auditRoutes.get("/", asyncHandler(listAuditLogsController));
