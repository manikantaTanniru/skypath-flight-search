import path from "node:path";
import { Express } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { loadConfig } from "../../src/config";
import { buildGraph, loadDataset } from "../../src/data/loader";

const REAL_DATASET_PATH = path.resolve(__dirname, "../../../flights.json");

let app: Express;

beforeAll(() => {
  const config = loadConfig({ PORT: "4001", DATA_PATH: REAL_DATASET_PATH } as NodeJS.ProcessEnv);
  const graph = buildGraph(loadDataset(config.dataPath));
  app = createApp(config, graph);
});

describe("GET /api/search", () => {
  it("1) JFK -> LAX: 200, direct and multi-stop results", async () => {
    const res = await request(app).get("/api/search").query({ origin: "JFK", destination: "LAX", date: "2024-03-15" });
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
    expect(res.body.results.some((r: any) => r.stops === 0)).toBe(true);
    expect(res.body.results.some((r: any) => r.stops >= 1)).toBe(true);
  });

  it("2) SFO -> NRT: 200, international layovers >= 90 minutes", async () => {
    const res = await request(app).get("/api/search").query({ origin: "SFO", destination: "NRT", date: "2024-03-15" });
    expect(res.status).toBe(200);
    const internationalLayovers = res.body.results.flatMap((r: any) => r.layovers).filter((l: any) => l.isInternational);
    expect(internationalLayovers.length).toBeGreaterThan(0);
    for (const layover of internationalLayovers) {
      expect(layover.durationMinutes).toBeGreaterThanOrEqual(90);
    }
  });

  it("3) BOS -> SEA: 200, no direct flight but connections exist", async () => {
    const res = await request(app).get("/api/search").query({ origin: "BOS", destination: "SEA", date: "2024-03-15" });
    expect(res.status).toBe(200);
    expect(res.body.results.some((r: any) => r.stops === 0)).toBe(false);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it("4) JFK -> JFK: 400 SAME_ORIGIN_DESTINATION", async () => {
    const res = await request(app).get("/api/search").query({ origin: "JFK", destination: "JFK", date: "2024-03-15" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("SAME_ORIGIN_DESTINATION");
  });

  it("5) XXX -> LAX: 400 UNKNOWN_AIRPORT, no crash", async () => {
    const res = await request(app).get("/api/search").query({ origin: "XXX", destination: "LAX", date: "2024-03-15" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("UNKNOWN_AIRPORT");
    expect(res.body.error.field).toBe("origin");
  });

  it("6) SYD -> LAX: 200, large positive total duration despite date-line crossing", async () => {
    const res = await request(app).get("/api/search").query({ origin: "SYD", destination: "LAX", date: "2024-03-15" });
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
    for (const itinerary of res.body.results) {
      expect(itinerary.totalDurationMinutes).toBeGreaterThan(0);
    }
  });

  it("returns 400 MISSING_PARAMETER when a param is missing", async () => {
    const res = await request(app).get("/api/search").query({ origin: "JFK", destination: "LAX" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_PARAMETER");
  });

  it("returns 400 INVALID_FORMAT for a non-3-letter airport code", async () => {
    const res = await request(app).get("/api/search").query({ origin: "JF", destination: "LAX", date: "2024-03-15" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_FORMAT");
  });

  it("returns 400 INVALID_DATE_FORMAT for a malformed date", async () => {
    const res = await request(app).get("/api/search").query({ origin: "JFK", destination: "LAX", date: "03-15-2024" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_DATE_FORMAT");
  });

  it("returns 200 with an empty results array for a date with no flights", async () => {
    const res = await request(app).get("/api/search").query({ origin: "JFK", destination: "LAX", date: "2099-01-01" });
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.results).toEqual([]);
  });

  it("accepts lowercase airport codes", async () => {
    const res = await request(app).get("/api/search").query({ origin: "jfk", destination: "lax", date: "2024-03-15" });
    expect(res.status).toBe(200);
    expect(res.body.origin).toBe("JFK");
    expect(res.body.destination).toBe("LAX");
  });
});

describe("GET /api/health", () => {
  it("returns 200 ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
