import { LayoverDTO } from "../types/itinerary";
import { formatMinutes } from "../utils/format";

export default function LayoverBadge({ layover }: { layover: LayoverDTO }) {
  const isLong = layover.durationMinutes > 180;
  const isShort = layover.durationMinutes < 60;

  return (
    <div className={`layover-badge ${isLong ? "layover-long" : ""} ${isShort ? "layover-short" : ""}`.trim()}>
      Layover at {layover.airport} · {formatMinutes(layover.durationMinutes)}
      {layover.isInternational ? " · International" : ""}
    </div>
  );
}
