import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { parisToday } from "@/lib/dates";

export default async function BibliothequePage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string;

  const [{ data: lessons }, { data: progress }] = await Promise.all([
    supabase
      .from("lumen_lessons")
      .select("id, date, domain, title")
      .order("date", { ascending: false }),
    supabase
      .from("lumen_lesson_progress")
      .select("lesson_id, quiz_completed_at, score")
      .eq("user_id", userId),
  ]);

  const progressByLesson = new Map(
    (progress ?? []).map((p) => [p.lesson_id, p])
  );
  const today = parisToday();

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="font-display text-2xl font-semibold">Bibliothèque</h1>
      <p className="text-sm text-ink-soft">
        Toutes les leçons restent lisibles et quizzables (5 pts/bonne
        réponse). Rattraper celle d&apos;hier peut sauver ton streak — 1
        joker par semaine.
      </p>

      <ul className="space-y-2">
        {(lessons ?? []).map((lesson) => {
          const p = progressByLesson.get(lesson.id);
          const done = Boolean(p?.quiz_completed_at);
          const isToday = lesson.date === today;
          return (
            <li key={lesson.id}>
              <Link
                href={isToday ? "/" : `/lecon/${lesson.id}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3.5 transition active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-accent">
                    {lesson.domain} ·{" "}
                    {new Intl.DateTimeFormat("fr-FR", {
                      day: "numeric",
                      month: "short",
                    }).format(new Date(lesson.date + "T12:00:00Z"))}
                    {isToday && " · aujourd'hui"}
                  </p>
                  <p className="truncate font-display font-semibold">
                    {lesson.title}
                  </p>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-ink-soft">
                  {done ? `✅ ${p?.score ?? 0} pts` : "→"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {!lessons?.length && (
        <p className="pt-10 text-center text-ink-soft">
          Aucune leçon pour l&apos;instant.
        </p>
      )}
    </div>
  );
}
