import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, 6-digit verification code, and new password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found matching this email." },
        { status: 404 }
      );
    }

    // Validate OTP (supports fixed code 123456 while domain is not yet configured)
    const isFixedCode = trimmedCode === "123456";

    if (!isFixedCode) {
      const latestOtp = await prisma.emailOtp.findFirst({
        where: {
          userId: user.id,
          type: "RESET_PASSWORD",
        },
        orderBy: { createdAt: "desc" },
      });

      if (!latestOtp) {
        return NextResponse.json(
          { error: "No active password reset request found. Please request a new code or enter 123456." },
          { status: 400 }
        );
      }

      if (new Date() > new Date(latestOtp.expiresAt)) {
        return NextResponse.json(
          { error: "Verification code has expired. Please request a new code or enter 123456." },
          { status: 400 }
        );
      }

      if (latestOtp.code !== trimmedCode) {
        return NextResponse.json(
          { error: "Incorrect verification code. Please check your email or enter 123456." },
          { status: 400 }
        );
      }
    }

    // Hash new password and activate account
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isVerified: true,
      },
    });

    // Cleanup reset OTPs
    await prisma.emailOtp.deleteMany({
      where: { userId: user.id, type: "RESET_PASSWORD" },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now sign in with your new password.",
    });
  } catch (error: any) {
    console.error("Error in reset-password:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
