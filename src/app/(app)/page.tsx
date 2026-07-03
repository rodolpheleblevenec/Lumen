import { createClient } from "@/lib/supabase/server";
import { addDays, formatDateFr, mondayOfWeek, parisToday, weekdayOf } from "@/lib/dates";
import { LessonFlow } from "@/components/lesson-flow";
import { WeekStrip } from "@/components/week-strip";
import { Onboarding } from "@/components/onboarding";
import { MoonStar } from "lucide-react";

export default async function TodayPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string;
  const today = parisToday();
  const monday = mondayOfWeek(today);

  const [{ data: lesson }, { data: weekLessons }, { data: streakRow }] =
    await Promise.all([
      supabase
        .from("lumen_lessons")
        .select("id, date, domain, title, hook, body_md, anecdote, flex_phrase")
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
    ]);

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
        <Onboarding />
        <WeekStrip
          today={today}
          monday={monday}
          validatedDates={[...validatedDates]}
          jokerAvailable={jokerAvailable}
        />
        <div className="flex flex-col items-center gap-4 pt-14 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-card-soft">
            <MoonStar size={34} className="text-ink-soft" aria-hidden />
          </span>
          <h1 className="font-display text-2xl font-semibold">
            Pas encore de leçon
          </h1>
          <p className="max-w-xs text-balance text-ink-soft">
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

  return (
    <div className="space-y-5">
      <Onboarding />
      <WeekStrip
        today={today}
        monday={monday}
        validatedDates={[...validatedDates]}
        jokerAvailable={jokerAvailable}
      />
      <LessonFlow
        lesson={lesson}
        dateLabel={formatDateFr(lesson.date)}
        readingMinutes={readingMinutes}
        others={others}
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
    </div>
  );
}
