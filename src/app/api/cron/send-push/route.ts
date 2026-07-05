import { NextResponse, type NextRequest } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { parisHourNow, parisToday } from "@/lib/dates";

// Appelée par Cloud Scheduler toutes les heures : notifie les abonnés
// dont l'heure de rappel choisie (lumen_profiles.push_hour) correspond
// à l'heure courante de Paris.
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return NextResponse.json({ ok: false, error: "VAPID non configuré" }, { status: 500 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const supabase = createAdminClient();

  const { data: lesson } = await supabase
    .from("lumen_lessons")
    .select("title")
    .eq("date", parisToday())
    .eq("status", "published")
    .maybeSingle();

  const payload = JSON.stringify({
    title: "☀️ Ta leçon du jour t'attend",
    body: lesson?.title ?? "5 minutes pour briller ce soir en société.",
    url: "/",
  });

  // ?hour=N pour forcer (tests) ; sinon l'heure courante de Paris
  const hourParam = request.nextUrl.searchParams.get("hour");
  const hour = hourParam !== null ? Number(hourParam) : parisHourNow();

  const { data: profiles } = await supabase
    .from("lumen_profiles")
    .select("id")
    .eq("push_hour", hour);
  const userIds = (profiles ?? []).map((p) => p.id);
  if (!userIds.length) {
    return NextResponse.json({ ok: true, hour, sent: 0, removed: 0, total: 0 });
  }

  const { data: subs } = await supabase
    .from("lumen_push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  let sent = 0;
  let removed = 0;
  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      sent++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        // Abonnement mort : on nettoie
        await supabase
          .from("lumen_push_subscriptions")
          .delete()
          .eq("id", sub.id);
        removed++;
      }
    }
  }

  return NextResponse.json({ ok: true, hour, sent, removed, total: subs?.length ?? 0 });
}
