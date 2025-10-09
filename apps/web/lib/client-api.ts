import { API_BASE_URL } from "./config";

export type ApiErrorPayload = {
  status: "error";
  message: string;
  code?: string;
  requestId?: string;
  details?: unknown;
  issues?: Array<{ path: string; message: string }>;
  [key: string]: unknown;
};

export class ApiError<T = unknown> extends Error {
  status: number;
  code?: string;
  details?: T;
  requestId?: string;
  payload?: ApiErrorPayload | null;

  constructor(init: { message: string; status: number; code?: string; details?: T; requestId?: string; payload?: ApiErrorPayload | null }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
    this.requestId = init.requestId;
    this.payload = init.payload;
  }
}

const extractJson = async (response: Response): Promise<ApiErrorPayload | null> => {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }
  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return null;
  }
};

const extractErrorMessage = (payload: ApiErrorPayload | null, status: number): string => {
  if (payload && typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message;
  }
  return `Error ${status}`;
};

export const clientApiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const base = API_BASE_URL;
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  const payload = await extractJson(res);

  if (!res.ok) {
    const message = extractErrorMessage(payload, res.status);
    const requestId = res.headers.get("x-request-id") ?? payload?.requestId;
    throw new ApiError({
      message,
      status: res.status,
      code: payload?.code,
      details: (payload?.details ?? payload?.issues) as unknown,
      requestId: requestId ?? undefined,
      payload,
    });
  }

  return (payload as T) ?? (undefined as T);
};
