"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addDays, parisToday, POINTS } from "@/lib";

export type QuizResult = {
  baseCorrect: number;
  bonusCorrect: number;
  points: number;
  streak: number;
  alreadyDone?: boolean;
};

/**
 * Valide le quiz du jour : recalcule le score côté serveur, crédite les
 * points, met à jour le streak et crée les cartes SRS (dues à J+2).
 * `answers` : 5 index de réponse alignés sur [base 0-2, bonus 0-1], -1 = non répondu.
 */
export async function completeQuiz(
  lessonId: string,
  answers: number[]
): Promise<QuizResult> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) throw new Error("non authentifié");

  // Garde anti double-soumission
  const { data: existing } = await supabase
    .from("lumen_lesson_progress")
    .select("score, quiz_completed_at")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (existing?.quiz_completed_at) {
    const { data: s } = await supabase
      .from("lumen_streaks")
      .select("current")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      baseCorrect: 0,
      bonusCorrect: 0,
      points: existing.score ?? 0,
      streak: s?.current ?? 0,
      alreadyDone: true,
    };
  }

  // Correction authoritative depuis la base
  const { data: questions } = await supabase
    .from("lumen_questions")
    .select("id, tier, position, answer_idx")
    .eq("lesson_id", lessonId);
  if (!questions || questions.length !== 5) throw new Error("quiz introuvable");

  const ordered = [...questions].sort((a, b) =>
    a.tier === b.tier ? a.position - b.position : a.tier === "base" ? -1 : 1
  );

  let baseCorrect = 0;
  for (let i = 0; i < 3; i++) {
    if (answers[i] === ordered[i].answer_idx) baseCorrect++;
  }
  let bonusCorrect = 0;
  if (baseCorrect === 3) {
    for (let i = 3; i < 5; i++) {
      if (answers[i] === ordered[i].answer_idx) bonusCorrect++;
    }
  }
  const points = baseCorrect * POINTS.base + bonusCorrect * POINTS.bonus;

  const now = new Date().toISOString();
  const { error: progressErr } = await supabase
    .from("lumen_lesson_progress")
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      read_at: now,
      quiz_completed_at: now,
      score: points,
    });
  if (progressErr) throw progressErr;

  const ledger = [
    { user_id: userId, source: "quiz", points: baseCorrect * POINTS.base },
  ];
  if (bonusCorrect > 0) {
    ledger.push({
      user_id: userId,
      source: "bonus",
      points: bonusCorrect * POINTS.bonus,
    });
  }
  const { error: ledgerErr } = await supabase
    .from("lumen_points_ledger")
    .insert(ledger.filter((l) => l.points > 0));
  if (ledgerErr) throw ledgerErr;

  // Streak : validé en terminant le quiz du jour
  const today = parisToday();
  const yesterday = addDays(today, -1);
  const { data: streakRow } = await supabase
    .from("lumen_streaks")
    .select("current, best, last_validated_date")
    .eq("user_id", userId)
    .maybeSingle();

  let current = 1;
  if (streakRow?.last_validated_date === today) {
    current = streakRow.current;
  } else if (streakRow?.last_validated_date === yesterday) {
    current = (streakRow?.current ?? 0) + 1;
  }
  const best = Math.max(current, streakRow?.best ?? 0);
  const { error: streakErr } = await supabase
    .from("lumen_streaks")
    .update({ current, best, last_validated_date: today })
    .eq("user_id", userId);
  if (streakErr) throw streakErr;

  // Cartes SRS : les 5 notions reviennent à J+2
  const { data: notions } = await supabase
    .from("lumen_notions")
    .select("id")
    .eq("lesson_id", lessonId);
  if (notions?.length) {
    await supabase.from("lumen_srs_cards").upsert(
      notions.map((n) => ({
        user_id: userId,
        notion_id: n.id,
        level: 0,
        due_date: addDays(today, 2),
      })),
      { onConflict: "user_id,notion_id", ignoreDuplicates: true }
    );
  }

  revalidatePath("/");
  revalidatePath("/classement");

  return { baseCorrect, bonusCorrect, points, streak: current };
}
