import { Router } from "express";
import { loginController, meController, registerController, logoutController } from "../controllers/authController";
import { requireAuth } from "../auth/requireAuth";

export const authRoutes = Router();

authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController);
authRoutes.post("/logout", requireAuth, logoutController);
authRoutes.get("/me", requireAuth, meController);
