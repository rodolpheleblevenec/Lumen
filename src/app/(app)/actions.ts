"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addDays, mondayOfWeek, parisToday, POINTS } from "@/lib";
import { srsAfterReview } from "@/lib/srs";
import { awardQuizBadges, awardReviewBadges } from "@/server/badges";
import { generateDeepDive } from "@/server/deepen";
import { ensureLessonAudio } from "@/server/tts";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushTo } from "@/server/push";
import {
  awardDuelBadges,
  duelExpiry,
  duelWinner,
  pickDuelQuestions,
  scoreDuelAnswers,
  type DuelQuestion,
  type DuelResultSide,
} from "@/server/duels";

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
    .select(
      "current, best, last_validated_date, joker_used_week_of, vacation_start, vacation_end"
    )
    .eq("user_id", userId)
    .maybeSingle();

  let current = streakRow?.current ?? 0;
  let streakSaved = false;

  // Mode vacances : le trou entre le dernier jour validé et aujourd'hui
  // est « gelé » si chaque jour manqué tombe dans la période déclarée.
  const gapFrozen = (() => {
    const last = streakRow?.last_validated_date;
    const vs = streakRow?.vacation_start;
    const ve = streakRow?.vacation_end;
    if (!last || !vs || !ve || last >= today) return false;
    for (let d = addDays(last, 1); d < today; d = addDays(d, 1)) {
      if (d < vs || d > ve) return false;
    }
    return true;
  })();

  if (!isCatchup) {
    // Validation du jour
    if (streakRow?.last_validated_date === today) {
      current = streakRow.current;
    } else if (streakRow?.last_validated_date === yesterday || gapFrozen) {
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

/* ─── Creuser cette notion ─── */

/**
 * Approfondissement d'une partie de leçon, généré à la demande (jamais
 * pré-généré) et partagé au cercle via lumen_deep_dives.
 */
export async function deepenSection(
  lessonId: string,
  sectionKey: string,
  sectionTitle: string
): Promise<{ content: string }> {
  const { supabase, userId } = await requireUserId();

  // La RLS garantit ici que l'appelant est membre et la leçon publiée
  const { data: lesson } = await supabase
    .from("lumen_lessons")
    .select("id, domain, title, body_md, anecdote")
    .eq("id", lessonId)
    .single();
  if (!lesson) throw new Error("leçon introuvable");

  const content = await generateDeepDive(lesson, sectionKey, sectionTitle, userId);
  return { content };
}

/* ─── Audio de la leçon ─── */

export async function getLessonAudio(
  lessonId: string
): Promise<{ url: string }> {
  const { supabase } = await requireUserId();

  // Vérification d'accès via RLS avant de passer au client admin
  const { data: lesson } = await supabase
    .from("lumen_lessons")
    .select("id")
    .eq("id", lessonId)
    .single();
  if (!lesson) throw new Error("leçon introuvable");

  const url = await ensureLessonAudio(lessonId);
  return { url };
}

/* ─── Vote du thème du dimanche ─── */

export async function voteTheme(pollId: string, optionIdx: number) {
  const { supabase, userId } = await requireUserId();
  if (optionIdx < 0 || optionIdx > 3) throw new Error("option invalide");

  const { error } = await supabase.from("lumen_theme_ballots").insert({
    poll_id: pollId,
    user_id: userId,
    option_idx: optionIdx,
  });
  // 23505 = déjà voté : on ignore (un seul vote par personne)
  if (error && error.code !== "23505") throw error;

  revalidatePath("/");
}

/* ─── Onboarding vu (lié au compte, pas au navigateur) ─── */

export async function markOnboarded() {
  const { supabase, userId } = await requireUserId();
  await supabase
    .from("lumen_profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", userId)
    .is("onboarded_at", null);
}

/* ─── Préférences : heure de rappel ─── */

export async function setPushHour(hour: number) {
  const { supabase, userId } = await requireUserId();
  if (!Number.isInteger(hour) || hour < 0 || hour > 23)
    throw new Error("heure invalide");
  const { error } = await supabase
    .from("lumen_profiles")
    .update({ push_hour: hour })
    .eq("id", userId);
  if (error) throw error;
  revalidatePath("/profil");
}

/* ─── Mode vacances ─── */

const VACATION_MAX_DAYS_PER_YEAR = 14;

export type VacationResult = { ok: boolean; error?: string };

/** Déclare une période de vacances : streak gelé, max 14 jours/an. */
export async function setVacation(
  start: string,
  end: string
): Promise<VacationResult> {
  const { supabase, userId } = await requireUserId();
  const today = parisToday();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end))
    return { ok: false, error: "Dates invalides." };
  if (start > end) return { ok: false, error: "Le début doit précéder la fin." };
  if (end < today) return { ok: false, error: "Cette période est déjà passée." };

  const days =
    Math.round(
      (new Date(end + "T12:00:00Z").getTime() -
        new Date(start + "T12:00:00Z").getTime()) /
        86_400_000
    ) + 1;

  const { data: streak } = await supabase
    .from("lumen_streaks")
    .select("vacation_days_used, vacation_year, vacation_start, vacation_end")
    .eq("user_id", userId)
    .maybeSingle();
  if (!streak) return { ok: false, error: "Profil sans streak." };
  if (streak.vacation_start && streak.vacation_end && streak.vacation_end >= today)
    return { ok: false, error: "Une période est déjà déclarée : annule-la d'abord." };

  const year = Number(start.slice(0, 4));
  const used = streak.vacation_year === year ? streak.vacation_days_used : 0;
  if (used + days > VACATION_MAX_DAYS_PER_YEAR)
    return {
      ok: false,
      error: `Il te reste ${VACATION_MAX_DAYS_PER_YEAR - used} jour(s) de gel cette année.`,
    };

  const { error } = await supabase
    .from("lumen_streaks")
    .update({
      vacation_start: start,
      vacation_end: end,
      vacation_days_used: used + days,
      vacation_year: year,
    })
    .eq("user_id", userId);
  if (error) throw error;

  revalidatePath("/profil");
  return { ok: true };
}

