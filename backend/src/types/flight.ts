export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
}

export interface Flight {
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  aircraft: string;
}

export interface Dataset {
  airports: Airport[];
  flights: Flight[];
}

export interface FlightGraph {
  airportsByCode: Map<string, Airport>;
  flightsByOrigin: Map<string, Flight[]>;
}
