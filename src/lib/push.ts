import webpush from "web-push";
import { prisma, isDbConfigured } from "./db";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails("mailto:editor@todaynews.ng", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

/**
 * Send a real OS-level push notification to every subscribed browser when a
 * new article goes live. Silently no-ops if VAPID isn't configured or the DB
 * isn't reachable — never blocks the publish flow that calls it.
 */
export async function notifyNewPublish(article: {
  id: string;
  title: string;
  slug: string;
  summary?: string;
}): Promise<void> {
  if (!ensureConfigured() || !isDbConfigured()) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany();
    if (subscriptions.length === 0) return;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://todaynews.ng";
    const payload = JSON.stringify({
      title: article.title,
      body: article.summary?.slice(0, 140) || "New story just published on Todaynews.ng",
      url: `${baseUrl}/article/${article.slug}`,
      icon: "/images/logo-publisher.png",
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    // Prune subscriptions that are dead (browser unsubscribed / endpoint expired).
    const deadEndpoints: string[] = [];
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        const statusCode = (r.reason as any)?.statusCode;
        if (statusCode === 404 || statusCode === 410) deadEndpoints.push(subscriptions[i].endpoint);
      }
    });
    if (deadEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: deadEndpoints } } });
    }
  } catch (err) {
    console.error("[Push] notifyNewPublish failed (non-fatal):", err);
  }
}
