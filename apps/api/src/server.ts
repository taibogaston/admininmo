import express, { type Request } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./env";
import { router } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { publicLimiter } from "./middlewares/rateLimiter";
import { requestContext } from "./middlewares/requestContext";

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
  app.use(requestContext);

  morgan.token("id", (req) => {
    const request = req as Request;
    return request.requestId ?? "-";
  });
  const loggerFormat =
    env.NODE_ENV === "production"
      ? "[:id] :remote-addr :method :url :status :res[content-length] - :response-time ms"
      : "[:id] :method :url :status :response-time ms";
  app.use(morgan(loggerFormat));

  app.use(publicLimiter);
  app.use("/api", router);

  app.use(errorHandler);

  return app;
};
