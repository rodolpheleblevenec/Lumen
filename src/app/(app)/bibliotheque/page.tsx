import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { parisToday } from "@/lib/dates";
import { DomainDot } from "@/components/domain-icon";

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
      <div>
        <h1 className="font-display text-[30px] text-primary-deep">
          Bibliothèque
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          Toutes les leçons restent lisibles et quizzables (5 pts/bonne
          réponse). Rattraper celle d&apos;hier peut sauver ton streak — 1
          joker par semaine.
        </p>
      </div>

      <ul className="space-y-2.5">
        {(lessons ?? []).map((lesson) => {
          const p = progressByLesson.get(lesson.id);
          const done = Boolean(p?.quiz_completed_at);
          const isToday = lesson.date === today;
          const score = p?.score ?? 0;
          return (
            <li key={lesson.id}>
              <Link
                href={isToday ? "/" : `/lecon/${lesson.id}`}
                className={`flex items-center gap-3 rounded-[18px] bg-card p-3.5 transition active:scale-[0.99] ${
                  isToday ? "border-2 border-primary" : "shadow-card"
                }`}
                style={
                  isToday
                    ? { boxShadow: "0 4px 0 var(--primary-ring)" }
                    : undefined
                }
              >
                <DomainDot domain={lesson.domain} />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[9.5px] font-bold uppercase tracking-[0.14em] ${
                      isToday ? "text-primary" : "text-ink-warm"
                    }`}
                  >
                    {lesson.domain} ·{" "}
                    {new Intl.DateTimeFormat("fr-FR", {
                      day: "numeric",
                      month: "short",
                    }).format(new Date(lesson.date + "T12:00:00Z"))}
                    {isToday && " · aujourd'hui"}
                  </p>
                  <p className="font-display truncate text-[17px] text-ink">
                    {lesson.title}
                  </p>
                </div>
                {isToday && !done ? (
                  <span className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                    Lire
                  </span>
                ) : done ? (
                  score >= 70 ? (
                    <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[12.5px] font-bold tabular-nums text-primary">
                      {score}{" "}
                      <span className="text-[8px] uppercase tracking-[0.1em]">
                        pts
                      </span>
                    </span>
                  ) : (
                    <span className="shrink-0 text-[12.5px] font-bold tabular-nums text-ink-soft">
                      {score}{" "}
                      <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                        pts
                      </span>
                    </span>
                  )
                ) : (
                  <span className="shrink-0 rounded-full border-[1.5px] border-accent px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
                    À lire
                  </span>
                )}
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
