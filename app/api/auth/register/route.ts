import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/auth/password";
import { signJwtToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

const DEFAULT_AVATARS = {
  TEACHER: [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  ],
  STUDENT: [
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  ],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod validation
    const parseResult = signUpSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password, role, teacherCode } = parseResult.data;

    // Optional teacherCode check: if TEACHER_ACCESS_CODE is set in env and user provided one
    if (role === "TEACHER" && process.env.STRICT_TEACHER_CODE === "true") {
      const expectedCode = process.env.TEACHER_ACCESS_CODE || "TEACHER2024";
      if (!teacherCode || teacherCode.trim() !== expectedCode) {
        return NextResponse.json(
          {
            error:
              "Invalid Teacher Access Code. Please enter valid code (TEACHER2024).",
          },
          { status: 403 }
        );
      }
    }

    // 2. Check for existing account
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // 3. Hash password with bcrypt
    const hashedPassword = await hashPassword(password);

    // Pick avatar
    const avatarList = DEFAULT_AVATARS[role];
    const avatar = avatarList[Math.floor(Math.random() * avatarList.length)];

    // 4. Create user in database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        avatar,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        institution: true,
        grade: true,
        bio: true,
        createdAt: true,
      },
    });

    // 5. Sign JWT token
    const token = await signJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const isSecure = req.nextUrl.protocol === "https:";
    const redirectTo = role === "TEACHER" ? "/dashboard?view=teaching" : "/dashboard?view=enrolled";

    const response = NextResponse.json({
      user,
      token,
      redirectTo,
      message: `Account created successfully as ${role}!`,
    });

    // Set secure HTTP-only cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    // Also set email cookie for client context
    response.cookies.set("classpulse_user_email", user.email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: isSecure,
    });

    return response;
  } catch (error) {
    console.error("Error in registration:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
