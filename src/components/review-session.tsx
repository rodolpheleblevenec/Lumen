"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, GraduationCap, Repeat2, X } from "lucide-react";
import {
  completeReview,
  type ReviewOutcome,
  type ReviewResult,
} from "@/app/(app)/actions";

type ReviewItem = {
  notionId: string;
  label: string;
  level: number;
  prompt: string;
  choices: string[];
  answerIdx: number;
  explanation: string;
};

/** Échéance à laquelle une carte de ce niveau était due. */
const LEVEL_INTERVAL: Record<number, number> = { 0: 2, 1: 7, 2: 30, 3: 90 };

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* non supporté */
  }
}

function shuffled(item: ReviewItem): { choices: string[]; answerIdx: number } {
  const order = item.choices.map((_, i) => i).sort(() => Math.random() - 0.5);
  return {
    choices: order.map((i) => item.choices[i]),
    answerIdx: order.indexOf(item.answerIdx),
  };
}

export function ReviewSession({ items }: { items: ReviewItem[] }) {
  const router = useRouter();
  // Ordre des choix mélangé une fois par session (PRD §4.3)
  const variants = useMemo(() => items.map(shuffled), [items]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [outcomes, setOutcomes] = useState<ReviewOutcome[]>([]);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);

  if (result) {
    return (
      <div className="animate-fade-up flex flex-col items-center gap-5 pt-14 text-center">
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Session terminée
          </p>
          <h1 className="font-display text-[34px] text-primary-deep">
            Révisions terminées
          </h1>
        </div>
        <div className="grid w-full grid-cols-2 gap-3">
          <div className="shadow-card rounded-[18px] bg-card px-6 py-4">
            <p className="font-display text-[38px] tabular-nums text-primary">
              {result.correct}
              <span className="text-[22px] text-ink-faint">/{result.reviewed}</span>
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
              Réussies
            </p>
          </div>
          <div className="shadow-card rounded-[18px] bg-card px-6 py-4">
            <p className="font-display text-[38px] tabular-nums text-accent">
              +{result.points}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
              Points
            </p>
          </div>
        </div>
        {result.acquired > 0 && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-good">
            <GraduationCap size={16} aria-hidden />
            {result.acquired} notion{result.acquired > 1 ? "s" : ""}{" "}
            définitivement acquise{result.acquired > 1 ? "s" : ""} !
          </p>
        )}
        <p className="max-w-xs text-balance text-[12.5px] text-ink-faint">
          Les cartes réussies reviendront plus tard, les ratées dans 2 jours.
        </p>
      </div>
    );
  }

  if (!started) {
    // Répartition des cartes dues par échéance (J+2, J+7, …)
    const byInterval = new Map<number, number>();
    for (const item of items) {
      const interval = LEVEL_INTERVAL[item.level] ?? 2;
      byInterval.set(interval, (byInterval.get(interval) ?? 0) + 1);
    }
    const chips = [...byInterval.entries()].sort(([a], [b]) => a - b);

    return (
      <div className="animate-fade-up flex flex-col items-center gap-4 pt-16 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft">
          <Repeat2 size={38} className="text-primary" aria-hidden />
        </span>
        <h1 className="font-display text-[34px] text-primary-deep">
          {items.length} carte{items.length > 1 ? "s" : ""} à réviser
        </h1>
        <p className="max-w-xs text-[15px] text-balance text-ink-soft">
          2 minutes pour ancrer ce que tu as appris —{" "}
          <strong className="font-bold text-primary">5 points</strong> par
          bonne réponse.
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {chips.map(([interval, count]) => (
            <span
              key={interval}
              className="shadow-card rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-ink-soft"
            >
              {count} × J+{interval}
            </span>
          ))}
        </div>
        <button
          onClick={() => setStarted(true)}
          className="push-cta-primary mt-2 min-h-12 rounded-full bg-primary px-10 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-white"
        >
          C&apos;est parti
        </button>
      </div>
    );
  }

  const item = items[index];
  const variant = variants[index];
  const answered = selected !== null;

  function selectAnswer(i: number) {
    setSelected(i);
    buzz(i === variant.answerIdx ? 18 : [30, 40, 30]);
  }

  async function next() {
    const updated = [
      ...outcomes,
      { notionId: item.notionId, correct: selected === variant.answerIdx },
    ];
    setOutcomes(updated);
    setSelected(null);

    if (index + 1 < items.length) {
      setIndex(index + 1);
    } else {
      setSubmitting(true);
      try {
        const res = await completeReview(updated);
        setResult(res);
        router.refresh();
      } finally {
        setSubmitting(false);
      }
    }
  }

  return (
    <div key={index} className="animate-slide-in space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
          Carte {index + 1}/{items.length}
        </p>
        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
          Niveau {item.level + 1} · J+{LEVEL_INTERVAL[item.level] ?? 2}
        </span>
      </div>

      <div className="space-y-1.5">
        <p className="truncate text-[11.5px] text-ink-faint">{item.label}</p>
        <h2 className="font-display text-[26px] leading-[1.25] text-primary-deep">
          {item.prompt}
        </h2>
      </div>

      <div className="space-y-2.5">
        {variant.choices.map((choice, i) => {
          let style = "border-line bg-card";
          let anim = "";
          let mark: "good" | "bad" | null = null;
          if (answered) {
            if (i === variant.answerIdx) {
              style = "border-good bg-good-soft";
              mark = "good";
              if (i === selected) anim = "animate-pop";
            } else if (i === selected) {
              style = "border-bad bg-bad-soft";
              mark = "bad";
              anim = "animate-shake";
            } else {
              style = "border-line bg-card opacity-45";
            }
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => selectAnswer(i)}
              className={`flex min-h-13 w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-[15px] leading-snug transition active:scale-[0.98] ${style} ${anim}`}
            >
              {choice}
              {mark && (
                <span
                  className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-white ${
                    mark === "good" ? "bg-good" : "bg-bad"
                  }`}
                  aria-hidden
                >
                  {mark === "good" ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <X size={14} strokeWidth={3} />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="animate-fade-up rounded-2xl bg-card-tint p-4">
          <p
            className={`text-[13px] font-bold ${
              selected === variant.answerIdx ? "text-good" : "text-accent"
            }`}
          >
            {selected === variant.answerIdx
              ? "Toujours acquis !"
              : "À retravailler"}
          </p>
          <p className="mt-1 text-sm leading-[1.6] text-ink-body">
            {item.explanation}
            {selected !== variant.answerIdx &&
              " Cette carte reviendra dans 2 jours."}
          </p>
        </div>
      )}

      {answered && (
        <button
          onClick={next}
          disabled={submitting}
          className="push-cta min-h-13 w-full rounded-full bg-accent px-6 py-[17px] text-sm font-bold uppercase tracking-[0.14em] text-white disabled:opacity-60"
        >
          {submitting
            ? "Enregistrement…"
            : index + 1 < items.length
              ? "Suivant →"
              : "Terminer"}
        </button>
      )}
    </div>
  );
}
