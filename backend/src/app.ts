import cors from "cors";
import express, { Express } from "express";
import { Config } from "./config";
import { healthRouter } from "./routes/health";

export function createApp(config: Config): Express {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use("/api", healthRouter());

  return app;
}
