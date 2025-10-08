import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./env";
import { router } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { publicLimiter } from "./middlewares/rateLimiter";

export const createServer = () => {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: ["http://localhost:3000", env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000"],
      credentials: true,
    })
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use(publicLimiter);
  app.use("/api", router);

  app.use(errorHandler);

  return app;
};
