import { Leaf } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { parisToday } from "@/lib/dates";
import { SRS_MAX_REVIEWS_PER_DAY } from "@/lib/srs";
import { ReviewSession } from "@/components/review-session";

export default async function RevisionsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string;
  const today = parisToday();

  // Cartes dues, les plus anciennes d'abord, plafonnées (PRD §4.3)
  const { data: cards } = await supabase
    .from("lumen_srs_cards")
    .select("notion_id, level, due_date")
    .eq("user_id", userId)
    .lte("due_date", today)
    .lt("level", 5)
    .order("due_date", { ascending: true })
    .limit(SRS_MAX_REVIEWS_PER_DAY);

  if (!cards?.length) {
    const { data: next } = await supabase
      .from("lumen_srs_cards")
      .select("due_date")
      .eq("user_id", userId)
      .lt("level", 5)
      .gt("due_date", today)
      .order("due_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    return (
      <div className="animate-fade-up flex flex-col items-center gap-4 pt-16 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-good-soft">
          <Leaf size={38} className="text-good" aria-hidden />
        </span>
        <h1 className="font-display text-[34px] text-primary-deep">
          Rien à réviser
        </h1>
        <p className="max-w-xs text-[15px] text-balance text-ink-soft">
          {next
            ? `Tes prochaines cartes reviendront le ${new Intl.DateTimeFormat(
                "fr-FR",
                { weekday: "long", day: "numeric", month: "long" }
              ).format(new Date(next.due_date + "T12:00:00Z"))}.`
            : "Termine le quiz du jour pour créer tes premières cartes : elles reviendront à J+2, J+7, J+30."}
        </p>
      </div>
    );
  }

  // Notions + questions associées
  const notionIds = cards.map((c) => c.notion_id);
  const { data: notions } = await supabase
    .from("lumen_notions")
    .select("id, label, question_id")
    .in("id", notionIds);
  const questionIds = (notions ?? [])
    .map((n) => n.question_id)
    .filter((q): q is string => Boolean(q));
  const { data: questions } = await supabase
    .from("lumen_questions")
    .select("id, prompt, choices, answer_idx, explanation")
    .in("id", questionIds);

  const questionById = new Map((questions ?? []).map((q) => [q.id, q]));
  const items = cards.flatMap((card) => {
    const notion = (notions ?? []).find((n) => n.id === card.notion_id);
    const q = notion?.question_id ? questionById.get(notion.question_id) : null;
    if (!notion || !q) return [];
    return [
      {
        notionId: notion.id,
        label: notion.label,
        level: card.level,
        prompt: q.prompt,
        choices: q.choices as string[],
        answerIdx: q.answer_idx,
        explanation: q.explanation,
      },
    ];
  });

  return <ReviewSession items={items} />;
}
