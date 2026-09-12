import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_EMAIL } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const userEmailCookie = cookieStore.get("classpulse_user_email")?.value;
    const targetEmail = userEmailCookie || DEFAULT_USER_EMAIL;

    let user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!user) {
      // Fallback to first user in database
      user = await prisma.user.findFirst();
    }

    if (!user) {
      return NextResponse.json({ error: "No users found" }, { status: 404 });
    }

    return NextResponse.json({ user });
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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const response = NextResponse.json({ user, message: "User switched successfully" });
    response.cookies.set("classpulse_user_email", user.email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error switching user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
