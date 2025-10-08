import { cookies } from "next/headers";
import { JWT_COOKIE_NAME } from "@admin-inmo/shared";
import { API_BASE_URL } from "./config";

export async function serverApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = cookies().get(JWT_COOKIE_NAME)?.value;

  const headers = new Headers(init.headers ?? {});
  headers.set("Accept", "application/json");
  headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers,
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `API request failed (${res.status})`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
