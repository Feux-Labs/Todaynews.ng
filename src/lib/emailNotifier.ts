interface EmailNotification {
  to: string;
  subject: string;
  title: string;
  summary: string;
  category: string;
  sourceName?: string;
  slug?: string;
}

export async function sendNewStoryEmail(notification: EmailNotification): Promise<boolean> {
  const recipient = notification.to || "Admin@feuxlabs.ng";

  console.log(`\n======================================================`);
  console.log(`📧 EMAIL ALERT TRIGGERED FOR: ${recipient}`);
  console.log(`📰 Subject: ${notification.subject}`);
  console.log(`📌 Category: ${notification.category}`);
  console.log(`Headline: ${notification.title}`);
  console.log(`Summary: ${notification.summary}`);
  console.log(`======================================================\n`);

  try {
    // If SMTP environment variables are set, attempt SMTP send
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Todaynews AI Desk" <${process.env.SMTP_USER}>`,
        to: recipient,
        subject: `[Todaynews Breaking Alert] ${notification.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #060b18; padding: 20px; border-radius: 8px;">
            <div style="background-color: #060b18; color: #ffffff; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
              <h2 style="margin: 0;">Todaynews<span style="color: #00e676;">.ng</span> Alert</h2>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #00e676;">New Auto-Scraped Story Pending Editorial Approval</p>
            </div>
            <div style="padding: 20px 0;">
              <span style="background-color: #00e676; color: #060b18; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 3px; text-transform: uppercase;">
                ${notification.category}
              </span>
              <h3 style="color: #060b18; margin-top: 10px;">${notification.title}</h3>
              <p style="color: #4a5568; line-height: 1.6;">${notification.summary}</p>
              <p style="font-size: 12px; color: #718096;">Source: ${notification.sourceName || "Automated Scraper"}</p>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
              <a href="https://todaynews.ng/ng-admin/inbox" style="background-color: #060b18; color: #00e676; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold; font-size: 14px; display: inline-block;">
                Review in Admin Inbox →
              </a>
            </div>
          </div>
        `,
      });
      console.log(`✅ Email sent successfully to ${recipient}`);
      return true;
    }
  } catch (err) {
    console.error("Failed to send SMTP email notification:", err);
  }

  return true;
}
