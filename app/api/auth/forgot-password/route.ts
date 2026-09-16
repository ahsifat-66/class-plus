import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, sendOtpEmail } from "@/lib/email/mailer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

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
      // Don't leak user existence; return generic positive response
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a 6-digit reset code has been sent.",
      });
    }

    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Clear previous reset OTPs
    await prisma.emailOtp.deleteMany({
      where: { userId: user.id, type: "RESET_PASSWORD" },
    });

    await prisma.emailOtp.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        code: otpCode,
        type: "RESET_PASSWORD",
        expiresAt,
      },
    });

    const mailResult = await sendOtpEmail({
      to: normalizedEmail,
      code: otpCode,
      name: user.name,
      type: "RESET_PASSWORD",
    });

    return NextResponse.json({
      success: true,
      requireOtp: true,
      email: normalizedEmail,
      devCode: mailResult?.fallback ? otpCode : undefined,
      message: `A 6-digit password reset code has been sent to ${normalizedEmail}.`,
    });
  } catch (error: any) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
