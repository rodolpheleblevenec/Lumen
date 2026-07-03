"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Repeat2 } from "lucide-react";
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
      <div className="animate-fade-up flex flex-col items-center gap-5 pt-16 text-center">
        <span className="text-6xl" aria-hidden>
          {result.correct === result.reviewed ? "🌟" : "🌱"}
        </span>
        <h1 className="font-display text-2xl font-semibold">
          Révisions terminées
        </h1>
        <div className="flex gap-3">
          <div className="rounded-2xl border border-line bg-card px-6 py-4">
            <p className="font-display text-3xl font-semibold tabular-nums">
              {result.correct}/{result.reviewed}
            </p>
            <p className="text-xs text-ink-soft">réussies</p>
          </div>
          <div className="rounded-2xl border border-line bg-card px-6 py-4">
            <p className="font-display text-3xl font-semibold tabular-nums">
              +{result.points}
            </p>
            <p className="text-xs text-ink-soft">points</p>
          </div>
        </div>
        {result.acquired > 0 && (
          <p className="text-sm font-medium text-good">
            🎓 {result.acquired} notion{result.acquired > 1 ? "s" : ""}{" "}
            définitivement acquise{result.acquired > 1 ? "s" : ""} !
          </p>
        )}
        <p className="max-w-xs text-balance text-sm text-ink-soft">
          Les cartes réussies reviendront plus tard, les ratées dans 2 jours.
        </p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="animate-fade-up flex flex-col items-center gap-4 pt-20 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft">
          <Repeat2 size={32} className="text-accent-strong" aria-hidden />
        </span>
        <h1 className="font-display text-2xl font-semibold">
          {items.length} carte{items.length > 1 ? "s" : ""} à réviser
        </h1>
        <p className="max-w-xs text-balance text-ink-soft">
          2 minutes pour ancrer ce que tu as appris — 5 points par bonne
          réponse.
        </p>
        <button
          onClick={() => setStarted(true)}
          className="glow-accent mt-2 min-h-12 rounded-full bg-accent px-8 py-3 font-semibold text-on-accent transition active:scale-95"
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
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">
          Carte {index + 1}/{items.length}
        </p>
        <p className="max-w-[50%] truncate text-xs text-ink-soft">
          {item.label}
        </p>
      </div>

      <h2 className="font-display text-[22px] font-semibold leading-snug">
        {item.prompt}
      </h2>

      <div className="space-y-2.5">
        {variant.choices.map((choice, i) => {
          let style = "border-line bg-card";
          let anim = "";
          if (answered) {
            if (i === variant.answerIdx) {
              style = "border-good bg-good-soft";
              if (i === selected) anim = "animate-pop";
            } else if (i === selected) {
              style = "border-bad bg-bad-soft";
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
              className={`block min-h-13 w-full rounded-2xl border-2 p-3.5 text-left leading-snug transition active:scale-[0.98] ${style} ${anim}`}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="animate-fade-up rounded-2xl bg-card-soft p-4 text-[15px] leading-relaxed">
          <p className="font-semibold">
            {selected === variant.answerIdx
              ? "✅ Toujours acquis !"
              : "❌ À retravailler"}
          </p>
          <p className="mt-1">{item.explanation}</p>
        </div>
      )}

      {answered && (
        <button
          onClick={next}
          disabled={submitting}
          className="glow-accent min-h-13 w-full rounded-full bg-accent px-6 py-3.5 text-lg font-semibold text-on-accent transition active:scale-95 disabled:opacity-60"
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
