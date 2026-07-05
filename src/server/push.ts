import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Push « au fil de l'eau » (duels…) vers un ou plusieurs membres.
 * Best-effort : ne lève jamais, nettoie les abonnements morts.
 */
export async function sendPushTo(
  userIds: string[],
  title: string,
  body: string,
  url = "/"
) {
  try {
    if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
      return;
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const admin = createAdminClient();
    const { data: subs } = await admin
      .from("lumen_push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", userIds);

    const payload = JSON.stringify({ title, body, url });
    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await admin.from("lumen_push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }
  } catch (e) {
    console.error("[push]", e);
  }
}
