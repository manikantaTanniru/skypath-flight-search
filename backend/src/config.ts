import path from "node:path";

export interface Config {
  port: number;
  dataPath: string;
  corsOrigin: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const port = Number(env.PORT ?? 4000);
  const dataPath = path.resolve(env.DATA_PATH ?? "../flights.json");
  const corsOrigin = env.CORS_ORIGIN ?? "http://localhost:5173";

  return { port, dataPath, corsOrigin };
}
