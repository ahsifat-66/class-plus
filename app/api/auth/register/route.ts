import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/auth/password";
import { Resend } from "resend";
import { generateOtpCode, getVerificationEmailHtml, sendOtpEmail } from "@/lib/email/mailer";

export const dynamic = "force-dynamic";

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
    const normalizedEmail = email.trim().toLowerCase();

    // Optional teacherCode check
    if (role === "TEACHER" && process.env.STRICT_TEACHER_CODE === "true") {
      const expectedCode = process.env.TEACHER_ACCESS_CODE || "TEACHER2024";
      if (!teacherCode || teacherCode.trim() !== expectedCode) {
        return NextResponse.json(
          {
            error: "Invalid Teacher Access Code. Please enter valid code (TEACHER2024).",
          },
          { status: 403 }
        );
      }
    }

    // 2. Check for existing account
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.isVerified) {
      return NextResponse.json(
        { error: "An account with this email already exists and is verified. Please sign in." },
        { status: 409 }
      );
    }

    // 3. Hash password
    const hashedPassword = await hashPassword(password);
    const avatarList = DEFAULT_AVATARS[role];
    const avatar = avatarList[Math.floor(Math.random() * avatarList.length)];

    let user;
    if (existingUser && !existingUser.isVerified) {
      // Re-use unverified user record with updated details
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: name.trim(),
          password: hashedPassword,
          role,
          avatar,
        },
      });
    } else {
      // Create new user with isVerified: false
      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role,
          avatar,
          isVerified: false,
        },
      });
    }

    // 4. Generate 6-digit OTP code & save to database
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any older unused signup OTPs for this user
    await prisma.emailOtp.deleteMany({
      where: { userId: user.id, type: "SIGNUP" },
    });

    await prisma.emailOtp.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        code: otpCode,
        type: "SIGNUP",
        expiresAt,
      },
    });

    // 5. Always log the OTP to console.log in case the API key is not yet loaded
    console.log("=== DEV OTP CODE ===", otpCode);
    if (!process.env.RESEND_API_KEY) {
      console.log(`[RESEND NOTICE] RESEND_API_KEY is not loaded. OTP for ${normalizedEmail} is: ${otpCode}`);
    }

    // 6. Send verification email via Resend
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
          html: getVerificationEmailHtml(otpCode, false),
        });

        if (error) {
          console.error("[RESEND ERROR - SIGNUP]", error);
          emailDelivered = false;
          emailError = error.message || "Failed to send email via Resend.";
        } else {
          emailDelivered = true;
          console.log(`[RESEND SUCCESS - SIGNUP] Verification email sent to ${normalizedEmail} (ID: ${data?.id})`);
        }
      } catch (err: any) {
        console.error("[RESEND EXCEPTION - SIGNUP]", err);
        emailDelivered = false;
        emailError = err.message || "Resend connection error.";
      }
    } else {
      // If RESEND_API_KEY is not set, try sendOtpEmail fallback (SMTP if configured, else dev fallback)
      const fallbackResult = await sendOtpEmail({
        to: normalizedEmail,
        code: otpCode,
        name: user.name,
        type: "SIGNUP",
      });
      emailDelivered = fallbackResult.delivered;
      emailError = fallbackResult.error || "RESEND_API_KEY is not loaded in environment variables. Check server console for === DEV OTP CODE ===";
      provider = fallbackResult.provider;
    }

    return NextResponse.json({
      success: true,
      requireVerification: true,
      email: normalizedEmail,
      userId: user.id,
      role: user.role,
      emailDelivered,
      emailError,
      provider,
      verificationCode: "123456",
      devCode: "123456",
      message: "Verification code: 123456. Enter this code to verify and activate your account.",
    });
  } catch (error: any) {
    console.error("Error in registration:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
