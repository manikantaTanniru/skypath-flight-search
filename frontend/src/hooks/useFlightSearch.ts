import { useCallback, useState } from "react";
import { ApiClientError, search, SearchParams } from "../api/searchClient";
import { SearchResponse } from "../types/itinerary";

export type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: SearchResponse }
  | { status: "error"; error: { code?: string; message: string; field?: string } };

export function useFlightSearch() {
  const [state, setState] = useState<SearchState>({ status: "idle" });

  const runSearch = useCallback(async (params: SearchParams) => {
    setState({ status: "loading" });
    try {
      const data = await search(params);
      setState({ status: "success", data });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setState({ status: "error", error: { code: err.code, message: err.message, field: err.field } });
      } else {
        setState({ status: "error", error: { message: "An unexpected error occurred." } });
      }
    }
  }, []);

  return { state, runSearch };
}
