import { Router } from "express";
import { mercadoPagoWebhookController } from "../controllers/paymentController";

export const webhookRoutes = Router();

webhookRoutes.post("/mercadopago", mercadoPagoWebhookController);
