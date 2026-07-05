import { Pickaxe, TrendingDown, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { parisStartOfDayISO, parisToday } from "@/lib/dates";

function monthStartOf(date: string): string {
  return date.slice(0, 8) + "01";
}
function addMonths(monthFirst: string, n: number): string {
  const d = new Date(monthFirst + "T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 8) + "01";
}
function monthLabel(monthFirst: string): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
    new Date(monthFirst + "T12:00:00Z")
  );
}

/** Récap du mois précédent : tes stats + le mois du cercle. */
export default async function RecapPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const me = claims?.claims?.sub as string;

  const today = parisToday();
  const month = addMonths(monthStartOf(today), -1); // mois précédent
  const monthNext = addMonths(month, 1);
  const monthPrev = addMonths(month, -1);
  const fromISO = parisStartOfDayISO(month);
  const toISO = parisStartOfDayISO(monthNext);
  const prevFromISO = parisStartOfDayISO(monthPrev);

  const [
    { data: ledger },
    { data: myPrevLedger },
    { data: lessons },
    { data: acquired },
    { data: dives },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from("lumen_points_ledger")
      .select("user_id, points")
      .gte("occurred_at", fromISO)
      .lt("occurred_at", toISO),
    supabase
      .from("lumen_points_ledger")
      .select("points")
      .eq("user_id", me)
      .gte("occurred_at", prevFromISO)
      .lt("occurred_at", fromISO),
    supabase
      .from("lumen_lessons")
      .select("id, title, domain")
      .gte("date", month)
      .lt("date", monthNext),
    supabase
      .from("lumen_srs_cards")
      .select("notion_id")
      .eq("user_id", me)
      .eq("level", 5)
      .gte("last_reviewed_at", fromISO)
      .lt("last_reviewed_at", toISO),
    supabase
      .from("lumen_deep_dives")
      .select("created_by")
      .gte("created_at", fromISO)
      .lt("created_at", toISO),
    supabase.from("lumen_profiles").select("id, display_name"),
  ]);

  const lessonIds = (lessons ?? []).map((l) => l.id);
  const { data: progress } = lessonIds.length
    ? await supabase
        .from("lumen_lesson_progress")
        .select("user_id, lesson_id, score, quiz_completed_at")
        .in("lesson_id", lessonIds)
        .not("quiz_completed_at", "is", null)
    : { data: [] };

  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  const lessonById = new Map((lessons ?? []).map((l) => [l.id, l]));

  /* ── Tes stats ── */
  const myPoints = (ledger ?? [])
    .filter((r) => r.user_id === me)
    .reduce((a, r) => a + r.points, 0);
  const myPrevPoints = (myPrevLedger ?? []).reduce((a, r) => a + r.points, 0);
  const delta = myPoints - myPrevPoints;

  const byDomain = new Map<string, { sum: number; n: number }>();
  for (const p of progress ?? []) {
    if (p.user_id !== me) continue;
    const domain = lessonById.get(p.lesson_id)?.domain;
    if (!domain) continue;
    const agg = byDomain.get(domain) ?? { sum: 0, n: 0 };
    agg.sum += p.score ?? 0;
    agg.n++;
    byDomain.set(domain, agg);
  }
  const domainAvgs = [...byDomain.entries()]
    .map(([domain, { sum, n }]) => ({ domain, avg: sum / n }))
    .sort((a, b) => b.avg - a.avg);
  const bestDomain = domainAvgs[0];
  const worstDomain = domainAvgs.length > 1 ? domainAvgs[domainAvgs.length - 1] : null;

  /* ── Le mois du cercle ── */
  const circleTotals = new Map<string, number>();
  for (const r of ledger ?? []) {
    circleTotals.set(r.user_id, (circleTotals.get(r.user_id) ?? 0) + r.points);
  }
  const podium = [...circleTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const byLesson = new Map<string, { sum: number; n: number }>();
  for (const p of progress ?? []) {
    const agg = byLesson.get(p.lesson_id) ?? { sum: 0, n: 0 };
    agg.sum += p.score ?? 0;
    agg.n++;
    byLesson.set(p.lesson_id, agg);
  }
  const lessonAvgs = [...byLesson.entries()]
    .map(([id, { sum, n }]) => ({ lesson: lessonById.get(id), avg: sum / n }))
    .filter((l) => l.lesson)
    .sort((a, b) => b.avg - a.avg);
  const bestLesson = lessonAvgs[0];
  const worstLesson = lessonAvgs.length > 1 ? lessonAvgs[lessonAvgs.length - 1] : null;

  const diggers = new Map<string, number>();
  for (const d of dives ?? []) {
    if (d.created_by) diggers.set(d.created_by, (diggers.get(d.created_by) ?? 0) + 1);
  }
  const topDigger = [...diggers.entries()].sort((a, b) => b[1] - a[1])[0];

  const RANK_BG = ["var(--primary)", "var(--accent)", "var(--teal)"];

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          Récap
        </p>
        <h1 className="font-display text-[30px] capitalize text-primary-deep">
          {monthLabel(month)}
        </h1>
      </div>

      <section className="space-y-3">
        <h2 className="text-[13.5px] font-bold">Ton mois</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="shadow-card rounded-[18px] bg-card px-5 py-4">
            <p className="font-display text-[34px] tabular-nums text-primary">
              {myPoints}
            </p>
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
              Points
              {delta !== 0 && (
                <span
                  className={`flex items-center gap-0.5 ${delta > 0 ? "text-good" : "text-accent"}`}
                >
                  {delta > 0 ? (
                    <TrendingUp size={11} aria-hidden />
                  ) : (
                    <TrendingDown size={11} aria-hidden />
                  )}
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              )}
            </p>
          </div>
          <div className="shadow-card rounded-[18px] bg-card px-5 py-4">
            <p className="font-display text-[34px] tabular-nums text-primary-deep">
              {acquired?.length ?? 0}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
              Notions acquises
            </p>
          </div>
        </div>
        {bestDomain && (
          <div className="shadow-card space-y-1.5 rounded-[18px] bg-card p-4 text-sm">
            <p>
              Ton domaine fort :{" "}
              <strong className="font-semibold text-primary">
                {bestDomain.domain}
              </strong>{" "}
              ({Math.round(bestDomain.avg)} pts de moyenne).
            </p>
            {worstDomain && (
              <p className="text-ink-soft">
                À retravailler : {worstDomain.domain} (
                {Math.round(worstDomain.avg)} pts).
              </p>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[13.5px] font-bold">Le mois du cercle</h2>
        {podium.length > 0 && (
          <div className="shadow-card space-y-2 rounded-[18px] bg-card p-4">
            {podium.map(([id, pts], i) => (
              <p key={id} className="flex items-center gap-2.5 text-sm">
                <span
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: RANK_BG[i] }}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {nameOf.get(id)}
                  {id === me && (
                    <span className="text-xs font-normal text-ink-soft"> (toi)</span>
                  )}
                </span>
                <span className="font-display tabular-nums text-primary-deep">
                  {pts}{" "}
                  <span className="font-sans text-[9px] font-bold uppercase text-ink-faint">
                    pts
                  </span>
                </span>
              </p>
            ))}
          </div>
        )}
        {bestLesson && (
          <div className="space-y-1.5 rounded-[18px] bg-card-tint p-4 text-sm">
            <p>
              La leçon la mieux réussie :{" "}
              <strong className="font-semibold">{bestLesson.lesson!.title}</strong>
            </p>
            {worstLesson && (
              <p className="text-ink-soft">
                Celle qui a fait souffrir : {worstLesson.lesson!.title}
              </p>
            )}
          </div>
        )}
        {topDigger && (
          <p className="flex items-center gap-2 text-sm text-ink-soft">
            <Pickaxe size={14} className="text-primary" aria-hidden />
            {nameOf.get(topDigger[0])}
            {topDigger[0] === me ? " (toi)" : ""} a le plus creusé :{" "}
            {topDigger[1]} approfondissement{topDigger[1] > 1 ? "s" : ""}.
          </p>
        )}
        {podium.length === 0 && !bestLesson && (
          <p className="text-sm text-ink-soft">
            Pas encore d&apos;activité sur ce mois-là.
          </p>
        )}
      </section>

      <p className="text-[11px] text-ink-faint">
        Publié le 1er de chaque mois, sur le mois écoulé.
      </p>
    </div>
  );
}
