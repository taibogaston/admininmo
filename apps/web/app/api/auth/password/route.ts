import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function PATCH(req: NextRequest) {
  const payload = await req.json();

  const res = await fetch(`${API_BASE_URL}/api/auth/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      cookie: req.headers.get("cookie") ?? "",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  return NextResponse.json(data, { status: res.status });
}

