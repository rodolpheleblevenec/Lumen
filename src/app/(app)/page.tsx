import { createClient } from "@/lib/supabase/server";
import { addDays, formatDateFr, mondayOfWeek, parisToday, weekdayOf } from "@/lib/dates";
import { LessonFlow } from "@/components/lesson-flow";
import { WeekStrip } from "@/components/week-strip";
import { Onboarding } from "@/components/onboarding";
import { ThemeVote } from "@/components/theme-vote";
import Link from "next/link";
import { ChevronRight, MoonStar, Sparkles } from "lucide-react";

/** Carte vers le récap du mois écoulé, du 1er au 3 du mois. */
function recapCard(today: string) {
  if (Number(today.slice(8, 10)) > 3) return null;
  const prevMonth = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(
    new Date(new Date(today + "T12:00:00Z").setUTCDate(0))
  );
  return (
    <Link
      href="/recap"
      className="hover-lift shadow-card flex items-center gap-3 rounded-[18px] bg-card p-3.5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Sparkles size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">
          Ton récap de {prevMonth} est prêt
        </span>
        <span className="block text-xs text-ink-soft">
          Tes stats et celles du cercle.
        </span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-ink-faint" aria-hidden />
    </Link>
  );
}

/**
 * Carte de vote, visible du jeudi au samedi : série « fil rouge » du mois
 * suivant en priorité (dernier week-end du mois), sinon thème de dimanche.
 */
async function themeVoteCard(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  today: string,
  monday: string
) {
  if (![4, 5, 6].includes(weekdayOf(today))) return null;
  const sunday = addDays(monday, 6);
  // Le vote de série ne s'affiche que la dernière semaine du mois
  const lastWeekOfMonth = addDays(today, 7).slice(0, 7) !== today.slice(0, 7);
  const nextMonthFirst = addDays(today, 7).slice(0, 8) + "01";

  const [{ data: seriesPoll }, { data: weekPoll }] = await Promise.all([
    lastWeekOfMonth
      ? supabase
          .from("lumen_theme_polls")
          .select("id, options, sunday, kind")
          .eq("sunday", nextMonthFirst)
          .eq("kind", "series")
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("lumen_theme_polls")
      .select("id, options, sunday, kind")
      .eq("sunday", sunday)
      .eq("kind", "sunday")
      .maybeSingle(),
  ]);
  const poll = seriesPoll ?? weekPoll;
  if (!poll) return null;

  const { data: ballots } = await supabase
    .from("lumen_theme_ballots")
    .select("user_id, option_idx")
    .eq("poll_id", poll.id);

  const tallies = [0, 0, 0, 0];
  let myVote: number | null = null;
  for (const b of ballots ?? []) {
    tallies[b.option_idx]++;
    if (b.user_id === userId) myVote = b.option_idx;
  }

  const isSeries = poll.kind === "series";
  return (
    <ThemeVote
      pollId={poll.id}
      options={poll.options as { title: string; pitch: string; episodes?: string[] }[]}
      myVote={myVote}
      tallies={tallies}
      kind={isSeries ? "series" : "sunday"}
      sundayLabel={
        isSeries
          ? new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(
              new Date(poll.sunday + "T12:00:00Z")
            )
          : formatDateFr(sunday)
      }
    />
  );
}

