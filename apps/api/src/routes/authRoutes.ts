import { Router } from "express";
import { loginController, meController, registerController, logoutController, changePasswordController } from "../controllers/authController";
import { requireAuth } from "../auth/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";

export const authRoutes = Router();

authRoutes.post("/register", asyncHandler(registerController));
authRoutes.post("/login", asyncHandler(loginController));
authRoutes.post("/logout", requireAuth, asyncHandler(logoutController));
authRoutes.get("/me", requireAuth, asyncHandler(meController));
authRoutes.patch("/password", requireAuth, asyncHandler(changePasswordController));
