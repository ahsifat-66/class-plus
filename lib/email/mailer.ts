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

export async function sendOtpEmail({
  to,
  code,
  name,
  type = "SIGNUP",
}: SendOtpOptions): Promise<SendOtpResult> {
  const isReset = type === "RESET_PASSWORD";
  const greeting = name ? `Hello ${name},` : "Hello,";
  const actionTitle = isReset ? "Password Reset Code" : "Verify Your Email Address";
  const actionDescription = isReset
    ? "We received a request to reset your ClassPulse account password. Enter this 6-digit code to proceed with setting your new password."
    : "Welcome to ClassPulse! Please verify your email address to activate your account and access your learning dashboard.";

  const subject = isReset
    ? `ClassPulse Password Reset Code: ${code}`
    : `Your ClassPulse Verification Code: ${code}`;

  // Always log dev OTP code to terminal/Vercel console for debugging and local testing
  console.log("=== DEV OTP CODE ===", code);
  console.log(`[OTP DISPATCH] Recipient: ${to} | Action: ${type} | Code: ${code}`);

  // HTML Email Template
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 540px; margin: 30px auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #0d9488 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
    .body { padding: 32px 28px; color: #1e293b; }
    .code-box { background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
    .code { font-family: monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; margin: 0; }
    .expiry { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 500; }
    .footer { padding: 20px 28px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ClassPulse</h1>
      <p>Secure Student & Teacher Educational Platform</p>
    </div>
    <div class="body">
      <h2 style="margin-top:0; font-size: 18px; color: #0f172a;">${actionTitle}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">${greeting}</p>
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
      &copy; ${new Date().getFullYear()} ClassPulse Educational Hub. All rights reserved.
    </div>
  </div>
</body>
</html>
  `.trim();

  // 1. Check for Resend API Key (Recommended for Vercel / Serverless environments)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && resendApiKey.trim().length > 0) {
    const resendFrom =
      process.env.RESEND_FROM ||
      process.env.EMAIL_FROM ||
      "ClassPulse <onboarding@resend.dev>";

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [to],
          subject,
          html: htmlContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorDetail = data?.message || data?.error?.message || JSON.stringify(data);
        console.error("❌ [EMAIL DISPATCH ERROR - RESEND]", {
          recipient: to,
          statusCode: res.status,
          error: errorDetail,
          sender: resendFrom,
        });
        return {
          success: false,
          delivered: false,
          provider: "resend",
          error: `Resend error (${res.status}): ${errorDetail}`,
          code,
          fallback: true,
        };
      }

      console.log(`[EMAIL DISPATCH SUCCESS - RESEND] Delivered OTP to ${to} (Message ID: ${data.id})`);
      return {
        success: true,
        delivered: true,
        provider: "resend",
        messageId: data.id,
        code,
      };
    } catch (err: any) {
      console.error("❌ [EMAIL DISPATCH ERROR - RESEND]", {
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

  // 2. Check for SMTP / Nodemailer credentials (Gmail App Password or custom SMTP)
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const smtpFrom = process.env.SMTP_FROM || `"ClassPulse" <${smtpUser || "no-reply@classpulse.edu"}>`;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
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
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`[EMAIL DISPATCH SUCCESS - SMTP] Delivered OTP to ${to} (Message ID: ${info.messageId})`);
      return {
        success: true,
        delivered: true,
        provider: "smtp",
        messageId: info.messageId,
        code,
      };
    } catch (err: any) {
      console.error("❌ [EMAIL DISPATCH ERROR - SMTP]", {
        recipient: to,
        error: err.message,
        code: err.code,
        response: err.response,
        command: err.command,
        stack: err.stack,
      });
      return {
        success: false,
        delivered: false,
        provider: "smtp",
        error: `SMTP error (${err.code || "UNKNOWN"}): ${err.message}`,
        code,
        fallback: true,
      };
    }
  }

  // 3. No external provider configured in environment
  console.warn("⚠️ [EMAIL DISPATCH WARNING] No email provider configured.");
  console.warn("   To send real emails, set RESEND_API_KEY or SMTP credentials (SMTP_USER & SMTP_PASSWORD / GMAIL_USER & GMAIL_APP_PASSWORD).");
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
    error: "No email service configured (missing RESEND_API_KEY or SMTP_USER/SMTP_PASSWORD). Check server console for === DEV OTP CODE ===",
    code,
    fallback: true,
  };
}
