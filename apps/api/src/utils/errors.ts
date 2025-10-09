const DEFAULT_STATUS_CODES: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "UNPROCESSABLE_ENTITY",
  429: "TOO_MANY_REQUESTS",
  500: "INTERNAL_SERVER_ERROR",
  503: "SERVICE_UNAVAILABLE",
};

const resolveErrorCode = (status: number, explicitCode?: string): string => {
  if (explicitCode) {
    return explicitCode.toUpperCase();
  }
  return DEFAULT_STATUS_CODES[status] ?? `HTTP_${status}`;
};

export interface HttpErrorOptions {
  code?: string;
  details?: unknown;
}

export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, options: HttpErrorOptions = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = resolveErrorCode(status, options.code);
    this.details = options.details;
  }
}

export const isHttpError = (error: unknown): error is HttpError => error instanceof HttpError;

export const assert = (condition: unknown, status: number, message: string, options?: HttpErrorOptions): void => {
  if (!condition) {
    throw new HttpError(status, message, options);
  }
};
