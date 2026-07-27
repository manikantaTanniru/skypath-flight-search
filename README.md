# SkyPath: Flight Connection Search Engine

A prototype flight connection search engine: a Node.js/TypeScript/Express backend and a
React/TypeScript/Vite frontend for searching direct and connecting itineraries (up to 2 stops)
between two airports on a given date, built against the provided `flights.json` dataset (25
airports, ~300 flights on 2024-03-15/16).

## How to run

### Docker (recommended)

```bash
docker-compose up
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000/api/search

> Note: this was built in an environment without Docker installed, so `docker-compose up`
> itself has not been executed end-to-end. Both Dockerfiles and the compose file were written
> and reviewed carefully (see "Tradeoffs" below), but please treat this as unverified until run.

### Without Docker

```bash
# Backend
cd backend
npm install
cp .env.example .env      # DATA_PATH defaults to ../flights.json
npm run dev                # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env       # VITE_API_BASE_URL defaults to http://localhost:4000
npm run dev                 # http://localhost:5173
```

### Tests

```bash
cd backend
npm test        # 39 unit + integration tests (vitest + supertest)
```

## Architecture

```
backend/src/
  data/       loadDataset() + buildGraph()  - parses flights.json once at boot into an
              airport map + an adjacency list of flights keyed by origin airport code
  utils/      time.ts (timezone-aware instant math), errors.ts (ApiError)
  domain/     rules.ts (layover/domestic rules), search.ts (the graph search itself) -
              pure, framework-agnostic, unit-testable without Express
  services/   searchService.ts - data-dependent validation + orchestration
  routes/     HTTP layer only
  middleware/ HTTP-shape validation + centralized error handling
