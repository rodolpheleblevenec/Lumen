import { createClient } from "@/lib/supabase/server";
import { mondayOfWeek, parisToday } from "@/lib/dates";

export default async function ClassementPage() {
  const supabase = await createClient();
  const monday = mondayOfWeek(parisToday());

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
  const streakByUser = new Map(
    (streaks ?? []).map((s) => [s.user_id, s])
  );

  const ranking = (profiles ?? [])
    .map((p) => ({
      ...p,
      points: totals.get(p.id) ?? 0,
      streak: streakByUser.get(p.id)?.current ?? 0,
    }))
    .sort((a, b) => b.points - a.points);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Classement</h1>
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Semaine en cours — remise à zéro chaque lundi.
      </p>

      <ol className="space-y-2">
        {ranking.map((p, i) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm dark:bg-stone-900"
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
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950">
                {p.display_name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="flex-1 truncate font-medium">
              {p.display_name}
            </span>
            <span className="text-sm text-stone-500 dark:text-stone-400">
              🔥 {p.streak}
            </span>
            <span className="w-16 text-right font-bold tabular-nums">
              {p.points} pts
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
