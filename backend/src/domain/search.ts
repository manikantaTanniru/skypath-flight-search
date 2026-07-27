import { Airport, Flight, FlightGraph } from "../types/flight";
import { ItineraryDTO, LayoverDTO, SegmentDTO } from "../types/itinerary";
import { diffMinutes, toInstant } from "../utils/time";
import { isDomesticConnection, isValidLayover } from "./rules";

const DEFAULT_MAX_STOPS = 2;

/**
 * Depth-limited DFS over the flight graph. Explores paths of 1 to (maxStops + 1)
 * segments starting at `origin`, pruning any connection that violates the layover
 * rules, and stops extending a path as soon as it reaches `destination` (an
 * itinerary never flies past its own destination).
 */
export function searchItineraries(
  graph: FlightGraph,
  origin: string,
  destination: string,
  date: string,
  maxStops: number = DEFAULT_MAX_STOPS
): ItineraryDTO[] {
  const results: ItineraryDTO[] = [];
  const firstLegs = (graph.flightsByOrigin.get(origin) ?? []).filter(
    (flight) => flight.departureTime.slice(0, 10) === date
  );

  function extend(path: Flight[], visitedAirports: Set<string>): void {
    const lastFlight = path[path.length - 1];

    if (lastFlight.destination === destination) {
      results.push(toItineraryDTO(path, graph.airportsByCode));
      return;
    }

    if (path.length === maxStops + 1) {
      return;
    }

    const candidates = graph.flightsByOrigin.get(lastFlight.destination) ?? [];
    for (const next of candidates) {
      if (visitedAirports.has(next.destination)) {
        continue;
      }

      const layoverMinutes = diffMinutes(
        toInstant(next.departureTime, graph.airportsByCode.get(next.origin)!.timezone),
        toInstant(lastFlight.arrivalTime, graph.airportsByCode.get(lastFlight.destination)!.timezone)
      );
      const domestic = isDomesticConnection(lastFlight, next, graph.airportsByCode);

      if (!isValidLayover(layoverMinutes, domestic)) {
        continue;
      }

      extend([...path, next], new Set([...visitedAirports, next.destination]));
    }
  }

  for (const first of firstLegs) {
    extend([first], new Set([origin, first.destination]));
  }

  results.sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes);
  return results;
}

function toItineraryDTO(path: Flight[], airportsByCode: Map<string, Airport>): ItineraryDTO {
  const segments: SegmentDTO[] = path.map((flight) => {
    const originAirport = airportsByCode.get(flight.origin)!;
    const destinationAirport = airportsByCode.get(flight.destination)!;
    const durationMinutes = diffMinutes(
      toInstant(flight.arrivalTime, destinationAirport.timezone),
      toInstant(flight.departureTime, originAirport.timezone)
    );

    return {
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      origin: flight.origin,
      destination: flight.destination,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      price: flight.price,
      aircraft: flight.aircraft,
      durationMinutes
    };
  });

  const layovers: LayoverDTO[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const prev = path[i];
    const next = path[i + 1];
    const layoverMinutes = diffMinutes(
      toInstant(next.departureTime, airportsByCode.get(next.origin)!.timezone),
      toInstant(prev.arrivalTime, airportsByCode.get(prev.destination)!.timezone)
    );
    const domestic = isDomesticConnection(prev, next, airportsByCode);

    layovers.push({
      airport: prev.destination,
      durationMinutes: layoverMinutes,
      isInternational: !domestic
    });
  }

  const firstFlight = path[0];
  const lastFlight = path[path.length - 1];
  const totalDurationMinutes = diffMinutes(
    toInstant(lastFlight.arrivalTime, airportsByCode.get(lastFlight.destination)!.timezone),
    toInstant(firstFlight.departureTime, airportsByCode.get(firstFlight.origin)!.timezone)
  );
  const totalPrice = Math.round(path.reduce((sum, flight) => sum + flight.price, 0) * 100) / 100;

  return {
    segments,
    layovers,
    totalDurationMinutes,
    totalPrice,
    stops: path.length - 1
  };
}
