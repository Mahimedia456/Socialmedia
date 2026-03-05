import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export function buildOtpEmailHtml({ email, code }) {
  const year = new Date().getFullYear();
  return `<!doctype html><html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Password reset code</title></head>
<body style="margin:0;padding:0;background:#071a17;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#071a17;padding:28px 14px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
style="width:600px;max-width:600px;background:#071f1b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
<tr><td style="padding:22px 24px;background:linear-gradient(135deg,#0e3b35,#071a17);border-bottom:1px solid rgba(255,255,255,0.08);">
<div style="color:#67e8d2;font-weight:700;letter-spacing:1px;font-size:12px;text-transform:uppercase;">Mahimedia Solutions</div>
<div style="color:#ffffff;font-size:20px;font-weight:800;margin-top:6px;">Password Reset Code</div>
</td></tr>
<tr><td style="padding:22px 24px;color:#d7fff6;">
<div style="font-size:14px;line-height:1.6;color:#baf7ea;">We received a request to reset your password for:
<span style="color:#ffffff;font-weight:700;">${email}</span></div>
<div style="margin-top:18px;padding:18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
<div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#67e8d2;font-weight:700;">Your 6-digit code</div>
<div style="margin-top:12px;text-align:center;">
<span style="display:inline-block;background:#14b8a6;color:#04110f;font-size:34px;font-weight:900;letter-spacing:10px;padding:10px 16px;border-radius:12px;">${code}</span>
</div>
<div style="margin-top:10px;font-size:12px;color:#99f6e4;text-align:center;">This code expires in 10 minutes.</div>
</div>
<div style="margin-top:18px;font-size:13px;line-height:1.6;color:#baf7ea;">If you did not request this, you can ignore this email.</div>
<div style="margin-top:18px;font-size:12px;color:#5eead4;">For help, contact support.</div>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid rgba(255,255,255,0.08);color:#2dd4bf;font-size:11px;text-align:center;">© ${year} Mahimedia Solutions. All rights reserved.</td></tr>
</table>
<div style="margin-top:10px;color:#14b8a6;font-size:11px;">This is an automated message; please do not reply.</div>
</td></tr></table></body></html>`;
}

function getMailer() {
  if (env.EMAIL_MODE !== "smtp" && env.EMAIL_MODE !== "both") return null;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

export async function sendOtpEmail({ to, code }) {
  const html = buildOtpEmailHtml({ email: to, code });
  const mailer = getMailer();

  if (env.EMAIL_MODE === "dev" || env.EMAIL_MODE === "both") {
    console.log("RESET OTP (DEV LOG):", { email: to, code });
  }

  if (env.EMAIL_MODE === "smtp" || env.EMAIL_MODE === "both") {
    if (!mailer) {
      console.log("SMTP config missing. Email not sent.");
      return { mode: "log-only" };
    }
    await mailer.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: "Your password reset code (Mahimedia Solutions)",
      html,
    });
    console.log("RESET OTP EMAIL SENT:", to);
    return { mode: "email-sent" };
  }

  return { mode: "log-only" };
}