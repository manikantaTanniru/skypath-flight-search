const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Segment timestamps are already local wall-clock time at the respective airport
 * (no UTC offset in the string) - format the raw components directly instead of
 * running them through `Date`, which would reinterpret them in the browser's own
 * timezone and silently produce the wrong displayed time.
 */
export function formatLocalDateTime(iso: string): string {
  const [datePart, timePart] = iso.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minuteStr = minute.toString().padStart(2, "0");

  return `${MONTH_NAMES[month - 1]} ${day}, ${year} · ${hour12}:${minuteStr} ${period}`;
}
