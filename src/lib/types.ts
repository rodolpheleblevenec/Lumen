import type { Database } from "@/lib/database.types";

type Tables = Database["public"]["Tables"];

export type Lesson = Tables["lumen_lessons"]["Row"];
export type Question = Tables["lumen_questions"]["Row"];
export type Notion = Tables["lumen_notions"]["Row"];
export type Profile = Tables["lumen_profiles"]["Row"];
export type Streak = Tables["lumen_streaks"]["Row"];
export type LessonProgress = Tables["lumen_lesson_progress"]["Row"];

// Barème (PRD §4)
export const POINTS = {
  base: 10,
  bonus: 20,
  review: 5,
  catchup: 5,
} as const;

// L'icône est résolue côté UI (lucide) — voir la page Profil.
// `goal` permet d'afficher la progression vers le prochain badge.
export const BADGES: Record<
  string,
  { label: string; goal?: { kind: "streak" | "notions"; target: number } }
> = {
  perfect_quiz: { label: "Premier sans-faute (70 pts)" },
  streak_7: { label: "7 jours d'affilée", goal: { kind: "streak", target: 7 } },
  streak_30: { label: "30 jours d'affilée", goal: { kind: "streak", target: 30 } },
  streak_100: { label: "100 jours d'affilée", goal: { kind: "streak", target: 100 } },
  streak_365: { label: "Une année entière", goal: { kind: "streak", target: 365 } },
  notions_50: { label: "50 notions acquises", goal: { kind: "notions", target: 50 } },
  domain_master: { label: "Un domaine maîtrisé" },
  duel_first: { label: "Premier duel" },
  duel_5_wins: { label: "5 duels gagnés" },
  duel_revenge: { label: "Revanche prise" },
};
