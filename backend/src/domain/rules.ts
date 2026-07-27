import { Airport, Flight } from "../types/flight";

export const MIN_LAYOVER_DOMESTIC_MIN = 45;
export const MIN_LAYOVER_INTL_MIN = 90;
export const MAX_LAYOVER_MIN = 360;

/**
 * A connection is domestic only if both the arriving leg and the departing leg are
 * themselves domestic flights (their own origin and destination share a country).
 * This is stricter than just comparing the connection's two outer airports: a
 * same-country round trip through a foreign layover (e.g. JFK -> LHR -> JFK) is
 * still classified international, since the arriving leg JFK->LHR crosses a border.
 */
export function isDomesticConnection(
  prevFlight: Flight,
  nextFlight: Flight,
  airportsByCode: Map<string, Airport>
): boolean {
  const prevOrigin = airportsByCode.get(prevFlight.origin);
  const prevDestination = airportsByCode.get(prevFlight.destination);
  const nextOrigin = airportsByCode.get(nextFlight.origin);
  const nextDestination = airportsByCode.get(nextFlight.destination);

  if (!prevOrigin || !prevDestination || !nextOrigin || !nextDestination) {
    throw new Error("isDomesticConnection: unknown airport code");
  }

  const arrivingLegDomestic = prevOrigin.country === prevDestination.country;
  const departingLegDomestic = nextOrigin.country === nextDestination.country;

  return arrivingLegDomestic && departingLegDomestic;
}

export function isValidLayover(layoverMinutes: number, isDomestic: boolean): boolean {
  const minRequired = isDomestic ? MIN_LAYOVER_DOMESTIC_MIN : MIN_LAYOVER_INTL_MIN;
  return layoverMinutes >= minRequired && layoverMinutes <= MAX_LAYOVER_MIN;
}
