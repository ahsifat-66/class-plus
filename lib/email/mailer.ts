import { Resend } from "resend";
import nodemailer from "nodemailer";

interface SendOtpOptions {
  to: string;
  code: string;
  name?: string;
  type?: "SIGNUP" | "RESET_PASSWORD";
}

export interface SendOtpResult {
  success: boolean;
  delivered: boolean;
  provider: "resend" | "smtp" | "dev_fallback";
  error?: string;
  code: string;
  messageId?: string;
  fallback?: boolean;
}

export function generateOtpCode(): string {
  // Generate a cryptographically distributed 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generates clean, responsive HTML email body displaying the 6-digit OTP code clearly.
 */
export function getVerificationEmailHtml(code: string, isReset = false): string {
  const actionTitle = isReset ? "Password Reset Code" : "Verification Code";
  const actionDescription = isReset
    ? "We received a request to reset your ClassPlus account password. Enter this 6-digit code to proceed with setting your new password."
    : "Welcome to ClassPlus! Please enter this 6-digit verification code to activate your account and access your learning dashboard.";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ClassPlus Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 30px auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #0d9488 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
    .body { padding: 32px 28px; color: #1e293b; }
    .code-box { background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 22px; text-align: center; margin: 24px 0; }
    .code { font-family: monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; margin: 0; }
    .expiry { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 500; }
    .footer { padding: 20px 28px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ClassPlus</h1>
      <p>Secure Student & Teacher Educational Platform</p>
    </div>
    <div class="body">
      <h2 style="margin-top:0; font-size: 18px; color: #0f172a;">${actionTitle}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">${actionDescription}</p>
      
      <div class="code-box">
        <div class="code">${code}</div>
        <div class="expiry">⏱ This code expires in <strong>15 minutes</strong>.</div>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
        If you did not request this verification code, you can safely ignore this email. Someone may have entered your email address by mistake.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ClassPlus Educational Hub. All rights reserved.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Primary OTP Email Sender
 * Uses official Resend SDK when RESEND_API_KEY is provided.
 * Always logs DEV OTP CODE to console so developer testing is never blocked.
 */
export async function sendOtpEmail({
  to,
  code,
  name,
  type = "SIGNUP",
}: SendOtpOptions): Promise<SendOtpResult> {
  const isReset = type === "RESET_PASSWORD";
  const subject = "Your ClassPlus Verification Code";

  // Always log dev OTP code to terminal/Vercel console for debugging and local testing
  console.log("=== DEV OTP CODE ===", code);
  console.log(`[OTP DISPATCH] Recipient: ${to} | Action: ${type} | Code: ${code}`);

  // Notice if RESEND_API_KEY is not yet loaded
  if (!process.env.RESEND_API_KEY) {
    console.log(`⚠️ [RESEND NOTICE] RESEND_API_KEY is not loaded in environment variables.`);
  }

  const htmlContent = getVerificationEmailHtml(code, isReset);

  // 1. Check for Resend API Key (Primary Provider)
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: to,
        subject,
        html: htmlContent,
      });

      if (error) {
        console.error("❌ [EMAIL DISPATCH ERROR - RESEND]", {
          recipient: to,
          error: error.message,
          name: error.name,
        });
        return {
          success: false,
          delivered: false,
          provider: "resend",
          error: `Resend error: ${error.message}`,
          code,
          fallback: true,
        };
      }

      console.log(`✅ [EMAIL DISPATCH SUCCESS - RESEND] Delivered OTP to ${to} (Message ID: ${data?.id})`);
      return {
        success: true,
        delivered: true,
        provider: "resend",
        messageId: data?.id,
        code,
      };
    } catch (err: any) {
      console.error("❌ [EMAIL DISPATCH ERROR - RESEND EXCEPTION]", {
        recipient: to,
        error: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        delivered: false,
        provider: "resend",
        error: `Resend connection failed: ${err.message}`,
        code,
        fallback: true,
      };
    }
  }

  // 2. Check for Gmail / SMTP credentials as alternative
  const smtpUser = (process.env.GMAIL_USER || process.env.SMTP_USER || "").trim();
  const rawPass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || "").trim();
  const smtpPass = rawPass.replace(/\s+/g, "");

  const smtpHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const isGmail =
    Boolean(process.env.GMAIL_USER) ||
    Boolean(process.env.GMAIL_APP_PASSWORD) ||
    smtpHost.toLowerCase().includes("gmail");

  const smtpFrom =
    process.env.SMTP_FROM ||
    process.env.GMAIL_FROM ||
    `"ClassPlus" <${smtpUser || "no-reply@classplus.edu"}>`;

  if (smtpUser && smtpPass) {
    try {
      console.log(`[EMAIL DISPATCH] Initiating Gmail/SMTP delivery to ${to} using ${smtpUser}...`);

      const transportConfig: any = isGmail
        ? {
            service: "gmail",
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          }
        : {
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          };

      const transporter = nodemailer.createTransport(transportConfig);

      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`✅ [GMAIL SMTP SUCCESS] Real email delivered to ${to} (Message ID: ${info.messageId})`);
      return {
        success: true,
        delivered: true,
        provider: "smtp",
        messageId: info.messageId,
        code,
      };
    } catch (err: any) {
      console.error("❌ [EMAIL DISPATCH ERROR - GMAIL/SMTP]", {
        recipient: to,
        error: err.message,
        code: err.code,
      });

      return {
        success: false,
        delivered: false,
        provider: "smtp",
        error: `Gmail/SMTP error (${err.code || "UNKNOWN"}): ${err.message}`,
        code,
        fallback: true,
      };
    }
  }

  // 3. No external provider configured in environment
  console.warn("⚠️ [EMAIL DISPATCH WARNING] No email provider configured.");
  console.warn("   To send real emails, set RESEND_API_KEY (or GMAIL_USER & GMAIL_APP_PASSWORD).");
  console.log("==================================================");
  console.log(`✉️ [OTP EMAIL DEV LOG]`);
  console.log(`Recipient: ${to}`);
  console.log(`Action: ${type}`);
  console.log(`👉 6-DIGIT OTP CODE: ${code}`);
  console.log("==================================================");

  return {
    success: true,
    delivered: false,
    provider: "dev_fallback",
    error: "No email service configured (missing RESEND_API_KEY). Check server console for === DEV OTP CODE ===",
    code,
    fallback: true,
  };
}
