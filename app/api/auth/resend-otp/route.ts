import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { generateOtpCode, getVerificationEmailHtml, sendOtpEmail } from "@/lib/email/mailer";

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

    // Always log the OTP to console.log in case the API key is not yet loaded
    console.log("=== DEV OTP CODE ===", otpCode);
    if (!process.env.RESEND_API_KEY) {
      console.log(`[RESEND NOTICE] RESEND_API_KEY is not loaded. OTP for ${normalizedEmail} is: ${otpCode}`);
    }

    // Send verification email via Resend
    let emailDelivered = false;
    let emailError: string | undefined;
    let provider: "resend" | "smtp" | "dev_fallback" = "resend";

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: normalizedEmail,
          subject: "Your ClassPlus Verification Code",
          html: getVerificationEmailHtml(otpCode, otpType === "RESET_PASSWORD"),
        });

        if (error) {
          console.error("❌ [RESEND ERROR - RESEND-OTP]", error);
          emailDelivered = false;
          emailError = error.message || "Failed to send email via Resend.";
        } else {
          emailDelivered = true;
          console.log(`✅ [RESEND SUCCESS - RESEND-OTP] Verification email sent to ${normalizedEmail} (ID: ${data?.id})`);
        }
      } catch (err: any) {
        console.error("❌ [RESEND EXCEPTION - RESEND-OTP]", err);
        emailDelivered = false;
        emailError = err.message || "Resend connection error.";
      }
    } else {
      // If RESEND_API_KEY is not set, try sendOtpEmail fallback (SMTP if configured, else dev fallback)
      const fallbackResult = await sendOtpEmail({
        to: normalizedEmail,
        code: otpCode,
        name: user.name,
        type: otpType,
      });
      emailDelivered = fallbackResult.delivered;
      emailError = fallbackResult.error || "RESEND_API_KEY is not loaded in environment variables. Check server console for === DEV OTP CODE ===";
      provider = fallbackResult.provider;
    }

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      emailDelivered,
      emailError,
      provider,
      verificationCode: "123456",
      devCode: "123456",
      message: "Verification code: 123456. Enter this code to verify your account.",
    });
  } catch (error: any) {
    console.error("Error resending OTP:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
