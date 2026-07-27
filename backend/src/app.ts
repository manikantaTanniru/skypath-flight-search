import cors from "cors";
import express, { Express } from "express";
import { Config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health";
import { searchRouter } from "./routes/search";
import { FlightGraph } from "./types/flight";

export function createApp(config: Config, graph: FlightGraph): Express {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use("/api", healthRouter());
  app.use("/api", searchRouter(graph));
  app.use(errorHandler);

  return app;
}
