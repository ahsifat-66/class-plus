import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validations/auth";
import { comparePassword } from "@/lib/auth/password";
import { signJwtToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate payload
    const parseResult = signInSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { email, password } = parseResult.data;

    // 2. Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address. Please sign up." },
        { status: 401 }
      );
    }

    // 3. Compare password hash
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    // 4. Sign JWT session token
    const token = await signJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const isSecure = req.nextUrl.protocol === "https:";
    const redirectTo = user.role === "TEACHER" ? "/dashboard?view=teaching" : "/dashboard?view=enrolled";

    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      institution: user.institution,
      grade: user.grade,
      bio: user.bio,
      createdAt: user.createdAt,
    };

    const response = NextResponse.json({
      user: sanitizedUser,
      token,
      redirectTo,
      message: `Welcome back, ${user.name}!`,
    });

    // Set secure HTTP-only cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    response.cookies.set("classpulse_user_email", user.email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: isSecure,
    });

    return response;
  } catch (error) {
    console.error("Error in login:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
