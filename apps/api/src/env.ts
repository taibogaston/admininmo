import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: process.env.ENV_FILE ?? undefined });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  API_BASE_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  MP_ACCESS_TOKEN: z.string().default(""),
  MP_WEBHOOK_SECRET: z.string().optional(),
  ALLOW_SELF_SIGNUP: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
  NEXT_PUBLIC_API_BASE_URL: z.string().optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";
