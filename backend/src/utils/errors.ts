export type ApiErrorCode =
  | "MISSING_PARAMETER"
  | "INVALID_FORMAT"
  | "INVALID_DATE_FORMAT"
  | "SAME_ORIGIN_DESTINATION"
  | "UNKNOWN_AIRPORT"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;
  field?: string;

  constructor(status: number, code: ApiErrorCode, message: string, field?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
  }
}
