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
