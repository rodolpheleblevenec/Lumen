"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addDays, mondayOfWeek, parisToday, POINTS } from "@/lib";
import { srsAfterReview } from "@/lib/srs";
import { awardQuizBadges, awardReviewBadges } from "@/server/badges";

export type QuizResult = {
  baseCorrect: number;
  bonusCorrect: number;
  points: number;
  streak: number;
  alreadyDone?: boolean;
  isCatchup?: boolean;
  streakSaved?: boolean;
};

async function requireUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) throw new Error("non authentifié");
  return { supabase, userId };
}

/**
 * Valide un quiz (leçon du jour OU leçon de la bibliothèque) :
 * recalcule le score côté serveur, crédite les points, met à jour le
 * streak (avec joker de rattrapage pour la leçon de la veille) et crée
 * les cartes SRS (dues à J+2).
 * `answers` : 5 index alignés sur [base 0-2, bonus 0-1], -1 = non répondu.
 */
export async function completeQuiz(
  lessonId: string,
  answers: number[]
): Promise<QuizResult> {
  const { supabase, userId } = await requireUserId();

  const { data: lesson } = await supabase
    .from("lumen_lessons")
    .select("id, date")
    .eq("id", lessonId)
    .single();
  if (!lesson) throw new Error("leçon introuvable");

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

  const today = parisToday();
  const yesterday = addDays(today, -1);
  const isCatchup = lesson.date !== today;

  // Barème : jour même 10/20 pts — rattrapage 5 pts/bonne réponse (PRD §4.5)
  const points = isCatchup
    ? (baseCorrect + bonusCorrect) * POINTS.catchup
    : baseCorrect * POINTS.base + bonusCorrect * POINTS.bonus;

  // Revendication atomique : seul le premier appel insère la ligne
  // (PK user_id+lesson_id). Un double appel concurrent perd la course
  // et ne crédite rien — le ledger ne peut pas être doublé.
  const now = new Date().toISOString();
  const { data: claimed, error: progressErr } = await supabase
    .from("lumen_lesson_progress")
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        read_at: now,
        quiz_completed_at: now,
        score: points,
        is_catchup: isCatchup,
      },
      { onConflict: "user_id,lesson_id", ignoreDuplicates: true }
    )
    .select("lesson_id");
  if (progressErr) throw progressErr;
  if (!claimed?.length) {
    const { data: s } = await supabase
      .from("lumen_streaks")
      .select("current")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      baseCorrect,
      bonusCorrect,
      points,
      streak: s?.current ?? 0,
      alreadyDone: true,
    };
  }

  if (points > 0) {
    const ledger = isCatchup
      ? [{ user_id: userId, source: "catchup", points }]
      : [
          { user_id: userId, source: "quiz", points: baseCorrect * POINTS.base },
          ...(bonusCorrect > 0
            ? [
                {
                  user_id: userId,
                  source: "bonus",
                  points: bonusCorrect * POINTS.bonus,
                },
              ]
            : []),
        ];
    const { error: ledgerErr } = await supabase
      .from("lumen_points_ledger")
      .insert(ledger.filter((l) => l.points > 0));
    if (ledgerErr) throw ledgerErr;
  }

  // Streak
  const { data: streakRow } = await supabase
    .from("lumen_streaks")
    .select("current, best, last_validated_date, joker_used_week_of")
    .eq("user_id", userId)
    .maybeSingle();

  let current = streakRow?.current ?? 0;
  let streakSaved = false;

  if (!isCatchup) {
    // Validation du jour
    if (streakRow?.last_validated_date === today) {
      current = streakRow.current;
    } else if (streakRow?.last_validated_date === yesterday) {
      current = (streakRow?.current ?? 0) + 1;
    } else {
      current = 1;
    }
    const best = Math.max(current, streakRow?.best ?? 0);
    await supabase
      .from("lumen_streaks")
      .update({ current, best, last_validated_date: today })
      .eq("user_id", userId);
  } else if (
    lesson.date === yesterday &&
    streakRow &&
    // Le joker n'est consommé que s'il sauve vraiment quelque chose :
    // le dernier jour validé est avant-hier (streak encore rattrapable).
    // Si le streak est déjà cassé depuis plus longtemps, le rattrapage
    // donne les points mais garde le joker pour une vraie occasion.
    streakRow.last_validated_date === addDays(yesterday, -1) &&
    streakRow.joker_used_week_of !== mondayOfWeek(today)
  ) {
    // Joker : rattraper la veille sous 24h sauve le streak (1/semaine)
    current = (streakRow.current ?? 0) + 1;
    const best = Math.max(current, streakRow.best ?? 0);
    await supabase
      .from("lumen_streaks")
      .update({
        current,
        best,
        last_validated_date: yesterday,
        joker_used_week_of: mondayOfWeek(today),
      })
      .eq("user_id", userId);
    streakSaved = true;
  }

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

  await awardQuizBadges(supabase, userId, current, points);

  revalidatePath("/");
  revalidatePath("/classement");
  revalidatePath("/bibliotheque");

  return { baseCorrect, bonusCorrect, points, streak: current, isCatchup, streakSaved };
}

export type ReviewOutcome = { notionId: string; correct: boolean };
export type ReviewResult = {
  reviewed: number;
  correct: number;
  points: number;
  acquired: number;
};

/**
 * Termine une session de révision : met à jour le niveau SRS de chaque
 * carte (réussite → intervalle supérieur, échec → retour à J+2) et
 * crédite 5 pts par carte réussie.
 */
export async function completeReview(
  outcomes: ReviewOutcome[]
): Promise<ReviewResult> {
  const { supabase, userId } = await requireUserId();
  const today = parisToday();

  const notionIds = outcomes.map((o) => o.notionId);
  const { data: cards } = await supabase
    .from("lumen_srs_cards")
    .select("notion_id, level, due_date")
    .eq("user_id", userId)
    .in("notion_id", notionIds)
    .lte("due_date", today)
    .lt("level", 5);
  if (!cards?.length) return { reviewed: 0, correct: 0, points: 0, acquired: 0 };

  const byNotion = new Map(cards.map((c) => [c.notion_id, c]));
  const now = new Date().toISOString();
  let reviewed = 0;
  let correct = 0;
  let acquired = 0;

  for (const o of outcomes) {
    const card = byNotion.get(o.notionId);
    if (!card) continue; // carte pas due / déjà acquise : ignorée
    reviewed++;
    const next = srsAfterReview(card.level, o.correct);
    if (o.correct) correct++;
    if (next.level === 5) acquired++;
    await supabase
      .from("lumen_srs_cards")
      .update({
        level: next.level,
        due_date: addDays(today, next.interval),
        last_reviewed_at: now,
      })
      .eq("user_id", userId)
      .eq("notion_id", o.notionId);
  }

  const points = correct * POINTS.review;
  if (points > 0) {
    await supabase
      .from("lumen_points_ledger")
      .insert([{ user_id: userId, source: "review", points }]);
  }

  await awardReviewBadges(supabase, userId);

  revalidatePath("/revisions");
  revalidatePath("/classement");

  return { reviewed, correct, points, acquired };
}

/* ─── Notifications push ─── */

export async function savePushSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("lumen_push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    { onConflict: "endpoint" }
  );
}

export async function removePushSubscription(endpoint: string) {
  const { supabase, userId } = await requireUserId();
  await supabase
    .from("lumen_push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);
}
