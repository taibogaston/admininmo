import { Router } from "express";
import { requireAuth, requireRole } from "../auth";
import { createUserController, listUsersController } from "../controllers/userController";
import { UserRole } from "@admin-inmo/shared";

export const userRoutes = Router();

userRoutes.use(requireAuth, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN));
userRoutes.get("/", listUsersController);
userRoutes.post("/", createUserController);

