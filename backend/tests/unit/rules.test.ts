import { describe, expect, it } from "vitest";
import { isDomesticConnection, isValidLayover } from "../../src/domain/rules";
import { Airport, Flight } from "../../src/types/flight";

function airport(code: string, country: string): Airport {
  return { code, name: code, city: code, country, timezone: "UTC" };
}

function flight(flightNumber: string, origin: string, destination: string): Flight {
  return {
    flightNumber,
    airline: "SkyPath Airways",
    origin,
    destination,
    departureTime: "2024-03-15T00:00:00",
    arrivalTime: "2024-03-15T00:00:00",
    price: 100,
    aircraft: "A320"
  };
}

describe("isValidLayover", () => {
  it("rejects a domestic layover just under 45 minutes", () => {
    expect(isValidLayover(44, true)).toBe(false);
  });

  it("accepts a domestic layover of exactly 45 minutes", () => {
    expect(isValidLayover(45, true)).toBe(true);
  });

  it("rejects an international layover just under 90 minutes", () => {
    expect(isValidLayover(89, false)).toBe(false);
  });

  it("accepts an international layover of exactly 90 minutes", () => {
    expect(isValidLayover(90, false)).toBe(true);
  });

  it("accepts a layover of exactly 360 minutes (max)", () => {
    expect(isValidLayover(360, true)).toBe(true);
    expect(isValidLayover(360, false)).toBe(true);
  });

  it("rejects a layover of 361 minutes", () => {
    expect(isValidLayover(361, true)).toBe(false);
    expect(isValidLayover(361, false)).toBe(false);
  });
});

describe("isDomesticConnection", () => {
  const airportsByCode = new Map<string, Airport>([
    ["JFK", airport("JFK", "US")],
    ["ORD", airport("ORD", "US")],
    ["LAX", airport("LAX", "US")],
    ["LHR", airport("LHR", "GB")],
    ["CDG", airport("CDG", "FR")]
  ]);

  it("classifies JFK -> ORD -> LAX as domestic (spec example)", () => {
    const prev = flight("SP1", "JFK", "ORD");
    const next = flight("SP2", "ORD", "LAX");
    expect(isDomesticConnection(prev, next, airportsByCode)).toBe(true);
  });

  it("classifies JFK -> LHR -> CDG as international (spec example)", () => {
    const prev = flight("SP3", "JFK", "LHR");
    const next = flight("SP4", "LHR", "CDG");
    expect(isDomesticConnection(prev, next, airportsByCode)).toBe(false);
  });

  it("classifies a same-country round trip through a foreign layover as international", () => {
    // JFK -> LHR -> JFK: comparing only the two outer endpoints (both JFK, both US)
    // would wrongly call this domestic. The arriving leg itself crosses into GB, so
    // it must be international.
    const prev = flight("SP5", "JFK", "LHR");
    const next = flight("SP6", "LHR", "JFK");
    expect(isDomesticConnection(prev, next, airportsByCode)).toBe(false);
  });
});