/** Annule la période à venir (ou en cours) et rend les jours non consommés. */
export async function cancelVacation(): Promise<VacationResult> {
  const { supabase, userId } = await requireUserId();
  const today = parisToday();

  const { data: streak } = await supabase
    .from("lumen_streaks")
    .select("vacation_start, vacation_end, vacation_days_used")
    .eq("user_id", userId)
    .maybeSingle();
  if (!streak?.vacation_start || !streak.vacation_end)
    return { ok: false, error: "Aucune période déclarée." };

  // Jours déjà consommés (période entamée) : restent décomptés
  const effectiveEnd =
    streak.vacation_start <= today ? addDays(today, -1) : null;
  const consumed = effectiveEnd
    ? Math.max(
        0,
        Math.round(
          (new Date(effectiveEnd + "T12:00:00Z").getTime() -
            new Date(streak.vacation_start + "T12:00:00Z").getTime()) /
            86_400_000
        ) + 1
      )
    : 0;
  const declared =
    Math.round(
      (new Date(streak.vacation_end + "T12:00:00Z").getTime() -
        new Date(streak.vacation_start + "T12:00:00Z").getTime()) /
        86_400_000
    ) + 1;

  const { error } = await supabase
    .from("lumen_streaks")
    .update({
      vacation_start: null,
      vacation_end: null,
      vacation_days_used: Math.max(
        0,
        streak.vacation_days_used - declared + consumed
      ),
    })
    .eq("user_id", userId);
  if (error) throw error;

  revalidatePath("/profil");
  return { ok: true };
}

/* ─── Duels amicaux ─── */

export type CreateDuelResult =
  | { ok: true; duelId: string }
  | { ok: false; error: string };

/**
 * Lance un duel : 5 questions tirées des leçons validées par les deux,
 * mêmes questions dans le même ordre, 24h pour jouer. 1 duel actif par
 * paire. Hors barème hebdo.
 */
