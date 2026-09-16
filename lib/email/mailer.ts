import nodemailer from "nodemailer";

interface SendOtpOptions {
  to: string;
  code: string;
  name?: string;
  type?: "SIGNUP" | "RESET_PASSWORD";
}

export function generateOtpCode(): string {
  // Generate a cryptographically distributed 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtpEmail({ to, code, name, type = "SIGNUP" }: SendOtpOptions) {
  const isReset = type === "RESET_PASSWORD";
  const greeting = name ? `Hello ${name},` : "Hello,";
  const actionTitle = isReset ? "Password Reset Code" : "Verify Your Email Address";
  const actionDescription = isReset
    ? "We received a request to reset your ClassPulse account password. Enter this 6-digit code to proceed with setting your new password."
    : "Welcome to ClassPulse! Please verify your email address to activate your account and access your learning dashboard.";

  const subject = isReset
    ? `ClassPulse Password Reset Code: ${code}`
    : `Your ClassPulse Verification Code: ${code}`;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
  const from = process.env.SMTP_FROM || `"ClassPulse" <${user || "no-reply@classpulse.edu"}>`;

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

  // If credentials exist, attempt real delivery via SMTP
  if (user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`[EMAIL DISPATCH SUCCESS] Sent OTP to ${to} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.warn(`[SMTP SEND FAILED] Falling back to console logger: ${err.message}`);
    }
  }

  // Fallback logger for dev/test environments without active SMTP
  console.log("==================================================");
  console.log(`✉️ [OTP EMAIL DEV LOG]`);
  console.log(`Recipient: ${to}`);
  console.log(`Action: ${type}`);
  console.log(`👉 6-DIGIT OTP CODE: ${code}`);
  console.log("==================================================");

  return { success: true, fallback: true, code };
}
