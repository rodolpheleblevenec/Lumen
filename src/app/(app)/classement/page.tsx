import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { addDays, mondayOfWeek, parisToday } from "@/lib/dates";

export default async function ClassementPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const me = claims?.claims?.sub as string;
  const today = parisToday();
  const monday = mondayOfWeek(today);

  const [{ data: profiles }, { data: points }, { data: streaks }] =
    await Promise.all([
      supabase.from("lumen_profiles").select("id, display_name, avatar_url"),
      supabase
        .from("lumen_points_ledger")
        .select("user_id, points")
        .gte("occurred_at", `${monday}T00:00:00+02:00`),
      supabase.from("lumen_streaks").select("user_id, current, best"),
    ]);

  const totals = new Map<string, number>();
  for (const p of points ?? []) {
    totals.set(p.user_id, (totals.get(p.user_id) ?? 0) + p.points);
  }
  const streakByUser = new Map((streaks ?? []).map((s) => [s.user_id, s]));

  const ranking = (profiles ?? [])
    .map((p) => ({
      ...p,
      points: totals.get(p.id) ?? 0,
      streak: streakByUser.get(p.id)?.current ?? 0,
    }))
    .sort((a, b) => b.points - a.points);

  const medals = ["🥇", "🥈", "🥉"];
  const daysLeft = Math.max(
    1,
    Math.round(
      (new Date(addDays(monday, 7) + "T00:00:00Z").getTime() -
        new Date(today + "T00:00:00Z").getTime()) /
        86_400_000
    )
  );

  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Classement</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Remise à zéro lundi —{" "}
          {daysLeft === 1 ? "dernier jour !" : `${daysLeft} jours restants`}.
        </p>
      </div>

      <ol className="space-y-2">
        {ranking.map((p, i) => {
          const isMe = p.id === me;
          return (
            <li
              key={p.id}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                isMe
                  ? "border-accent/40 bg-accent-soft/50"
                  : "border-line bg-card"
              }`}
            >
              <span className="w-8 text-center text-lg">
                {medals[i] ?? `${i + 1}.`}
              </span>
              {p.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatar_url}
                  alt=""
                  className="h-9 w-9 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-strong">
                  {p.display_name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="flex-1 truncate font-medium">
                {p.display_name}
                {isMe && (
                  <span className="ml-1.5 text-xs font-normal text-ink-soft">
                    (toi)
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1 text-sm text-ink-soft">
                <Flame size={14} aria-hidden /> {p.streak}
              </span>
              <span className="w-16 text-right font-display font-semibold tabular-nums">
                {p.points} pts
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
