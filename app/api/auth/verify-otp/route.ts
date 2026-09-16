import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJwtToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || typeof email !== "string" || !code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Email address and 6-digit verification code are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    // 1. Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found matching this email address." },
        { status: 404 }
      );
    }

    // 2. Find latest valid SIGNUP OTP
    const latestOtp = await prisma.emailOtp.findFirst({
      where: {
        userId: user.id,
        type: "SIGNUP",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOtp) {
      return NextResponse.json(
        { error: "No active verification code found. Please request a new code." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(latestOtp.expiresAt)) {
      return NextResponse.json(
        { error: "Verification code has expired. Please click 'Resend Code'." },
        { status: 400 }
      );
    }

    if (latestOtp.code !== trimmedCode) {
      return NextResponse.json(
        { error: "Incorrect verification code. Please check your email and try again." },
        { status: 400 }
      );
    }

    // 3. Mark user as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        avatar: true,
        avatarUrl: true,
        institution: true,
        grade: true,
        bio: true,
        createdAt: true,
      },
    });

    // Clean up OTPs
    await prisma.emailOtp.deleteMany({
      where: { userId: user.id, type: "SIGNUP" },
    });

    // 4. Issue JWT session token
    const token = await signJwtToken({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
    });

    const isSecure = req.nextUrl.protocol === "https:";
    const redirectTo =
      updatedUser.role === "TEACHER"
        ? "/dashboard?view=teaching"
        : "/dashboard?view=enrolled";

    const response = NextResponse.json({
      success: true,
      user: updatedUser,
      token,
      redirectTo,
      message: "Email verified successfully! Welcome to ClassPulse.",
    });

    // Set HTTP-only cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    response.cookies.set("classpulse_user_email", updatedUser.email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: isSecure,
    });

    return response;
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during verification." },
      { status: 500 }
    );
  }
}
