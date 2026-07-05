"use client";

import { useState, useTransition } from "react";
import { Check, Vote } from "lucide-react";
import { voteTheme } from "@/app/(app)/actions";

type Option = { title: string; pitch: string; episodes?: string[] };

/**
 * Vote du thème « Carte blanche » de dimanche, ou de la série « fil
 * rouge » du mois (options à 4 épisodes) : affiché du jeudi au samedi,
 * un vote par personne, résultats visibles après avoir voté.
 */
export function ThemeVote({
  pollId,
  options,
  myVote,
  tallies,
  sundayLabel,
  kind = "sunday",
}: {
  pollId: string;
  options: Option[];
  myVote: number | null;
  tallies: number[];
  sundayLabel: string;
  kind?: "sunday" | "series";
}) {
  const [voted, setVoted] = useState<number | null>(myVote);
  const [counts, setCounts] = useState(tallies);
  const [pending, startTransition] = useTransition();
  const hasVoted = voted !== null;
  const total = counts.reduce((a, b) => a + b, 0);

  function vote(idx: number) {
    if (hasVoted || pending) return;
    setVoted(idx);
    setCounts((c) => c.map((n, i) => (i === idx ? n + 1 : n)));
    startTransition(() => voteTheme(pollId, idx).catch(() => setVoted(null)));
  }

  return (
    <section className="rounded-[22px] bg-card-tint px-[22px] py-5">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
        <Vote size={12} aria-hidden />{" "}
        {kind === "series" ? `Fil rouge · ${sundayLabel}` : `Carte blanche · ${sundayLabel}`}
      </p>
      <h2 className="font-display mt-2 text-[22px] text-primary-deep">
        {hasVoted
          ? "Le cercle vote…"
          : kind === "series"
            ? "Choisis la série du mois"
            : "Choisis le thème de dimanche"}
      </h2>
      <div className="mt-3 space-y-2">
        {options.map((o, i) => {
          const mine = voted === i;
          return (
            <button
              key={i}
              onClick={() => vote(i)}
              disabled={hasVoted || pending}
              className={`flex w-full items-start justify-between gap-3 rounded-2xl border-2 bg-card px-4 py-3 text-left transition active:scale-[0.99] ${
                mine ? "border-primary" : "border-transparent"
              } ${hasVoted && !mine ? "opacity-70" : ""}`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{o.title}</span>
                <span className="block text-xs text-ink-soft">{o.pitch}</span>
                {o.episodes && (
                  <span className="mt-1.5 block space-y-0.5">
                    {o.episodes.map((ep, j) => (
                      <span key={j} className="block truncate text-[11px] text-ink-faint">
                        <span className="font-bold text-primary">{j + 1}.</span> {ep}
                      </span>
                    ))}
                  </span>
                )}
              </span>
              {hasVoted ? (
                <span className="flex shrink-0 items-center gap-1.5">
                  {mine && (
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-white">
                      <Check size={11} strokeWidth={3} aria-hidden />
                    </span>
                  )}
                  <span className="text-xs font-bold tabular-nums text-primary">
                    {counts[i]}
                  </span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {hasVoted && (
        <p className="mt-2.5 text-[11px] text-ink-soft">
          {total} vote{total > 1 ? "s" : ""} ·{" "}
          {kind === "series"
            ? "la série gagnante occupera les 4 dimanches du mois."
            : "le thème gagnant sera généré dimanche à l'aube."}
        </p>
      )}
    </section>
  );
}
