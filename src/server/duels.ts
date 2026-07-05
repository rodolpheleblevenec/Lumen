import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushTo } from "@/server/push";

// Duels amicaux : asynchrones, 1 duel actif par paire, 24h pour jouer
// (sinon forfait), 5 questions tirées des leçons validées par les deux.
// Hors barème hebdo : l'enjeu est le face-à-face, les trophées et le gage.

export const DUEL_SIZE = 5;
const DUEL_TTL_MS = 24 * 60 * 60 * 1000;

export type DuelQuestion = { question_id: string; choice_order: number[] };
export type DuelResultSide = {
  score: number;
  timesMs: number[];
  answers: number[];
  playedAt: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Leçons validées par les deux joueurs → 5 questions au hasard. */
export async function pickDuelQuestions(
  challenger: string,
  opponent: string
): Promise<DuelQuestion[] | { error: string }> {
  const admin = createAdminClient();

  const [{ data: mine }, { data: theirs }] = await Promise.all([
    admin
      .from("lumen_lesson_progress")
      .select("lesson_id")
      .eq("user_id", challenger)
      .not("quiz_completed_at", "is", null),
    admin
      .from("lumen_lesson_progress")
      .select("lesson_id")
      .eq("user_id", opponent)
      .not("quiz_completed_at", "is", null),
  ]);

  const theirSet = new Set((theirs ?? []).map((p) => p.lesson_id));
  const common = (mine ?? [])
    .map((p) => p.lesson_id)
    .filter((id) => theirSet.has(id));
  if (!common.length)
    return { error: "Aucune leçon validée en commun : impossible de vous départager équitablement." };

  const { data: questions } = await admin
    .from("lumen_questions")
    .select("id")
    .in("lesson_id", common);
  if (!questions || questions.length < DUEL_SIZE)
    return { error: "Pas encore assez de questions en commun pour un duel." };

  return shuffle(questions)
    .slice(0, DUEL_SIZE)
    .map((q) => ({ question_id: q.id, choice_order: shuffle([0, 1, 2, 3]) }));
}

/** Score d'une grille de réponses (indices dans l'ordre affiché). */
export async function scoreDuelAnswers(
  duelQuestions: DuelQuestion[],
  answers: number[]
): Promise<number> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("lumen_questions")
    .select("id, answer_idx")
    .in("id", duelQuestions.map((q) => q.question_id));
  const byId = new Map((rows ?? []).map((r) => [r.id, r.answer_idx]));

  let score = 0;
  duelQuestions.forEach((q, i) => {
    const shown = answers[i];
    if (shown >= 0 && q.choice_order[shown] === byId.get(q.question_id)) score++;
  });
  return score;
}

/** Vainqueur : score, puis temps total le plus court ; null = égalité parfaite. */
export function duelWinner(
  duel: { challenger: string; opponent: string },
  a: DuelResultSide,
  b: DuelResultSide
): string | null {
  if (a.score !== b.score) return a.score > b.score ? duel.challenger : duel.opponent;
  const ta = a.timesMs.reduce((x, y) => x + y, 0);
  const tb = b.timesMs.reduce((x, y) => x + y, 0);
  if (ta !== tb) return ta < tb ? duel.challenger : duel.opponent;
  return null;
}

/** Trophées de duel du vainqueur (+ premier duel pour les deux). */
export async function awardDuelBadges(
  duelId: string,
  challenger: string,
  opponent: string,
  winner: string | null
) {
  const admin = createAdminClient();

  // Premier duel terminé : pour les deux joueurs
  for (const userId of [challenger, opponent]) {
    await admin
      .from("lumen_badges")
      .upsert(
        { user_id: userId, badge_key: "duel_first" },
        { onConflict: "user_id,badge_key", ignoreDuplicates: true }
      );
  }
  if (!winner) return;

  const loser = winner === challenger ? opponent : challenger;

  const { data: completed } = await admin
    .from("lumen_duels")
    .select("id, challenger, opponent, winner")
    .eq("status", "completed");
  const mineWon = (completed ?? []).filter((d) => d.winner === winner);

  if (mineWon.length >= 5) {
    await admin
      .from("lumen_badges")
      .upsert(
        { user_id: winner, badge_key: "duel_5_wins" },
        { onConflict: "user_id,badge_key", ignoreDuplicates: true }
      );
  }

  // Revanche : gagner contre quelqu'un qui t'avait déjà battu
  const hadLostBefore = (completed ?? []).some(
    (d) =>
      d.id !== duelId &&
      d.winner === loser &&
      ((d.challenger === winner && d.opponent === loser) ||
        (d.opponent === winner && d.challenger === loser))
  );
  if (hadLostBefore) {
    await admin
      .from("lumen_badges")
      .upsert(
        { user_id: winner, badge_key: "duel_revenge" },
        { onConflict: "user_id,badge_key", ignoreDuplicates: true }
      );
  }
}

/**
 * Forfait paresseux : un duel expiré où un seul a joué est résolu au
 * profit de celui qui a joué. Appelé à la lecture.
 */
export async function resolveExpiredDuel(duel: {
  id: string;
  status: string;
  expires_at: string;
  challenger: string;
  opponent: string;
  challenger_result: unknown;
  opponent_result: unknown;
}): Promise<{ status: string; winner: string | null }> {
  if (duel.status !== "pending" || duel.expires_at > new Date().toISOString())
    return { status: duel.status, winner: null };

  const winner = duel.challenger_result
    ? duel.challenger
    : duel.opponent_result
      ? duel.opponent
      : null;
  const admin = createAdminClient();
  await admin
    .from("lumen_duels")
    .update({ status: "forfeit", winner })
    .eq("id", duel.id)
    .eq("status", "pending");
  return { status: "forfeit", winner };
}

export function duelExpiry(): string {
  return new Date(Date.now() + DUEL_TTL_MS).toISOString();
}

export { sendPushTo };
