import nodemailer from "nodemailer";

/**
 * Todaynews.ng Email Notification System
 * Supports Zeptomail (via SMTP), or falls back to generic SMTP config.
 */

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

function getTransporter() {
  // Zeptomail SMTP config
  if (process.env.ZEPTOMAIL_TOKEN) {
    return nodemailer.createTransport({
      host: "smtp.zeptomail.com",
      port: 587,
      secure: false,
      auth: {
        user: "emailapikey",
        pass: process.env.ZEPTOMAIL_TOKEN,
      },
    });
  }

  // Fallback to generic SMTP
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return null;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const transporter = getTransporter();

  if (!transporter) {
    console.log("[Mailer] No email config found. Skipping email:", payload.subject);
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Todaynews.ng AI" <noreply@todaynews.ng>',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    console.log("[Mailer] Email sent:", payload.subject);
    return true;
  } catch (err) {
    console.error("[Mailer] Failed to send email:", err);
    return false;
  }
}

/**
 * Send a "New Story Scraped" alert email with approve/review buttons.
 */
export async function sendNewStoryAlert(story: {
  id: string;
  title: string;
  sourceName: string;
  category: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@todaynews.ng";
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const approveToken = Buffer.from(`${story.id}:${Date.now()}`).toString("base64url");

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1c; color: #e2e8f0; padding: 32px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #00e676; font-size: 20px; margin: 0;">🔥 Todaynews.ng AI Alert</h1>
        <p style="color: #94a3b8; font-size: 13px;">New story scraped and paraphrased</p>
      </div>

      <div style="background: #1e293b; padding: 20px; border-radius: 8px; border-left: 4px solid #00e676; margin-bottom: 24px;">
        <h2 style="color: #f8fafc; font-size: 16px; margin: 0 0 8px 0;">${story.title}</h2>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">
          Source: <strong>${story.sourceName}</strong> · Category: <strong>${story.category}</strong>
        </p>
      </div>

      <div style="text-align: center;">
        <a href="${baseUrl}/api/articles/${story.id}/approve?token=${approveToken}"
           style="display: inline-block; background: #00e676; color: #0a0f1c; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-right: 12px;">
          ✅ APPROVE & PUBLISH
        </a>
        <a href="${baseUrl}/ng-admin/inbox?highlight=${story.id}"
           style="display: inline-block; background: #334155; color: #f8fafc; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
          📝 REVIEW STORY
        </a>
      </div>

      <p style="color: #64748b; font-size: 11px; text-align: center; margin-top: 24px;">
        This is an automated alert from Todaynews.ng AI Scraper
      </p>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `🔥 New Story: ${story.title.substring(0, 60)}`,
    html,
  });
}
