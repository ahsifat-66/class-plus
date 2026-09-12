import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "classpulse_token";
const JWT_SECRET_STR =
  process.env.JWT_SECRET || "classpulse_super_secure_jwt_secret_2026_key_fallback";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
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

  // 1. If user is already authenticated and visits /login or /signup, redirect to their role dashboard
  if (userPayload && (pathname === "/login" || pathname === "/signup")) {
    const targetDashboard =
      userPayload.role === "TEACHER" ? "/dashboard/teacher" : "/dashboard/student";
    return NextResponse.redirect(new URL(targetDashboard, req.url));
  }

  // 2. Protected Teacher Routes: /dashboard/teacher and /api/teacher/*
  if (pathname.startsWith("/dashboard/teacher") || pathname.startsWith("/api/teacher")) {
    if (!userPayload) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
      }
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userPayload.role !== "TEACHER") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden: Teacher privileges required." },
          { status: 403 }
        );
      }
      // Redirect student attempting to access teacher dashboard to student dashboard with error query
      const studentDashUrl = new URL("/dashboard/student", req.url);
      studentDashUrl.searchParams.set(
        "error",
        "Access denied. You must be a Teacher to access the Teacher Portal."
      );
      return NextResponse.redirect(studentDashUrl);
    }
  }

  // 3. Protected Student Routes: /dashboard/student and /api/student/*
  if (pathname.startsWith("/dashboard/student") || pathname.startsWith("/api/student")) {
    if (!userPayload) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
      }
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userPayload.role !== "STUDENT") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden: Student privileges required." },
          { status: 403 }
        );
      }
      // Redirect teacher attempting to access student dashboard to teacher dashboard with error query
      const teacherDashUrl = new URL("/dashboard/teacher", req.url);
      teacherDashUrl.searchParams.set(
        "error",
        "Access denied. You must be a Student to access the Student Portal."
      );
      return NextResponse.redirect(teacherDashUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/api/teacher/:path*",
    "/api/student/:path*",
  ],
};
