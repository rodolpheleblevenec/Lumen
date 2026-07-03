// Répétition espacée (SM-2 allégé, PRD §4.3)
// Niveaux : 0 (nouvelle, due J+2) → 1 (J+7) → 2 (J+30) → 3 (J+90) → 5 (acquise).
// Échec : retour au niveau 0, due J+2.

export const SRS_MAX_REVIEWS_PER_DAY = 10;
export const SRS_ACQUIRED_LEVEL = 5;

const NEXT_INTERVAL: Record<number, number> = { 1: 7, 2: 30, 3: 90 };

export function srsAfterReview(level: number, correct: boolean) {
  if (!correct) {
    return { level: 0, interval: 2 };
  }
  if (level >= 3) {
    // J+90 réussi → notion acquise (plus jamais due)
    return { level: SRS_ACQUIRED_LEVEL, interval: 3650 };
  }
  const next = level + 1;
  return { level: next, interval: NEXT_INTERVAL[next] };
}
