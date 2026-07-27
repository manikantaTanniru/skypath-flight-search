import { SegmentDTO } from "../types/itinerary";
import { formatLocalDateTime, formatMinutes, formatPrice } from "../utils/format";

export default function SegmentRow({ segment }: { segment: SegmentDTO }) {
  return (
    <div className="segment-row">
      <div className="segment-route">
        <span className="segment-airport">{segment.origin}</span>
        <span className="segment-arrow">→</span>
        <span className="segment-airport">{segment.destination}</span>
      </div>
      <div className="segment-times">
        <span>{formatLocalDateTime(segment.departureTime)}</span>
        <span className="segment-times-sep">–</span>
        <span>{formatLocalDateTime(segment.arrivalTime)}</span>
      </div>
      <div className="segment-meta">
        <span>
          {segment.flightNumber} · {segment.airline} · {segment.aircraft}
        </span>
        <span>{formatMinutes(segment.durationMinutes)}</span>
        <span>{formatPrice(segment.price)}</span>
      </div>
    </div>
  );
}
