import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "classpulse_token";
const JWT_SECRET_STR =
  process.env.JWT_SECRET || "classpulse_super_secure_jwt_secret_2026_key_fallback";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const emailCookie = req.cookies.get("classpulse_user_email")?.value;
  let userPayload: { id: string; email: string; role: string; name: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userPayload = {
        id: payload.id as string,
        email: payload.email as string,
        role: payload.role as string,
        name: payload.name as string,
      };
    } catch (err) {
      userPayload = null;
    }
  }

  // 1. If user is already authenticated and visits /login or /signup, redirect to dashboard
  if ((userPayload || emailCookie) && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 2. Protected UI routes requiring authentication redirect to login
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/classroom");

  if (isProtectedPage && !userPayload && !emailCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/profile/:path*",
    "/analytics/:path*",
    "/classroom/:path*",
  ],
};
