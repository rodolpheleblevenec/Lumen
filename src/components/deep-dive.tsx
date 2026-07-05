"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, Loader2, Pickaxe } from "lucide-react";
import { deepenSection } from "@/app/(app)/actions";

export type DiveSection = { key: string; title: string };

/** Extrait les parties « creusables » d'une leçon : ses sections + l'anecdote. */
export function diveSections(bodyMd: string, hasAnecdote: boolean): DiveSection[] {
  const sections = [...bodyMd.matchAll(/^##\s+(.+)$/gm)].map((m, i) => ({
    key: `section-${i}`,
    title: m[1].trim(),
  }));
  if (hasAnecdote) sections.push({ key: "anecdote", title: "L'anecdote" });
  return sections;
}

/**
 * « Creuser cette leçon » : approfondissement généré au clic (jamais en
 * avance) et partagé au cercle. L'utilisateur choisit la partie à cibler.
 */
export function DeepDive({
  lessonId,
  sections,
}: {
  lessonId: string;
  sections: DiveSection[];
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [contents, setContents] = useState<Record<string, string>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [, startTransition] = useTransition();

  if (!sections.length) return null;

  function dig(section: DiveSection) {
    if (contents[section.key]) {
      setOpen(open === section.key ? null : section.key);
      return;
    }
    setError(false);
    setLoadingKey(section.key);
    startTransition(async () => {
      try {
        const { content } = await deepenSection(lessonId, section.key, section.title);
        setContents((c) => ({ ...c, [section.key]: content }));
        setOpen(section.key);
      } catch {
        setError(true);
      } finally {
        setLoadingKey(null);
      }
    });
  }

  return (
    <section className="w-full space-y-3 text-left">
      <div className="flex items-center gap-2">
        <Pickaxe size={16} className="text-primary" aria-hidden />
        <h2 className="text-[13.5px] font-bold">Creuser cette leçon</h2>
      </div>
      <p className="text-xs text-ink-soft">
        Choisis une partie : Lumen rédige un approfondissement, partagé avec
        tout le cercle.
      </p>
      <div className="space-y-2">
        {sections.map((s) => {
          const isOpen = open === s.key;
          const isLoading = loadingKey === s.key;
          return (
            <div key={s.key}>
              <button
                onClick={() => dig(s)}
                disabled={loadingKey !== null}
                className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-2.5 text-left text-sm font-medium transition active:scale-[0.99] disabled:opacity-60 ${
                  isOpen ? "border-primary bg-primary-soft" : "border-line bg-card"
                }`}
              >
                {s.title}
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin text-primary" aria-hidden />
                ) : (
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-ink-faint transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                )}
              </button>
              {isOpen && contents[s.key] && (
                <div className="animate-fade-up prose-lesson space-y-3 rounded-2xl bg-card-tint p-4 mt-2 !text-[14.5px]">
                  <ReactMarkdown>{contents[s.key]}</ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {loadingKey && (
        <p className="text-xs text-ink-faint">
          Rédaction en cours, une quinzaine de secondes…
        </p>
      )}
      {error && (
        <p className="text-xs font-medium text-bad">
          La rédaction a échoué, réessaie dans un instant.
        </p>
      )}
    </section>
  );
}