```

The search itself is a **depth-limited DFS** over the flight graph (max 3 segments / 2 stops),
not a precomputed table of all possible itineraries. At this dataset size (~300 flights, 25
airports) a DFS with layover pruning explores at most a few thousand candidate paths per query -
comfortably fast without any precomputation, and it scales naturally if the dataset grows,
since nothing is memoized or invalidated ahead of time.

Frontend components are similarly layered: `SearchForm` → `useFlightSearch` (idle/loading/
success/error state machine) → `searchClient` (typed fetch wrapper) → `ResultsList` →
`ItineraryCard` → `SegmentRow` / `LayoverBadge`.

## Timezone handling

All times in the dataset are **local wall-clock time** at the respective airport, with no UTC
offset in the string (e.g. `"2024-03-15T08:30:00"`). Naively subtracting two such strings (or
comparing them as `Date` objects without zone info) breaks in two ways: it ignores different UTC
offsets at the two airports, and it breaks entirely across the international date line.

`backend/src/utils/time.ts` resolves each local timestamp against its airport's IANA timezone
(e.g. `America/New_York`, `Australia/Sydney`) using `luxon`'s `DateTime.fromISO(str, { zone })`,
producing an absolute instant. All duration math (segment duration, layover duration, total
itinerary duration) is then a simple instant-to-instant difference.

Worked example: flight `SP540` departs Sydney `2024-03-15T09:00:00` and arrives LAX
`2024-03-15T06:00:00` - the raw strings make it look like arrival is *before* departure. Once
each is resolved against its zone (`Australia/Sydney` is UTC+11 in mid-March; `America/Los_Angeles`
is UTC-7 under PDT), the real elapsed time comes out to 900 minutes (15 hours) - correct, and
covered by a unit test in `tests/unit/time.test.ts`.

The frontend never re-derives or converts these times - it displays the raw local components
(`utils/format.ts`) exactly as returned by the API, since running an already-local string through
the browser's own timezone would silently produce the wrong displayed time.

## Connection rules

| Rule | Value |
|---|---|
| Minimum layover, domestic connection | 45 minutes (inclusive) |
| Minimum layover, international connection | 90 minutes (inclusive) |
| Maximum layover | 360 minutes / 6 hours (inclusive) |
| Airport changes during a layover | Not allowed (must depart from the exact airport the previous flight arrived at) |

**Domestic vs. international (assumption, since the spec is ambiguous for 3+ countries):** the
spec states "a connection is domestic if both the arriving and departing flights are within the
same country," with examples `JFK→ORD→LAX` = domestic and `JFK→LHR→CDG` = international. We
implement this as: **a connection is domestic only if both the arriving leg and the departing
leg are themselves domestic flights** (each leg's own origin and destination share a country).
This is stricter than comparing just the connection's two outer airports - a same-country round
trip through a foreign layover (e.g. `JFK→LHR→JFK`) is still correctly classified international
under our rule, since the arriving leg itself crosses into GB, even though a naive "compare outer
endpoints" rule would call it domestic. Both spec examples check out under this rule; see
`backend/tests/unit/rules.test.ts`.

**Airport continuity** (no `JFK→LGA`-style connections) is enforced structurally, not by an
explicit check: the search only looks up onward flights keyed by the *previous flight's exact
arrival airport code*, so a flight departing a different airport - even in the same city - is
never reachable as a continuation. Covered by a same-city fixture test in `search.test.ts`.

## API contract

`GET /api/search?origin=JFK&destination=LAX&date=2024-03-15`

Success (200):
```json
{
  "origin": "JFK", "destination": "LAX", "date": "2024-03-15", "count": 1,
  "results": [{
    "segments": [{
      "flightNumber": "SP101", "airline": "SkyPath Airways",
      "origin": "JFK", "destination": "LAX",
      "departureTime": "2024-03-15T08:30:00", "arrivalTime": "2024-03-15T11:45:00",
      "price": 299, "aircraft": "A320", "durationMinutes": 375
    }],
    "layovers": [],
    "totalDurationMinutes": 375, "totalPrice": 299, "stops": 0
  }]
}
```

Errors (uniform envelope, 4xx/5xx):
```json
{ "error": { "code": "UNKNOWN_AIRPORT", "message": "Unknown airport code: XXX", "field": "origin" } }
```

| Case | Status | code |
|---|---|---|
| missing origin/destination/date | 400 | `MISSING_PARAMETER` |
| origin/destination not 3 letters | 400 | `INVALID_FORMAT` |
| date not a valid `YYYY-MM-DD` | 400 | `INVALID_DATE_FORMAT` |
| origin === destination | 400 | `SAME_ORIGIN_DESTINATION` |
| unknown airport code | 400 | `UNKNOWN_AIRPORT` |
| valid request, no itineraries found | 200, `count: 0` | n/a |
| unexpected server error | 500 | `INTERNAL_ERROR` |

## Data quirks handled

Inspecting `flights.json` turned up two real data-quality issues, handled rather than crashed on:
- Flight `SP995` references origin airport `JKF` (a typo for `JFK`, presumably) - not present in
  the airports list. The loader logs a warning and excludes that one flight from the graph rather
  than failing to start.
- Three flights (`SP995`, `SP996`, `SP998`) have `price` serialized as a **string** (e.g.
  `"289.00"`) instead of a number. The loader coerces it with `Number(...)` rather than rejecting
  the record, since the value itself is valid.

## Tradeoffs considered

- **DFS-by-depth vs. precomputing all itineraries at startup:** chosen DFS for simplicity and
  because it scales with dataset growth without needing invalidation; a precomputed table would
  make each request O(1) lookup but adds startup cost and staleness risk for no real benefit at
  this data size.
- **`origin === destination` returns a 400** rather than an empty 200 - the spec allows either;
  a clear validation message is better UX and easier to test deterministically than an empty list
  that could also mean "no route found."
- **Client-side validation duplicates backend rules** (airport code format, required fields,
  origin != destination) for instant feedback, but the backend remains the single source of
  truth - never trust client-only validation.
- **`flights.json` is mounted via a Docker volume**, not copied into the backend image, so there's
  a single source of truth for the dataset across local dev and Docker.

## What I'd improve with more time

- Component and hook tests on the frontend (React Testing Library) - currently verified manually/
  visually in a headless browser rather than with an automated frontend test suite.
- Sort tiebreaker on price when two itineraries have identical total duration.
- Airline/price filters and a "cheapest" sort option in the UI.
- An OpenAPI spec for the backend contract.
- Pagination or result capping for routes that produce very large result sets (some routes in
  this dataset return 25+ itineraries).
- Structured logging and basic rate limiting for the API.
- Actually running `docker-compose up` end-to-end in an environment with Docker installed (see
  the note under "How to run").

## Assumptions made

- Domestic/international classification, `origin === destination` behavior, and the
  price-string/misspelled-airport data quirks are all documented above with reasoning.
- The search date filters on the **first leg's local departure date** at the origin airport
  (i.e. `departureTime`'s date portion), matching how a traveler would naturally phrase "flights
  departing on this date."
- Layover minimum/maximum bounds are treated as **inclusive** on both ends (a layover of exactly
  45/90/360 minutes is valid).