export default async function TodayPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string;
  const today = parisToday();
  const monday = mondayOfWeek(today);

  const [{ data: lesson }, { data: weekLessons }, { data: streakRow }, { data: me }] =
    await Promise.all([
      supabase
        .from("lumen_lessons")
        .select(
          "id, date, domain, title, hook, body_md, anecdote, flex_phrase, date_hook, audio_path, series_title, series_episode"
        )
        .eq("date", today)
        .maybeSingle(),
      supabase
        .from("lumen_lessons")
        .select("id, date")
        .gte("date", monday)
        .lte("date", addDays(monday, 6)),
      supabase
        .from("lumen_streaks")
        .select("joker_used_week_of")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("lumen_profiles")
        .select("onboarded_at")
        .eq("id", userId)
        .maybeSingle(),
    ]);
  const showOnboarding = !me?.onboarded_at;

  // Semaine : quels jours sont validés ?
  const weekIds = (weekLessons ?? []).map((l) => l.id);
  const { data: weekProgress } = weekIds.length
    ? await supabase
        .from("lumen_lesson_progress")
        .select("lesson_id, quiz_completed_at")
        .eq("user_id", userId)
        .in("lesson_id", weekIds)
        .not("quiz_completed_at", "is", null)
    : { data: [] };
  const validatedLessonIds = new Set(
    (weekProgress ?? []).map((p) => p.lesson_id)
  );
  const validatedDates = new Set(
    (weekLessons ?? [])
      .filter((l) => validatedLessonIds.has(l.id))
      .map((l) => l.date)
  );

  const jokerAvailable = streakRow?.joker_used_week_of !== monday;

  if (!lesson) {
    const { data: cal } = await supabase
      .from("lumen_domain_calendar")
      .select("domain")
      .eq("weekday", weekdayOf(today))
      .maybeSingle();
    return (
      <div className="space-y-6">
        <Onboarding show={showOnboarding} />
        <WeekStrip
          today={today}
          monday={monday}
          validatedDates={[...validatedDates]}
          jokerAvailable={jokerAvailable}
        />
        <div className="flex flex-col items-center gap-4 pt-14 text-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft">
            <MoonStar size={38} className="text-primary" aria-hidden />
          </span>
          <h1 className="font-display text-[34px] text-primary-deep">
            Pas encore de leçon
          </h1>
          <p className="max-w-xs text-[15px] text-balance text-ink-soft">
            La leçon du jour ({cal?.domain ?? "…"}) n&apos;a pas encore été
            générée. Repasse un peu plus tard !
          </p>
        </div>
      </div>
    );
  }

  const [{ data: questions }, { data: progress }, { data: validators }] =
    await Promise.all([
      supabase
        .from("lumen_questions")
        .select("id, tier, position, prompt, choices, answer_idx, explanation")
        .eq("lesson_id", lesson.id)
        .order("tier", { ascending: true })
        .order("position", { ascending: true }),
      supabase
        .from("lumen_lesson_progress")
        .select("quiz_completed_at, score")
        .eq("user_id", userId)
        .eq("lesson_id", lesson.id)
        .maybeSingle(),
      supabase
        .from("lumen_lesson_progress")
        .select("user_id, lumen_profiles(display_name, avatar_url)")
        .eq("lesson_id", lesson.id)
        .not("quiz_completed_at", "is", null),
    ]);

  const others = (validators ?? [])
    .filter((v) => v.user_id !== userId)
    .map((v) => v.lumen_profiles)
    .filter(Boolean) as { display_name: string; avatar_url: string | null }[];

  const words = lesson.body_md.split(/\s+/).length;
  const readingMinutes = Math.max(3, Math.round(words / 180));
  const audioUrl = lesson.audio_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/lumen-audio/${lesson.audio_path}`
    : null;
  const voteCard = await themeVoteCard(supabase, userId, today, monday);

  return (
    <div className="space-y-5">
      <Onboarding show={showOnboarding} />
      <WeekStrip
        today={today}
        monday={monday}
        validatedDates={[...validatedDates]}
        jokerAvailable={jokerAvailable}
      />
      {recapCard(today)}
      <LessonFlow
        lesson={lesson}
        dateLabel={formatDateFr(lesson.date)}
        readingMinutes={readingMinutes}
        others={others}
        audioUrl={audioUrl}
        questions={(questions ?? []).map((q) => ({
          id: q.id,
          tier: q.tier as "base" | "bonus",
          prompt: q.prompt,
          choices: q.choices as string[],
          answerIdx: q.answer_idx,
          explanation: q.explanation,
        }))}
        initialDone={Boolean(progress?.quiz_completed_at)}
        initialScore={progress?.score ?? 0}
      />
      {voteCard}
    </div>
  );
}
