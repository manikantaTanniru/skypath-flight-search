interface EmptyStateProps {
  origin: string;
  destination: string;
  date: string;
}

export default function EmptyState({ origin, destination, date }: EmptyStateProps) {
  return (
    <div className="state-panel">
      <p>
        No itineraries found from {origin} to {destination} on {date}.
      </p>
      <p className="state-panel-hint">Try a different date or route (max 2 connections are searched).</p>
    </div>
  );
}
