import fs from "node:fs";
import { Dataset, FlightGraph } from "../types/flight";

export function loadDataset(path: string): Dataset {
  const raw = fs.readFileSync(path, "utf-8");
  const dataset = JSON.parse(raw) as Dataset;

  if (!Array.isArray(dataset.airports) || !Array.isArray(dataset.flights)) {
    throw new Error(`Invalid dataset at ${path}: expected "airports" and "flights" arrays`);
  }

  return dataset;
}

export function buildGraph(dataset: Dataset): FlightGraph {
  const airportsByCode = new Map(dataset.airports.map((airport) => [airport.code, airport]));
  const flightsByOrigin = new Map<string, typeof dataset.flights>();

  for (const rawFlight of dataset.flights) {
    // The dataset has a few flights with price serialized as a string (e.g. "289.00") —
    // coerce rather than reject, since the value itself is otherwise valid.
    const flight = { ...rawFlight, price: Number(rawFlight.price) };

    if (!airportsByCode.has(flight.origin)) {
      console.warn(`Flight ${flight.flightNumber} references unknown origin airport: ${flight.origin}`);
      continue;
    }
    if (!airportsByCode.has(flight.destination)) {
      console.warn(`Flight ${flight.flightNumber} references unknown destination airport: ${flight.destination}`);
      continue;
    }

    const bucket = flightsByOrigin.get(flight.origin);
    if (bucket) {
      bucket.push(flight);
    } else {
      flightsByOrigin.set(flight.origin, [flight]);
    }
  }

  return { airportsByCode, flightsByOrigin };
}
