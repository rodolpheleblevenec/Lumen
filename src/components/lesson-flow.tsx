"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { completeQuiz, type QuizResult } from "@/app/(app)/actions";

type QuizQuestion = {
  id: string;
  tier: "base" | "bonus";
  prompt: string;
  choices: string[];
  answerIdx: number;
  explanation: string;
};

type LessonData = {
  id: string;
  domain: string;
  title: string;
  hook: string;
  body_md: string;
  anecdote: string | null;
  flex_phrase: string | null;
};

type Phase = "reading" | "quiz" | "bonus-intro" | "done";

export function LessonFlow({
  lesson,
  dateLabel,
  questions,
  initialDone,
  initialScore,
}: {
  lesson: LessonData;
  dateLabel: string;
  questions: QuizQuestion[];
  initialDone: boolean;
  initialScore: number;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(initialDone ? "done" : "reading");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(5).fill(-1));
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult | null>(
    initialDone
      ? { baseCorrect: 0, bonusCorrect: 0, points: initialScore, streak: 0, alreadyDone: true }
      : null
  );
  const [submitting, setSubmitting] = useState(false);

  const question = questions[qIndex];
  const baseCorrectSoFar = questions
    .slice(0, 3)
    .filter((q, i) => answers[i] === q.answerIdx).length;

  async function finishQuiz(finalAnswers: number[]) {
    setSubmitting(true);
    try {
      const res = await completeQuiz(lesson.id, finalAnswers);
      setResult(res);
      setPhase("done");
      router.refresh(); // met à jour le streak du header
    } finally {
      setSubmitting(false);
    }
  }

  function nextQuestion() {
    const updated = [...answers];
    updated[qIndex] = selected ?? -1;
    setAnswers(updated);
    setSelected(null);

    if (qIndex === 2) {
      const allBase = questions
        .slice(0, 3)
        .every((q, i) => updated[i] === q.answerIdx);
      if (allBase) {
        setPhase("bonus-intro");
        setQIndex(3);
      } else {
        void finishQuiz(updated);
      }
    } else if (qIndex === 4) {
      void finishQuiz(updated);
    } else {
      setQIndex(qIndex + 1);
    }
  }

  /* ─── Lecture ─── */
  if (phase === "reading") {
    return (
      <article className="space-y-5">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-orange-600 dark:text-orange-400">
            {lesson.domain} · {dateLabel}
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-snug">
            {lesson.title}
          </h1>
        </div>

        <p className="text-[17px] font-medium leading-relaxed text-stone-700 dark:text-stone-200">
          {lesson.hook}
        </p>

        <div className="space-y-4 text-[16px] leading-relaxed">
          <ReactMarkdown
            components={{
              h2: (props) => (
                <h2 className="pt-2 text-lg font-bold" {...props} />
              ),
              p: (props) => <p {...props} />,
              ul: (props) => (
                <ul className="list-disc space-y-1 pl-5" {...props} />
              ),
              strong: (props) => (
                <strong className="font-semibold" {...props} />
              ),
            }}
          >
            {lesson.body_md}
          </ReactMarkdown>
        </div>

        {lesson.anecdote && (
          <aside className="rounded-2xl bg-amber-100/70 p-4 dark:bg-amber-950/40">
            <p className="text-sm font-semibold">💡 L&apos;anecdote</p>
            <p className="mt-1 leading-relaxed">{lesson.anecdote}</p>
          </aside>
        )}

        {lesson.flex_phrase && (
          <aside className="rounded-2xl border border-orange-200 p-4 dark:border-orange-900">
            <p className="text-sm font-semibold">✨ Pour briller</p>
            <p className="mt-1 italic leading-relaxed">
              « {lesson.flex_phrase} »
            </p>
          </aside>
        )}

        <button
          onClick={() => setPhase("quiz")}
          className="min-h-13 w-full rounded-full bg-orange-600 px-6 py-3.5 text-lg font-semibold text-white shadow-md transition active:scale-95"
        >
          Passer au quiz →
        </button>
      </article>
    );
  }

  /* ─── Interstitiel bonus ─── */
  if (phase === "bonus-intro") {
    return (
      <div className="flex flex-col items-center gap-4 pt-24 text-center">
        <span className="text-6xl" aria-hidden>
          🎉
        </span>
        <h2 className="text-2xl font-bold">Sans-faute !</h2>
        <p className="max-w-xs text-balance text-stone-600 dark:text-stone-300">
          2 questions bonus débloquées — plus dures, mais 20 points chacune.
        </p>
        <button
          onClick={() => setPhase("quiz")}
          className="mt-2 min-h-12 rounded-full bg-orange-600 px-8 py-3 font-semibold text-white shadow-md transition active:scale-95"
        >
          Je tente !
        </button>
      </div>
    );
  }

  /* ─── Écran de fin ─── */
  if (phase === "done") {
    return (
      <div className="flex flex-col items-center gap-5 pt-16 text-center">
        <span className="text-6xl" aria-hidden>
          {result?.alreadyDone ? "✅" : (result?.points ?? 0) >= 70 ? "🏆" : "👏"}
        </span>
        <h1 className="text-2xl font-bold">
          {result?.alreadyDone
            ? "Leçon du jour validée"
            : "Quiz terminé !"}
        </h1>

        <div className="flex gap-3">
          <div className="rounded-2xl bg-white px-6 py-4 shadow-sm dark:bg-stone-900">
            <p className="text-3xl font-bold tabular-nums">
              {result?.points ?? 0}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">points</p>
          </div>
          {!result?.alreadyDone && (
            <div className="rounded-2xl bg-white px-6 py-4 shadow-sm dark:bg-stone-900">
              <p className="text-3xl font-bold tabular-nums">
                🔥 {result?.streak ?? 0}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                streak
              </p>
            </div>
          )}
        </div>

        <p className="max-w-xs text-balance text-sm text-stone-500 dark:text-stone-400">
          Les 5 notions du jour reviendront en révision dans 2 jours. À
          demain pour la prochaine leçon ! 🌅
        </p>

        <details className="w-full pt-4 text-left">
          <summary className="cursor-pointer text-sm font-medium text-orange-600 dark:text-orange-400">
            Relire la leçon
          </summary>
          <div className="mt-3 space-y-4 text-[16px] leading-relaxed">
            <h2 className="text-xl font-bold">{lesson.title}</h2>
            <ReactMarkdown
              components={{
                h2: (props) => (
                  <h2 className="pt-2 text-lg font-bold" {...props} />
                ),
                ul: (props) => (
                  <ul className="list-disc space-y-1 pl-5" {...props} />
                ),
              }}
            >
              {lesson.body_md}
            </ReactMarkdown>
          </div>
        </details>
      </div>
    );
  }

  /* ─── Quiz ─── */
  const answered = selected !== null;
  const isBonus = question.tier === "bonus";
  const progressLabel = isBonus
    ? `Bonus ${qIndex - 2}/2`
    : `Question ${qIndex + 1}/3`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p
          className={`text-sm font-semibold uppercase tracking-wide ${
            isBonus
              ? "text-purple-600 dark:text-purple-400"
              : "text-orange-600 dark:text-orange-400"
          }`}
        >
          {progressLabel} {isBonus && "· 20 pts"}
        </p>
        {!isBonus && (
          <p className="text-sm text-stone-400">{baseCorrectSoFar} ✓</p>
        )}
      </div>

      <h2 className="text-xl font-bold leading-snug">{question.prompt}</h2>

      <div className="space-y-2.5">
        {question.choices.map((choice, i) => {
          let style =
            "border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900";
          if (answered) {
            if (i === question.answerIdx) {
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
            {selected === question.answerIdx ? "✅ Exact !" : "❌ Raté…"}
          </p>
          <p className="mt-1">{question.explanation}</p>
        </div>
      )}

      {answered && (
        <button
          onClick={nextQuestion}
          disabled={submitting}
          className="min-h-13 w-full rounded-full bg-orange-600 px-6 py-3.5 text-lg font-semibold text-white shadow-md transition active:scale-95 disabled:opacity-60"
        >
          {submitting
            ? "Enregistrement…"
            : qIndex === 4 || (qIndex === 2 && baseCorrectSoFar + (selected === question.answerIdx ? 1 : 0) < 3)
              ? "Voir mon score"
              : "Suivant →"}
        </button>
      )}
    </div>
  );
}
