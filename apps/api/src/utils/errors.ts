export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const assert = (condition: unknown, status: number, message: string): void => {
  if (!condition) {
    throw new HttpError(status, message);
  }
};
