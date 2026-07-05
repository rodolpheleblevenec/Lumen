import Link from "next/link";
import { Flame, Swords } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { addDays, mondayOfWeek, parisStartOfDayISO, parisToday } from "@/lib/dates";
import { DOMAIN_HUES } from "@/components/domain-icon";
import type { DuelResultSide } from "@/server/duels";

const RANK_BG = ["var(--primary)", "var(--accent)", "var(--teal)"];

export default async function ClassementPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const me = claims?.claims?.sub as string;
  const today = parisToday();
  const monday = mondayOfWeek(today);

  const [{ data: profiles }, { data: points }, { data: streaks }, { count: lessonsDone }] =
    await Promise.all([
      supabase.from("lumen_profiles").select("id, display_name, avatar_url"),
      supabase
        .from("lumen_points_ledger")
        .select("user_id, points")
        .gte("occurred_at", parisStartOfDayISO(monday)),
      supabase.from("lumen_streaks").select("user_id, current, best"),
      supabase
        .from("lumen_lesson_progress")
        .select("*", { count: "exact", head: true })
        .not("quiz_completed_at", "is", null),
    ]);

  // Mes duels (RLS : je ne vois que ceux qui me concernent)
  const { data: duels } = await supabase
    .from("lumen_duels")
    .select("*")
    .order("created_at", { ascending: false });

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

  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  const now = new Date().toISOString();
  const toPlay = (duels ?? []).filter((d) => {
    const myRes = d.challenger === me ? d.challenger_result : d.opponent_result;
    return d.status === "pending" && !myRes && d.expires_at > now;
  });
  const waiting = (duels ?? []).filter((d) => {
    const myRes = d.challenger === me ? d.challenger_result : d.opponent_result;
    return d.status === "pending" && Boolean(myRes) && d.expires_at > now;
  });
  const finished = (duels ?? [])
    .filter((d) => d.status !== "pending" || d.expires_at <= now)
    .slice(0, 5);

  // Face-à-face : bilan victoires par adversaire
  const headToHead = new Map<string, { wins: number; losses: number }>();
  for (const d of duels ?? []) {
    if (!d.winner) continue;
    const other = d.challenger === me ? d.opponent : d.challenger;
    const rec = headToHead.get(other) ?? { wins: 0, losses: 0 };
    if (d.winner === me) rec.wins++;
    else rec.losses++;
    headToHead.set(other, rec);
  }

  const duelScore = (d: (NonNullable<typeof duels>)[number]) => {
    const myRes = (d.challenger === me ? d.challenger_result : d.opponent_result) as DuelResultSide | null;
    const theirRes = (d.challenger === me ? d.opponent_result : d.challenger_result) as DuelResultSide | null;
    return `${myRes?.score ?? "–"}-${theirRes?.score ?? "–"}`;
  };

  const weekPoints = [...totals.values()].reduce((a, b) => a + b, 0);
  const bestStreak = Math.max(0, ...(streaks ?? []).map((s) => s.best ?? 0));
  const circleStats = [
    { value: lessonsDone ?? 0, label: "Leçons validées" },
    { value: weekPoints, label: "Points cette semaine" },
    { value: bestStreak, label: "Record de streak" },
  ];

  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h1 className="font-display text-[30px] text-primary-deep">
          Classement
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          Remise à zéro lundi ·{" "}
          {daysLeft === 1 ? "dernier jour !" : `${daysLeft} jours restants`}.
        </p>
      </div>

      <section className="rounded-[22px] bg-card-tint px-[22px] py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
          Le cercle
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          {circleStats.map(({ value, label }) => (
            <div key={label}>
              <p className="font-display text-[26px] tabular-nums text-primary-deep">
                {value}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-ink-soft">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

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
              {!isMe && (
                <Link
                  href={`/duel/nouveau?vs=${p.id}`}
                  aria-label={`Défier ${p.display_name}`}
                  title={`Défier ${p.display_name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent transition active:scale-90"
                >
                  <Swords size={15} aria-hidden />
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {(toPlay.length > 0 || waiting.length > 0 || finished.length > 0) && (
        <section className="space-y-2.5 pt-2">
          <h2 className="flex items-center gap-2 text-[13.5px] font-bold">
            <Swords size={15} className="text-accent" aria-hidden /> Duels
          </h2>

          {toPlay.map((d) => (
            <Link
              key={d.id}
              href={`/duel/${d.id}`}
              className="hover-lift flex items-center justify-between gap-3 rounded-[18px] border-2 border-accent bg-card p-3.5"
            >
              <span className="text-sm font-semibold">
                {nameOf.get(d.challenger === me ? d.opponent : d.challenger)} te
                défie !
              </span>
              <span className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                Jouer
              </span>
            </Link>
          ))}

          {waiting.map((d) => (
            <Link
              key={d.id}
              href={`/duel/${d.id}`}
              className="hover-lift shadow-card flex items-center justify-between gap-3 rounded-[18px] bg-card p-3.5"
            >
              <span className="text-sm text-ink-soft">
                En attente de{" "}
                {nameOf.get(d.challenger === me ? d.opponent : d.challenger)}…
              </span>
            </Link>
          ))}

          {finished.map((d) => {
            const other = d.challenger === me ? d.opponent : d.challenger;
            const won = d.winner === me;
            const drawn = d.status === "completed" && !d.winner;
            return (
              <Link
                key={d.id}
                href={`/duel/${d.id}`}
                className="hover-lift shadow-card flex items-center justify-between gap-3 rounded-[18px] bg-card p-3.5"
              >
                <span className="min-w-0 text-sm">
                  <span
                    className={`font-bold ${
                      drawn ? "text-ink-soft" : won ? "text-good" : "text-accent"
                    }`}
                  >
                    {drawn ? "Égalité" : won ? "Victoire" : "Défaite"}
                  </span>{" "}
                  <span className="text-ink-soft">
                    contre {nameOf.get(other)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-primary-deep">
                  {duelScore(d)}
                </span>
              </Link>
            );
          })}

          {headToHead.size > 0 && (
            <p className="text-[11px] text-ink-faint">
              Face-à-face :{" "}
              {[...headToHead.entries()]
                .map(
                  ([id, r]) => `${r.wins}-${r.losses} contre ${nameOf.get(id)}`
                )
                .join(" · ")}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
