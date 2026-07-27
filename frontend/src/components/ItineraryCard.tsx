import { ItineraryDTO } from "../types/itinerary";
import { formatMinutes, formatPrice } from "../utils/format";
import LayoverBadge from "./LayoverBadge";
import SegmentRow from "./SegmentRow";

function stopsLabel(stops: number): string {
  if (stops === 0) return "Direct";
  if (stops === 1) return "1 stop";
  return `${stops} stops`;
}

export default function ItineraryCard({ itinerary }: { itinerary: ItineraryDTO }) {
  return (
    <article className="itinerary-card">
      <header className="itinerary-header">
        <span className="itinerary-stops">{stopsLabel(itinerary.stops)}</span>
        <span className="itinerary-duration">{formatMinutes(itinerary.totalDurationMinutes)}</span>
        <span className="itinerary-price">{formatPrice(itinerary.totalPrice)}</span>
      </header>
      <div className="itinerary-segments">
        {itinerary.segments.map((segment, i) => (
          <div key={segment.flightNumber}>
            <SegmentRow segment={segment} />
            {itinerary.layovers[i] && <LayoverBadge layover={itinerary.layovers[i]} />}
          </div>
        ))}
      </div>
    </article>
  );
}
