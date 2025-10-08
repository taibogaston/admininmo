import mercadopago from "mercadopago";
import { env } from "../env";

// Only configure MercadoPago if we have a token
if (env.MP_ACCESS_TOKEN && env.MP_ACCESS_TOKEN.trim() !== "") {
  mercadopago.configure({
    access_token: env.MP_ACCESS_TOKEN,
  });
}

export const mpClient = mercadopago;
