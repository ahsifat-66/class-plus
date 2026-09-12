import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });

  response.cookies.set(AUTH_COOKIE_NAME, "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  response.cookies.set("classpulse_user_email", "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