export async function createDuel(
  opponentId: string,
  stake: string | null
): Promise<CreateDuelResult> {
  const { supabase, userId } = await requireUserId();
  if (opponentId === userId)
    return { ok: false, error: "Tu ne peux pas te défier toi-même." };

  const { data: opponent } = await supabase
    .from("lumen_profiles")
    .select("id, display_name")
    .eq("id", opponentId)
    .maybeSingle();
  if (!opponent) return { ok: false, error: "Adversaire introuvable." };

  const admin = createAdminClient();
  const { data: active } = await admin
    .from("lumen_duels")
    .select("id, expires_at")
    .eq("status", "pending")
    .or(
      `and(challenger.eq.${userId},opponent.eq.${opponentId}),and(challenger.eq.${opponentId},opponent.eq.${userId})`
    );
  const stillActive = (active ?? []).some(
    (d) => d.expires_at > new Date().toISOString()
  );
  if (stillActive)
    return { ok: false, error: "Un duel est déjà en cours entre vous deux." };

  const questions = await pickDuelQuestions(userId, opponentId);
  if ("error" in questions) return { ok: false, error: questions.error };

  const { data: duel, error } = await admin
    .from("lumen_duels")
    .insert({
      challenger: userId,
      opponent: opponentId,
      stake: stake?.trim() || null,
      questions,
      expires_at: duelExpiry(),
    })
    .select("id")
    .single();
  if (error) throw error;

  const { data: me } = await supabase
    .from("lumen_profiles")
    .select("display_name")
    .eq("id", userId)
    .single();
  void sendPushTo(
    [opponentId],
    "Un duel t'attend !",
    `${me?.display_name ?? "Quelqu'un"} te défie sur 5 questions. Tu as 24h.`,
    `/duel/${duel.id}`
  );

  revalidatePath("/classement");
  return { ok: true, duelId: duel.id };
}

export type PlayDuelResult =
  | { ok: true; finished: boolean }
  | { ok: false; error: string };

/** Enregistre ma manche du duel : score recalculé côté serveur. */
export async function playDuel(
  duelId: string,
  answers: number[],
  timesMs: number[]
): Promise<PlayDuelResult> {
  const { userId } = await requireUserId();
  const admin = createAdminClient();

  const { data: duel } = await admin
    .from("lumen_duels")
    .select("*")
    .eq("id", duelId)
    .single();
  if (!duel) return { ok: false, error: "Duel introuvable." };
  if (duel.challenger !== userId && duel.opponent !== userId)
    return { ok: false, error: "Ce duel ne te concerne pas." };
  if (duel.status !== "pending")
    return { ok: false, error: "Ce duel est déjà terminé." };
  if (duel.expires_at < new Date().toISOString())
    return { ok: false, error: "Trop tard : le duel a expiré." };

  const side = duel.challenger === userId ? "challenger_result" : "opponent_result";
  if (duel[side]) return { ok: false, error: "Tu as déjà joué ce duel." };

  const questions = duel.questions as DuelQuestion[];
  const score = await scoreDuelAnswers(questions, answers);
  const myResult: DuelResultSide = {
    score,
    timesMs: timesMs.map((t) => Math.max(0, Math.round(t))),
    answers,
    playedAt: new Date().toISOString(),
  };

  const other =
    side === "challenger_result" ? duel.opponent_result : duel.challenger_result;
  const finished = Boolean(other);

  let winner: string | null = null;
  if (finished) {
    const challengerResult = (
      side === "challenger_result" ? myResult : duel.challenger_result
    ) as DuelResultSide;
    const opponentResult = (
      side === "opponent_result" ? myResult : duel.opponent_result
    ) as DuelResultSide;
    winner = duelWinner(duel, challengerResult, opponentResult);
  }

  const { error } = await admin
    .from("lumen_duels")
    .update({
      [side]: myResult,
      ...(finished ? { status: "completed", winner } : {}),
    })
    .eq("id", duelId)
    .eq("status", "pending");
  if (error) throw error;

  const otherId = duel.challenger === userId ? duel.opponent : duel.challenger;
  if (finished) {
    await awardDuelBadges(duelId, duel.challenger, duel.opponent, winner);
    void sendPushTo(
      [otherId],
      "Duel terminé !",
      winner === otherId
        ? "Victoire ! Viens voir le face-à-face."
        : winner
          ? "Défaite… viens voir ce qui s'est joué."
          : "Égalité parfaite. Ça se rejoue ?",
      `/duel/${duelId}`
    );
  }

  revalidatePath("/classement");
  revalidatePath(`/duel/${duelId}`);
  return { ok: true, finished };
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
