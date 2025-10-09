import { Router } from "express";
import { mercadoPagoWebhookController } from "../controllers/paymentController";
import { asyncHandler } from "../utils/asyncHandler";

export const webhookRoutes = Router();

webhookRoutes.post("/mercadopago", asyncHandler(mercadoPagoWebhookController));
