import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateFr, parisToday } from "@/lib/dates";
import { LessonFlow } from "@/components/lesson-flow";

export default async function LeconPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lumen_lessons")
    .select(
      "id, date, domain, title, hook, body_md, anecdote, flex_phrase, date_hook, audio_path"
    )
    .eq("id", id)
    .maybeSingle();
  if (!lesson) notFound();
  if (lesson.date === parisToday()) redirect("/");

  const [{ data: questions }, { data: claims }] = await Promise.all([
    supabase
      .from("lumen_questions")
      .select("id, tier, position, prompt, choices, answer_idx, explanation")
      .eq("lesson_id", lesson.id)
      .order("tier", { ascending: true })
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

  const audioUrl = lesson.audio_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/lumen-audio/${lesson.audio_path}`
    : null;

  return (
    <LessonFlow
      lesson={lesson}
      dateLabel={formatDateFr(lesson.date)}
      mode="catchup"
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
  );
}
