"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Timer } from "lucide-react";
import { playDuel } from "@/app/(app)/actions";

type PlayQuestion = { prompt: string; choices: string[] };

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* non supporté */
  }
}

/**
 * Manche de duel : 5 questions, pas de feedback avant la fin (la bonne
 * réponse n'est jamais envoyée au client), le temps par question compte.
 */
export function DuelPlay({
  duelId,
  questions,
  opponentName,
}: {
  duelId: string;
  questions: PlayQuestion[];
  opponentName: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(-1); // -1 = écran de départ
  const [answers, setAnswers] = useState<number[]>([]);
  const [timesMs, setTimesMs] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const shownAt = useRef(0);
  const [, startTransition] = useTransition();

  function start() {
    setIndex(0);
    shownAt.current = performance.now();
  }

  function answer(i: number) {
    // Handler de clic : lire l'horloge ici est le but (temps de réponse)
    // eslint-disable-next-line react-hooks/purity
    const elapsed = performance.now() - shownAt.current;
    const nextAnswers = [...answers, i];
    const nextTimes = [...timesMs, elapsed];
    buzz(12);

    if (index + 1 < questions.length) {
      setAnswers(nextAnswers);
      setTimesMs(nextTimes);
      setIndex(index + 1);
      // eslint-disable-next-line react-hooks/purity
      shownAt.current = performance.now();
    } else {
      setSubmitting(true);
      startTransition(async () => {
        const res = await playDuel(duelId, nextAnswers, nextTimes);
        if (!res.ok) {
          setError(res.error);
          setSubmitting(false);
          return;
        }
        router.refresh();
      });
    }
  }

  if (index === -1) {
    return (
      <div className="animate-fade-up flex flex-col items-center gap-4 pt-16 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-accent-soft">
          <Timer size={38} className="text-accent" aria-hidden />
        </span>
        <h1 className="font-display text-[34px] text-primary-deep">
          À toi de jouer
        </h1>
        <p className="max-w-xs text-[15px] text-balance text-ink-soft">
          5 questions face à {opponentName}. Pas de correction avant la fin,
          et en cas d&apos;égalité c&apos;est le plus rapide qui gagne :
          réponds vite.
        </p>
        <button
          onClick={start}
          className="push-cta mt-2 min-h-12 rounded-full bg-accent px-10 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-white"
        >
          C&apos;est parti
        </button>
      </div>
    );
  }

  if (submitting) {
    return (
      <p className="animate-fade-up pt-24 text-center text-ink-soft">
        Enregistrement de ta manche…
      </p>
    );
  }

  const q = questions[index];
  return (
    <div key={index} className="animate-slide-in space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
          Duel · question {index + 1}/{questions.length}
        </p>
        <div className="flex gap-1.5" aria-hidden>
          {questions.map((_, i) => (
            <span
              key={i}
              className="h-1.5 w-[22px] rounded-full"
              style={{
                background:
                  i < index
                    ? "var(--accent)"
                    : i === index
                      ? "rgba(226,84,58,.45)"
                      : "var(--line)",
              }}
            />
          ))}
        </div>
      </div>

      <h2 className="font-display text-[26px] leading-[1.25] text-primary-deep lg:text-[30px]">
        {q.prompt}
      </h2>

      <div className="space-y-2.5">
        {q.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => answer(i)}
            className="flex min-h-13 w-full items-center rounded-2xl border-2 border-line bg-card px-4 py-3.5 text-left text-[15px] leading-snug transition active:scale-[0.98]"
          >
            {choice}
          </button>
        ))}
      </div>

      {error && <p className="text-sm font-medium text-bad">{error}</p>}
    </div>
  );
}
