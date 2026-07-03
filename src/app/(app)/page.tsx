import { createClient } from "@/lib/supabase/server";
import { formatDateFr, parisToday, weekdayOf } from "@/lib/dates";
import { LessonFlow } from "@/components/lesson-flow";

export default async function TodayPage() {
  const supabase = await createClient();
  const today = parisToday();

  const { data: lesson } = await supabase
    .from("lumen_lessons")
    .select("id, date, domain, title, hook, body_md, anecdote, flex_phrase")
    .eq("date", today)
    .maybeSingle();

  if (!lesson) {
    const { data: cal } = await supabase
      .from("lumen_domain_calendar")
      .select("domain")
      .eq("weekday", weekdayOf(today))
      .maybeSingle();
    return (
      <div className="flex flex-col items-center gap-4 pt-20 text-center">
        <span className="text-5xl" aria-hidden>
          🌙
        </span>
        <h1 className="text-2xl font-bold">Pas encore de leçon</h1>
        <p className="max-w-xs text-balance text-stone-500 dark:text-stone-400">
          La leçon du jour ({cal?.domain ?? "…"}) n&apos;a pas encore été
          générée. Repasse un peu plus tard !
        </p>
      </div>
    );
  }

  const [{ data: questions }, { data: claims }] = await Promise.all([
    supabase
      .from("lumen_questions")
      .select("id, tier, position, prompt, choices, answer_idx, explanation")
      .eq("lesson_id", lesson.id)
      .order("tier", { ascending: true }) // base avant bonus
      .order("position", { ascending: true }),
    supabase.auth.getClaims(),
  ]);

  const userId = claims?.claims?.sub as string;
  const { data: progress } = await supabase
    .from("lumen_lesson_progress")
    .select("quiz_completed_at, score")
    .eq("user_id", userId)
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  return (
    <LessonFlow
      lesson={lesson}
      dateLabel={formatDateFr(lesson.date)}
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
  );
}
