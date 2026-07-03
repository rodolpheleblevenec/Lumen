"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Clock, Lightbulb, Sparkles, Flame, BellRing } from "lucide-react";
import { completeQuiz, type QuizResult } from "@/app/(app)/actions";
import { NotificationsToggle } from "@/components/notifications-toggle";

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

type Validator = { display_name: string; avatar_url: string | null };

type Phase = "reading" | "quiz" | "bonus-intro" | "done";

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* non supporté : tant pis */
  }
}

/** Compteur animé (points) */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function LessonBody({ body }: { body: string }) {
  return (
    <div className="prose-lesson space-y-4">
      <ReactMarkdown
        components={{
          h2: (props) => <h2 {...props} />,
          ul: (props) => <ul className="list-disc space-y-1 pl-5" {...props} />,
          strong: (props) => <strong className="font-semibold" {...props} />,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}

export function LessonFlow({
  lesson,
  dateLabel,
  questions,
  initialDone,
  initialScore,
  mode = "today",
  readingMinutes,
  others = [],
}: {
  lesson: LessonData;
  dateLabel: string;
  questions: QuizQuestion[];
  initialDone: boolean;
  initialScore: number;
  mode?: "today" | "catchup";
  readingMinutes?: number;
  others?: Validator[];
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

  /* ── Barre de progression de lecture ── */
  const [readProgress, setReadProgress] = useState(0);
  useEffect(() => {
    if (phase !== "reading") return;
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setReadProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [phase]);

  /* ── Confetti sur sans-faute ── */
  const celebrated = useRef(false);
  useEffect(() => {
    if (
      phase === "done" &&
      result &&
      !result.alreadyDone &&
      result.points >= 70 &&
      !celebrated.current
    ) {
      celebrated.current = true;
      import("canvas-confetti").then(({ default: confetti }) => {
        const colors = ["#a16207", "#e3a83b", "#fbf7ee", "#7c4a05"];
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors });
        setTimeout(
          () => confetti({ particleCount: 50, spread: 100, origin: { y: 0.4 }, colors }),
          350
        );
      });
      buzz([40, 60, 40]);
    }
  }, [phase, result]);

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
      window.scrollTo({ top: 0 });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function selectAnswer(i: number) {
    setSelected(i);
    buzz(i === question.answerIdx ? 18 : [30, 40, 30]);
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
      <article className="space-y-6">
        {/* Progression de lecture — sticky en haut de l'écran */}
        <div className="sticky top-0 z-20 -mx-5 h-1 bg-line/40">
          <div
            className="bg-sun h-full transition-[width] duration-150"
            style={{ width: `${readProgress * 100}%` }}
          />
        </div>

        <header className="space-y-3">
          <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-accent">
            {lesson.domain} · {dateLabel}
          </p>
          <h1 className="font-display text-[28px] font-semibold leading-[1.15] text-balance">
            {lesson.title}
          </h1>
          <div className="flex items-center gap-3 text-[13px] text-ink-soft">
            <span className="flex items-center gap-1">
              <Clock size={14} aria-hidden /> {readingMinutes ?? 5} min de lecture
            </span>
            {mode === "catchup" && (
              <span className="rounded-full bg-card-soft px-2.5 py-0.5 font-medium">
                Rattrapage · 5 pts/réponse
              </span>
            )}
          </div>
          {others.length > 0 && (
            <div className="flex items-center gap-2 text-[13px] text-ink-soft">
              <span className="flex -space-x-2">
                {others.slice(0, 4).map((o, i) =>
                  o.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={o.avatar_url}
                      alt={o.display_name}
                      referrerPolicy="no-referrer"
                      className="h-6 w-6 rounded-full border-2 border-card"
                    />
                  ) : (
                    <span
                      key={i}
                      className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-accent-soft text-[10px] font-bold text-accent-strong"
                    >
                      {o.display_name.charAt(0).toUpperCase()}
                    </span>
                  )
                )}
              </span>
              {others.length === 1
                ? `${others[0].display_name} a déjà validé`
                : `${others.length} ont déjà validé aujourd'hui`}
            </div>
          )}
        </header>

        <p className="font-display text-[19px] font-medium leading-relaxed text-ink">
          {lesson.hook}
        </p>

        <LessonBody body={lesson.body_md} />

        {lesson.anecdote && (
          <aside className="rounded-2xl bg-accent-soft/60 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Lightbulb size={15} aria-hidden /> L&apos;anecdote
            </p>
            <p className="prose-lesson mt-1.5 !text-[1rem]">{lesson.anecdote}</p>
          </aside>
        )}

        {lesson.flex_phrase && (
          <aside className="rounded-2xl border border-accent/30 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles size={15} aria-hidden /> Pour briller
            </p>
            <p className="prose-lesson mt-1.5 italic !text-[1rem]">
              « {lesson.flex_phrase} »
            </p>
          </aside>
        )}

        <button
          onClick={() => {
            setPhase("quiz");
            window.scrollTo({ top: 0 });
          }}
          className="min-h-13 w-full glow-accent rounded-full bg-accent px-6 py-3.5 text-lg font-semibold text-on-accent transition active:scale-95"
        >
          Passer au quiz →
        </button>
      </article>
    );
  }

  /* ─── Interstitiel bonus ─── */
  if (phase === "bonus-intro") {
    return (
      <div className="animate-fade-up flex flex-col items-center gap-4 pt-24 text-center">
        <span className="animate-pop text-6xl" aria-hidden>
          🎉
        </span>
        <h2 className="font-display text-2xl font-semibold">Sans-faute !</h2>
        <p className="max-w-xs text-balance text-ink-soft">
          2 questions bonus débloquées — plus dures, mais 20 points chacune.
        </p>
        <button
          onClick={() => setPhase("quiz")}
          className="glow-accent mt-2 min-h-12 rounded-full bg-accent px-8 py-3 font-semibold text-on-accent transition active:scale-95"
        >
          Je tente !
        </button>
      </div>
    );
  }

  /* ─── Écran de fin ─── */
  if (phase === "done") {
    return (
      <DoneScreen
        lesson={lesson}
        result={result}
        mode={mode}
      />
    );
  }

  /* ─── Quiz ─── */
  const answered = selected !== null;
  const isBonus = question.tier === "bonus";
  const progressLabel = isBonus
    ? `Bonus ${qIndex - 2}/2`
    : `Question ${qIndex + 1}/3`;

  return (
    <div key={qIndex} className="animate-slide-in space-y-5">
      <div className="flex items-center justify-between">
        <p
          className={`text-[13px] font-semibold uppercase tracking-[0.08em] ${
            isBonus ? "text-accent-strong" : "text-accent"
          }`}
        >
          {progressLabel} {isBonus && "· 20 pts"}
        </p>
        <div className="flex gap-1.5" aria-hidden>
          {[0, 1, 2, 3, 4].slice(0, isBonus ? 5 : 3).map((i) => (
            <span
              key={i}
              className={`h-1.5 w-5 rounded-full ${
                i < qIndex ? "bg-accent" : i === qIndex ? "bg-accent/50" : "bg-line"
              }`}
            />
          ))}
        </div>
      </div>

      <h2 className="font-display text-[22px] font-semibold leading-snug">
        {question.prompt}
      </h2>

      <div className="space-y-2.5">
        {question.choices.map((choice, i) => {
          let style = "border-line bg-card";
          let anim = "";
          if (answered) {
            if (i === question.answerIdx) {
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
            {selected === question.answerIdx ? "✅ Exact !" : "❌ Raté…"}
          </p>
          <p className="mt-1">{question.explanation}</p>
        </div>
      )}

      {answered && (
        <button
          onClick={nextQuestion}
          disabled={submitting}
          className="min-h-13 w-full glow-accent rounded-full bg-accent px-6 py-3.5 text-lg font-semibold text-on-accent transition active:scale-95 disabled:opacity-60"
        >
          {submitting
            ? "Enregistrement…"
            : qIndex === 4 ||
                (qIndex === 2 &&
                  baseCorrectSoFar + (selected === question.answerIdx ? 1 : 0) < 3)
              ? "Voir mon score"
              : "Suivant →"}
        </button>
      )}
    </div>
  );
}

function DoneScreen({
  lesson,
  result,
  mode,
}: {
  lesson: LessonData;
  result: QuizResult | null;
  mode: "today" | "catchup";
}) {
  const points = result?.points ?? 0;
  const animatedPoints = useCountUp(result?.alreadyDone ? 0 : points);
  const displayPoints = result?.alreadyDone ? points : animatedPoints;
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  useEffect(() => {
    if (
      !result?.alreadyDone &&
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      setShowNotifPrompt(true);
    }
  }, [result]);

  return (
    <div className="animate-fade-up flex flex-col items-center gap-5 pt-10 text-center">
      <span className="text-6xl" aria-hidden>
        {result?.alreadyDone ? "✅" : points >= 70 ? "🏆" : "👏"}
      </span>
      <h1 className="font-display text-[26px] font-semibold">
        {result?.alreadyDone ? "Leçon validée" : "Quiz terminé !"}
      </h1>

      <div className="flex gap-3">
        <div className="rounded-2xl border border-line bg-card px-6 py-4">
          <p className="font-display text-3xl font-semibold tabular-nums">
            {displayPoints}
          </p>
          <p className="text-xs text-ink-soft">points</p>
        </div>
        {!result?.alreadyDone && mode === "today" && (
          <div className="rounded-2xl border border-line bg-card px-6 py-4">
            <p className="flex items-center justify-center gap-1 font-display text-3xl font-semibold tabular-nums">
              <Flame size={22} className="animate-flame text-accent" fill="currentColor" aria-hidden />
              {result?.streak ?? 0}
            </p>
            <p className="text-xs text-ink-soft">streak</p>
          </div>
        )}
      </div>

      {result?.streakSaved && (
        <p className="max-w-xs text-balance font-medium text-good">
          🃏 Joker utilisé : ton streak est sauvé !
        </p>
      )}

      {lesson.flex_phrase && (
        <aside className="w-full rounded-2xl border border-accent/30 p-4 text-left">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles size={15} aria-hidden /> À ressortir ce soir
          </p>
          <p className="prose-lesson mt-1.5 italic !text-[1rem]">
            « {lesson.flex_phrase} »
          </p>
        </aside>
      )}

      <p className="max-w-xs text-balance text-sm text-ink-soft">
        {mode === "catchup"
          ? "Les 5 notions de cette leçon rejoignent tes révisions."
          : "Les 5 notions du jour reviendront en révision dans 2 jours. À demain ! 🌅"}
      </p>

      {showNotifPrompt && (
        <div className="w-full space-y-2 rounded-2xl bg-card-soft p-4 text-left">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <BellRing size={15} aria-hidden /> Ne rate pas ton streak
          </p>
          <p className="text-[13px] text-ink-soft">
            Reçois la leçon chaque matin à 8h.
          </p>
          <NotificationsToggle />
        </div>
      )}

      <details className="w-full pt-2 text-left">
        <summary className="cursor-pointer text-sm font-medium text-accent">
          Relire la leçon
        </summary>
        <div className="mt-4 space-y-4">
          <h2 className="font-display text-xl font-semibold">{lesson.title}</h2>
          <LessonBody body={lesson.body_md} />
        </div>
      </details>
    </div>
  );
}
