import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildGraph, loadDataset } from "../../src/data/loader";
import { searchItineraries } from "../../src/domain/search";
import { FlightGraph } from "../../src/types/flight";

const REAL_DATASET_PATH = path.resolve(__dirname, "../../../flights.json");
const MINI_DATASET_PATH = path.resolve(__dirname, "../fixtures/mini-flights.json");

function graphFrom(datasetPath: string): FlightGraph {
  return buildGraph(loadDataset(datasetPath));
}

describe("searchItineraries - official spec test cases", () => {
  const graph = graphFrom(REAL_DATASET_PATH);

  it("1) JFK -> LAX returns direct flights and multi-stop options", () => {
    const results = searchItineraries(graph, "JFK", "LAX", "2024-03-15");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.stops === 0)).toBe(true);
    expect(results.some((r) => r.stops >= 1)).toBe(true);
  });

  it("2) SFO -> NRT enforces the 90-minute international layover minimum", () => {
    const results = searchItineraries(graph, "SFO", "NRT", "2024-03-15");
    expect(results.length).toBeGreaterThan(0);
    for (const itinerary of results) {
      for (const layover of itinerary.layovers) {
        if (layover.isInternational) {
          expect(layover.durationMinutes).toBeGreaterThanOrEqual(90);
        } else {
          expect(layover.durationMinutes).toBeGreaterThanOrEqual(45);
        }
        expect(layover.durationMinutes).toBeLessThanOrEqual(360);
      }
    }
  });

  it("3) BOS -> SEA has no direct flight but finds connections", () => {
    const results = searchItineraries(graph, "BOS", "SEA", "2024-03-15");
    expect(results.some((r) => r.stops === 0)).toBe(false);
    expect(results.some((r) => r.stops >= 1)).toBe(true);
  });

  it("6) SYD -> LAX total duration is a large positive number despite the date-line crossing", () => {
    const results = searchItineraries(graph, "SYD", "LAX", "2024-03-15");
    expect(results.length).toBeGreaterThan(0);
    for (const itinerary of results) {
      expect(itinerary.totalDurationMinutes).toBeGreaterThan(0);
    }
    const direct = results.find((r) => r.stops === 0);
    expect(direct).toBeDefined();
    expect(direct!.totalDurationMinutes).toBeGreaterThan(600); // sanity: a long-haul flight, not a negative/garbage value
  });

  it("results are sorted by total duration ascending", () => {
    const results = searchItineraries(graph, "JFK", "LAX", "2024-03-15");
    for (let i = 1; i < results.length; i++) {
      expect(results[i].totalDurationMinutes).toBeGreaterThanOrEqual(results[i - 1].totalDurationMinutes);
    }
  });

  it("never returns an itinerary with more than 2 stops", () => {
    const results = searchItineraries(graph, "JFK", "LAX", "2024-03-15");
    for (const itinerary of results) {
      expect(itinerary.stops).toBeLessThanOrEqual(2);
      expect(itinerary.segments.length).toBeLessThanOrEqual(3);
    }
  });

  it("returns an empty array for a route/date with no possible itinerary", () => {
    const results = searchItineraries(graph, "JFK", "LAX", "2099-01-01");
    expect(results).toEqual([]);
  });
});

describe("searchItineraries - edge cases (mini fixture)", () => {
  const graph = graphFrom(MINI_DATASET_PATH);

  it("does not revisit an airport already on the path (cycle avoidance)", () => {
    const results = searchItineraries(graph, "AAA", "CCC", "2024-01-01");
    for (const itinerary of results) {
      const airportsVisited = [
        itinerary.segments[0].origin,
        ...itinerary.segments.map((s) => s.destination)
      ];
      expect(new Set(airportsVisited).size).toBe(airportsVisited.length);
    }
    // specifically: no itinerary should use flight M2 (BBB -> AAA), which would
    // revisit AAA
    expect(results.some((r) => r.segments.some((s) => s.flightNumber === "M2"))).toBe(false);
  });

  it("does not connect through a different airport in the same city", () => {
    const results = searchItineraries(graph, "AAA", "CCC", "2024-01-01");
    // M9 departs FFF, a different airport code in the same city as BBB - it must
    // never be reachable from an AAA->BBB arrival.
    expect(results.some((r) => r.segments.some((s) => s.flightNumber === "M9"))).toBe(false);
  });

  it("rejects an 89-minute international layover and accepts a 90-minute one", () => {
    const results = searchItineraries(graph, "AAA", "CCC", "2024-01-01");
    expect(results.some((r) => r.segments.some((s) => s.flightNumber === "M6"))).toBe(false);
    expect(results.some((r) => r.segments.some((s) => s.flightNumber === "M7"))).toBe(true);
  });

  it("finds exactly the three valid itineraries (direct + 2 connections), sorted by duration", () => {
    const results = searchItineraries(graph, "AAA", "CCC", "2024-01-01");
    expect(results).toHaveLength(3);
    expect(results[0].segments.map((s) => s.flightNumber)).toEqual(["M3"]);
    expect(results[0].totalDurationMinutes).toBe(60);
    expect(results[1].segments.map((s) => s.flightNumber)).toEqual(["M1", "M4"]);
    expect(results[1].totalDurationMinutes).toBe(180);
    expect(results[2].segments.map((s) => s.flightNumber)).toEqual(["M5", "M7"]);
    expect(results[2].totalDurationMinutes).toBe(210);
  });
});
