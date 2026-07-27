import { DateTime } from "luxon";

/**
 * Resolves a local wall-clock ISO string (no UTC offset) against an IANA timezone,
 * producing an absolute instant. This is what makes duration math correct across
 * zones, DST, and the international date line.
 */
export function toInstant(localIso: string, timezone: string): DateTime {
  const instant = DateTime.fromISO(localIso, { zone: timezone });
  if (!instant.isValid) {
    throw new Error(`Invalid date/timezone: "${localIso}" in zone "${timezone}" (${instant.invalidReason})`);
  }
  return instant;
}

export function diffMinutes(later: DateTime, earlier: DateTime): number {
  return Math.round(later.diff(earlier, "minutes").minutes);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
