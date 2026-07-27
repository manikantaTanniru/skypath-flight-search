import { searchItineraries } from "../domain/search";
import { FlightGraph } from "../types/flight";
import { SearchResponse } from "../types/itinerary";
import { ApiError } from "../utils/errors";

export function runSearch(
  graph: FlightGraph,
  origin: string,
  destination: string,
  date: string
): SearchResponse {
  if (origin === destination) {
    throw new ApiError(400, "SAME_ORIGIN_DESTINATION", "origin and destination must be different airports", "origin");
  }
  if (!graph.airportsByCode.has(origin)) {
    throw new ApiError(400, "UNKNOWN_AIRPORT", `Unknown airport code: ${origin}`, "origin");
  }
  if (!graph.airportsByCode.has(destination)) {
    throw new ApiError(400, "UNKNOWN_AIRPORT", `Unknown airport code: ${destination}`, "destination");
  }

  const results = searchItineraries(graph, origin, destination, date);

  return { origin, destination, date, count: results.length, results };
}
