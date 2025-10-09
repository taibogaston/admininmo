import { env } from "../env";

const mercadopagoMod = require("mercadopago") as any;

if (env.MP_ACCESS_TOKEN && env.MP_ACCESS_TOKEN.trim() !== "") {
  mercadopagoMod.configure({
    access_token: env.MP_ACCESS_TOKEN,
  });
}

export const mpClient = mercadopagoMod;
