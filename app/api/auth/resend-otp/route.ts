import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, sendOtpEmail } from "@/lib/email/mailer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, type = "SIGNUP" } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found matching this email address." },
        { status: 404 }
      );
    }

    const otpType = type === "RESET_PASSWORD" ? "RESET_PASSWORD" : "SIGNUP";

    if (otpType === "SIGNUP" && user.isVerified) {
      return NextResponse.json(
        { error: "This account is already verified. Please sign in directly." },
        { status: 400 }
      );
    }

    // Generate new code
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Delete existing OTPs of this type
    await prisma.emailOtp.deleteMany({
      where: { userId: user.id, type: otpType },
    });

    await prisma.emailOtp.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        code: otpCode,
        type: otpType,
        expiresAt,
      },
    });

    const mailResult = await sendOtpEmail({
      to: normalizedEmail,
      code: otpCode,
      name: user.name,
      type: otpType,
    });

    const emailDelivered = mailResult.delivered;
    const emailError = mailResult.error;

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      emailDelivered,
      emailError,
      provider: mailResult.provider,
      devCode: mailResult?.fallback ? otpCode : undefined,
      message: emailDelivered
        ? `A new 6-digit verification code has been sent to ${normalizedEmail}.`
        : `New verification code generated, but email delivery failed (${emailError || "No email provider configured"}). Check server console for === DEV OTP CODE ===.`,
    });
  } catch (error: any) {
    console.error("Error resending OTP:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
