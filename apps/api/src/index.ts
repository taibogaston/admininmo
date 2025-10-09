// Import types extension for Express Request
import "./types/express";
import { createServer } from "./server";
import { env } from "./env";

const app = createServer();

const server = app.listen(env.API_PORT, () => {
  console.log(`API listening on port ${env.API_PORT}`);
});

const shutdown = (signal: string) => {
  console.log(`\nReceived ${signal}. Closing API server...`);
  server.close(() => {
    console.log("API server closed gracefully.");
    process.exit(0);
  });
};

const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
signals.forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection detected:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception detected:", error);
  process.exit(1);
});
