import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";
import { verifyJwtToken, signJwtToken } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Safely handle unauthenticated users:
    // If no auth token / session cookie is found, immediately return { user: null } with status 200
    const cookieStore = cookies();
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value || cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Verify JWT session token
    const session = await verifyJwtToken(token);
    if (!session || !session.id) {
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }

    // 2. Prevent Prisma crashes & 3. Wrap database query in try...catch
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
      });

      // If !user, return { user: null } with status 200 and clear the invalid session cookie
      if (!user) {
        const response = NextResponse.json({ user: null }, { status: 200 });
        response.cookies.delete(AUTH_COOKIE_NAME);
        return response;
      }

      return NextResponse.json({ user }, { status: 200 });
    } catch (dbError) {
      // Catch any Prisma/DB error and safely return { user: null } with status 200
      console.error("Database error in /api/auth/me:", dbError);
      return NextResponse.json({ user: null }, { status: 200 });
    }
  } catch (error) {
    console.error("Unexpected error in /api/auth/me:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const token = await signJwtToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      const response = NextResponse.json({ user, message: "User switched successfully" });
      response.cookies.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return response;
    } catch (dbError) {
      console.error("Database error in /api/auth/me POST:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error switching user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
