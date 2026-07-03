"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

function shuffled(item: ReviewItem): { choices: string[]; answerIdx: number } {
  const order = item.choices
    .map((_, i) => i)
    .sort(() => Math.random() - 0.5);
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
      <div className="flex flex-col items-center gap-5 pt-16 text-center">
        <span className="text-6xl" aria-hidden>
          {result.correct === result.reviewed ? "🌟" : "🌱"}
        </span>
        <h1 className="text-2xl font-bold">Révisions terminées</h1>
        <div className="flex gap-3">
          <div className="rounded-2xl bg-white px-6 py-4 shadow-sm dark:bg-stone-900">
            <p className="text-3xl font-bold tabular-nums">
              {result.correct}/{result.reviewed}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              réussies
            </p>
          </div>
          <div className="rounded-2xl bg-white px-6 py-4 shadow-sm dark:bg-stone-900">
            <p className="text-3xl font-bold tabular-nums">
              +{result.points}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">points</p>
          </div>
        </div>
        {result.acquired > 0 && (
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            🎓 {result.acquired} notion{result.acquired > 1 ? "s" : ""}{" "}
            définitivement acquise{result.acquired > 1 ? "s" : ""} !
          </p>
        )}
        <p className="max-w-xs text-balance text-sm text-stone-500 dark:text-stone-400">
          Les cartes réussies reviendront plus tard, les ratées dans 2 jours.
        </p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex flex-col items-center gap-4 pt-20 text-center">
        <span className="text-5xl" aria-hidden>
          🔁
        </span>
        <h1 className="text-2xl font-bold">
          {items.length} carte{items.length > 1 ? "s" : ""} à réviser
        </h1>
        <p className="max-w-xs text-balance text-stone-500 dark:text-stone-400">
          2 minutes pour ancrer ce que tu as appris — 5 points par bonne
          réponse.
        </p>
        <button
          onClick={() => setStarted(true)}
          className="mt-2 min-h-12 rounded-full bg-orange-600 px-8 py-3 font-semibold text-white shadow-md transition active:scale-95"
        >
          C&apos;est parti
        </button>
      </div>
    );
  }

  const item = items[index];
  const variant = variants[index];
  const answered = selected !== null;

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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
          Carte {index + 1}/{items.length}
        </p>
        <p className="text-xs text-stone-400">{item.label}</p>
      </div>

      <h2 className="text-xl font-bold leading-snug">{item.prompt}</h2>

      <div className="space-y-2.5">
        {variant.choices.map((choice, i) => {
          let style =
            "border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900";
          if (answered) {
            if (i === variant.answerIdx) {
              style =
                "border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-950/50";
            } else if (i === selected) {
              style =
                "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/50";
            } else {
              style =
                "border-stone-200 bg-white opacity-50 dark:border-stone-700 dark:bg-stone-900";
            }
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setSelected(i)}
              className={`block min-h-13 w-full rounded-2xl border-2 p-3.5 text-left leading-snug transition active:scale-[0.98] ${style}`}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="rounded-2xl bg-stone-100 p-4 text-[15px] leading-relaxed dark:bg-stone-800">
          <p className="font-semibold">
            {selected === variant.answerIdx ? "✅ Toujours acquis !" : "❌ À retravailler"}
          </p>
          <p className="mt-1">{item.explanation}</p>
        </div>
      )}

      {answered && (
        <button
          onClick={next}
          disabled={submitting}
          className="min-h-13 w-full rounded-full bg-orange-600 px-6 py-3.5 text-lg font-semibold text-white shadow-md transition active:scale-95 disabled:opacity-60"
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
