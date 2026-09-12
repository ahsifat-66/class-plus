import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validations/auth";
import { comparePassword } from "@/lib/auth/password";
import { signJwtToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod validation
    const parseResult = signInSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid credentials format";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { email, password } = parseResult.data;

    // 2. Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password. Please check your credentials." },
        { status: 401 }
      );
    }

    // 3. Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password. Please check your credentials." },
        { status: 401 }
      );
    }

    // 4. Sign JWT
    const token = await signJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const redirectTo = user.role === "TEACHER" ? "/dashboard/teacher" : "/dashboard/student";

    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };

    const response = NextResponse.json({
      user: sanitizedUser,
      redirectTo,
      message: `Welcome back, ${user.name}!`,
    });

    // Set secure HTTP-only cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    response.cookies.set("classpulse_user_email", user.email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error in login:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
