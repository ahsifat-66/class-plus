import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_EMAIL } from "@/lib/auth";
import { cookies } from "next/headers";
import { getSessionUser, AUTH_COOKIE_NAME } from "@/lib/auth/session";
import { signJwtToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    // 1. Try JWT session token
    const session = await getSessionUser();
    if (session) {
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
      if (user) {
        return NextResponse.json({ user });
      }
    }

    // 2. Fallback to email cookie or default user
    const cookieStore = cookies();
    const userEmailCookie = cookieStore.get("classpulse_user_email")?.value;
    const targetEmail = userEmailCookie || DEFAULT_USER_EMAIL;

    let user = await prisma.user.findUnique({
      where: { email: targetEmail },
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
      user = await prisma.user.findFirst({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "No users found" }, { status: 404 });
    }

    // Auto-issue JWT token for valid user
    const token = await signJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({ user });
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    response.cookies.set("classpulse_user_email", user.email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

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
    response.cookies.set("classpulse_user_email", user.email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error switching user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
