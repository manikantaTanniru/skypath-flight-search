export interface SegmentDTO {
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  aircraft: string;
  durationMinutes: number;
}

export interface LayoverDTO {
  airport: string;
  durationMinutes: number;
  isInternational: boolean;
}

export interface ItineraryDTO {
  segments: SegmentDTO[];
  layovers: LayoverDTO[];
  totalDurationMinutes: number;
  totalPrice: number;
  stops: number;
}

export interface SearchResponse {
  origin: string;
  destination: string;
  date: string;
  count: number;
  results: ItineraryDTO[];
}
