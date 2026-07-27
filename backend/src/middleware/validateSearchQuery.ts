import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors";

const AIRPORT_CODE_RE = /^[A-Za-z]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface SearchQuery {
  origin: string;
  destination: string;
  date: string;
}

function isValidCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/**
 * Pure HTTP-input-shape validation: required fields present, airport codes are
 * 3 letters, date matches YYYY-MM-DD and is a real calendar date. Does not touch
 * the dataset - unknown-airport and same-origin/destination checks are the
 * service layer's job, since those require the loaded airport map.
 */
export function validateSearchQuery(req: Request, _res: Response, next: NextFunction): void {
  const { origin, destination, date } = req.query;

  if (typeof origin !== "string" || origin.length === 0) {
    return next(new ApiError(400, "MISSING_PARAMETER", "Missing required parameter: origin", "origin"));
  }
  if (typeof destination !== "string" || destination.length === 0) {
    return next(new ApiError(400, "MISSING_PARAMETER", "Missing required parameter: destination", "destination"));
  }
  if (typeof date !== "string" || date.length === 0) {
    return next(new ApiError(400, "MISSING_PARAMETER", "Missing required parameter: date", "date"));
  }

  if (!AIRPORT_CODE_RE.test(origin)) {
    return next(new ApiError(400, "INVALID_FORMAT", "origin must be a 3-letter IATA airport code", "origin"));
  }
  if (!AIRPORT_CODE_RE.test(destination)) {
    return next(
      new ApiError(400, "INVALID_FORMAT", "destination must be a 3-letter IATA airport code", "destination")
    );
  }

  if (!DATE_RE.test(date) || !isValidCalendarDate(date)) {
    return next(new ApiError(400, "INVALID_DATE_FORMAT", "date must be a valid YYYY-MM-DD date", "date"));
  }

  req.searchQuery = {
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    date
  };
  next();
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      searchQuery?: SearchQuery;
    }
  }
}
