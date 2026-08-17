/**
 * Web Push notification dispatch — sends a real OS-level notification to
 * every subscribed browser when a new article goes live. Implemented in full
 * in the push-notifications phase (VAPID keys + PushSubscription storage);
 * this stub keeps the publish call sites wired and safe to call today.
 */
export async function notifyNewPublish(article: {
  id: string;
  title: string;
  slug: string;
  summary?: string;
}): Promise<void> {
  console.log(`[Push] (stub) Would notify subscribers of new article: "${article.title}"`);
}
