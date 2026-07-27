import { ApiErrorPayload, SearchResponse } from "../types/itinerary";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export interface SearchParams {
  origin: string;
  destination: string;
  date: string;
}

export class ApiClientError extends Error {
  code?: string;
  field?: string;

  constructor(message: string, code?: string, field?: string) {
    super(message);
    this.code = code;
    this.field = field;
  }
}

export async function search(params: SearchParams): Promise<SearchResponse> {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    date: params.date
  }).toString();

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/search?${query}`);
  } catch {
    throw new ApiClientError("Unable to reach the server. Please check your connection and try again.");
  }

  if (!res.ok) {
    let payload: { error?: ApiErrorPayload } = {};
    try {
      payload = await res.json();
    } catch {
      // fall through to generic error below
    }

    if (payload.error) {
      throw new ApiClientError(payload.error.message, payload.error.code, payload.error.field);
    }
    throw new ApiClientError(`Search failed with status ${res.status}`);
  }

  return res.json();
}
