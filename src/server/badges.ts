import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { SRS_ACQUIRED_LEVEL } from "@/lib/srs";

type Client = SupabaseClient<Database>;

async function award(supabase: Client, userId: string, keys: string[]) {
  if (!keys.length) return;
  await supabase.from("lumen_badges").upsert(
    keys.map((badge_key) => ({ user_id: userId, badge_key })),
    { onConflict: "user_id,badge_key", ignoreDuplicates: true }
  );
}

/** Badges liés au streak et au score — appelé après un quiz. */
export async function awardQuizBadges(
  supabase: Client,
  userId: string,
  streak: number,
  points: number
) {
  const keys: string[] = [];
  if (points >= 70) keys.push("perfect_quiz");
  for (const n of [7, 30, 100, 365]) {
    if (streak >= n) keys.push(`streak_${n}`);
  }
  await award(supabase, userId, keys);
}

/** Badges liés aux notions acquises — appelé après une session de révision. */
export async function awardReviewBadges(supabase: Client, userId: string) {
  const { data: acquired } = await supabase
    .from("lumen_srs_cards")
    .select("notion_id")
    .eq("user_id", userId)
    .eq("level", SRS_ACQUIRED_LEVEL);
  if (!acquired?.length) return;

  const keys: string[] = [];
  if (acquired.length >= 50) keys.push("notions_50");

  // Domaine maîtrisé : 30 notions acquises dans un même domaine
  const notionIds = acquired.map((c) => c.notion_id);
  const { data: notions } = await supabase
    .from("lumen_notions")
    .select("lesson_id")
    .in("id", notionIds);
  const lessonIds = [...new Set((notions ?? []).map((n) => n.lesson_id))];
  if (lessonIds.length) {
    const { data: lessons } = await supabase
      .from("lumen_lessons")
      .select("id, domain")
      .in("id", lessonIds);
    const domainOf = new Map((lessons ?? []).map((l) => [l.id, l.domain]));
    const counts = new Map<string, number>();
    for (const n of notions ?? []) {
      const d = domainOf.get(n.lesson_id);
      if (d) counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    if ([...counts.values()].some((c) => c >= 30)) keys.push("domain_master");
  }

  await award(supabase, userId, keys);
}
