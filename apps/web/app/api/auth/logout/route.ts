import { NextResponse } from "next/server";
import { JWT_COOKIE_NAME } from "@admin-inmo/shared";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(JWT_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
