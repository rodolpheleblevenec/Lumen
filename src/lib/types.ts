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

export const BADGES: Record<string, { icon: string; label: string }> = {
  perfect_quiz: { icon: "⭐", label: "Premier sans-faute (70 pts)" },
  streak_7: { icon: "🔥", label: "7 jours d'affilée" },
  streak_30: { icon: "⚡", label: "30 jours d'affilée" },
  streak_100: { icon: "💎", label: "100 jours d'affilée" },
  streak_365: { icon: "👑", label: "Une année entière" },
  notions_50: { icon: "🧠", label: "50 notions acquises" },
  domain_master: { icon: "🎓", label: "Un domaine maîtrisé" },
};
