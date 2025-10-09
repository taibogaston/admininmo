import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

const forwardHeaders = (req: NextRequest) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const cookie = req.headers.get("cookie");
  if (cookie) {
    headers["Cookie"] = cookie;
  }
  const authorization = req.headers.get("authorization");
  if (authorization) {
    headers["Authorization"] = authorization;
  }
  return headers;
};

export async function GET(req: NextRequest) {
  const res = await fetch(`${API_BASE_URL}/api/inmobiliarias`, {
    method: "GET",
    headers: forwardHeaders(req),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const res = await fetch(`${API_BASE_URL}/api/inmobiliarias`, {
    method: "POST",
    headers: forwardHeaders(req),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

