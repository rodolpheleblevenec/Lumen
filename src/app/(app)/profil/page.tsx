import { createClient } from "@/lib/supabase/server";
import { BADGES } from "@/lib/types";
import { NotificationsToggle } from "@/components/notifications-toggle";

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string;

  const [{ data: profile }, { data: streak }, { count: acquired }, { data: badges }] =
    await Promise.all([
      supabase
        .from("lumen_profiles")
        .select("display_name, avatar_url")
        .eq("id", userId)
        .single(),
      supabase
        .from("lumen_streaks")
        .select("current, best")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("lumen_srs_cards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("level", 5),
      supabase
        .from("lumen_badges")
        .select("badge_key, earned_at")
        .eq("user_id", userId)
        .order("earned_at", { ascending: true }),
    ]);

  return (
    <div className="animate-fade-up space-y-6">
      <h1 className="font-display text-2xl font-semibold">Profil</h1>

      <div className="flex items-center gap-4 rounded-2xl border border-line bg-card p-4">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-14 w-14 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-xl font-semibold text-accent-strong">
            {profile?.display_name?.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <p className="text-lg font-semibold">{profile?.display_name}</p>
          <p className="text-sm text-ink-soft">
            {String(data?.claims?.email ?? "")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="text-2xl font-bold">🔥 {streak?.current ?? 0}</p>
          <p className="text-xs text-ink-soft">
            Streak actuel
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="text-2xl font-bold">🏅 {streak?.best ?? 0}</p>
          <p className="text-xs text-ink-soft">Record</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="text-2xl font-bold">🧠 {acquired ?? 0}</p>
          <p className="text-xs text-ink-soft">
            Notions acquises
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Badges</h2>
        {badges?.length ? (
          <div className="grid grid-cols-2 gap-2">
            {badges.map((b) => {
              const meta = BADGES[b.badge_key];
              return (
                <div
                  key={b.badge_key}
                  className="flex items-center gap-2.5 rounded-2xl border border-line bg-card p-3"
                >
                  <span className="text-2xl">{meta?.icon ?? "🏆"}</span>
                  <span className="text-sm font-medium leading-tight">
                    {meta?.label ?? b.badge_key}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">
            Aucun badge pour l&apos;instant — le premier tombe à 7 jours de
            streak ou au premier sans-faute.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Notifications</h2>
        <NotificationsToggle />
      </section>

      <form action="/auth/signout" method="post" className="pt-2">
        <button
          type="submit"
          className="min-h-12 w-full rounded-full border border-line px-6 py-3 font-medium transition active:scale-95"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
