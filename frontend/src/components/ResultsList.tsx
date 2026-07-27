import { SearchResponse } from "../types/itinerary";
import ItineraryCard from "./ItineraryCard";

export default function ResultsList({ data }: { data: SearchResponse }) {
  return (
    <section className="results-list">
      <p className="results-count">
        {data.count} itinerar{data.count === 1 ? "y" : "ies"} found from {data.origin} to {data.destination} on{" "}
        {data.date}, sorted by duration.
      </p>
      {data.results.map((itinerary, i) => (
        <ItineraryCard key={i} itinerary={itinerary} />
      ))}
    </section>
  );
}
