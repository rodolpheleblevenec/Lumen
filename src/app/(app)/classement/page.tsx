import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { addDays, mondayOfWeek, parisStartOfDayISO, parisToday } from "@/lib/dates";
import { DOMAIN_HUES } from "@/components/domain-icon";

const RANK_BG = ["var(--primary)", "var(--accent)", "var(--teal)"];

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
        .gte("occurred_at", parisStartOfDayISO(monday)),
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
        <h1 className="font-display text-[30px] text-primary-deep">
          Classement
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          Remise à zéro lundi —{" "}
          {daysLeft === 1 ? "dernier jour !" : `${daysLeft} jours restants`}.
        </p>
      </div>

      <ol className="space-y-2.5">
        {ranking.map((p, i) => {
          const isMe = p.id === me;
          const hue = DOMAIN_HUES[i % DOMAIN_HUES.length];
          return (
            <li
              key={p.id}
              className={`flex items-center gap-3 rounded-[18px] p-3 ${
                isMe
                  ? "border-2 border-primary bg-card-tint"
                  : "shadow-card bg-card"
              }`}
            >
              <span
                className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                style={
                  i < 3
                    ? { background: RANK_BG[i], color: "#fff" }
                    : { color: "var(--ink-faint)" }
                }
              >
                {i + 1}
              </span>
              {p.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatar_url}
                  alt=""
                  className="h-[38px] w-[38px] rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-full font-semibold"
                  style={{ background: hue.soft, color: hue.color }}
                >
                  {p.display_name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[15px] ${
                    isMe ? "font-bold" : "font-semibold"
                  }`}
                >
                  {p.display_name}
                  {isMe && (
                    <span className="ml-1.5 text-[11px] font-normal text-ink-soft">
                      (toi)
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1 text-xs text-ink-faint">
                  <Flame size={13} aria-hidden /> {p.streak}
                </span>
              </span>
              <span className="text-right">
                <span className="font-display text-[19px] tabular-nums text-primary-deep">
                  {p.points}
                </span>{" "}
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                  pts
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
