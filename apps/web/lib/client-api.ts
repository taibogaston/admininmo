import { API_BASE_URL } from "./config";

export const clientApiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const base = API_BASE_URL;
  const res = await fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, {
    ...options,
    credentials: "include",
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Error ${res.status}`);
  }
  return (await res.json()) as T;
};
