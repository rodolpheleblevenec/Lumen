"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Check, Clock, Flame, X } from "lucide-react";
import { completeQuiz, type QuizResult } from "@/app/(app)/actions";
import { NotificationsToggle } from "@/components/notifications-toggle";
import { AudioButton } from "@/components/audio-button";
import { DeepDive, diveSections } from "@/components/deep-dive";

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
  date_hook?: string | null;
  series_title?: string | null;
  series_episode?: number | null;
};

type Validator = { display_name: string; avatar_url: string | null };

type Phase = "reading" | "quiz" | "bonus-intro" | "done";

const emptySubscribe = () => () => {};

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
  audioUrl = null,
}: {
  lesson: LessonData;
  dateLabel: string;
  questions: QuizQuestion[];
  initialDone: boolean;
  initialScore: number;
  mode?: "today" | "catchup";
  readingMinutes?: number;
  others?: Validator[];
  audioUrl?: string | null;
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
        const colors = ["#4338ca", "#e2543a", "#e7e4fa", "#312a86"];
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
      // Les bonus n'existent que si la leçon a bien ses 5 questions
      if (allBase && questions.length === 5) {
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
        {/* Bloc domaine */}
        <header className="rounded-[22px] bg-card-tint px-[22px] py-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                {lesson.domain}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                <Clock size={11} aria-hidden /> {readingMinutes ?? 5} min
              </span>
              {lesson.series_title && (
                <span
                  className="max-w-[220px] truncate rounded-full bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-accent"
                  title={lesson.series_title}
                >
                  Fil rouge · ép. {lesson.series_episode}/4
                </span>
              )}
              {mode === "catchup" && (
                <span className="rounded-full bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                  Rattrapage · 5 pts/réponse
                </span>
              )}
            </div>
            <span className="shrink-0 text-xs text-ink-soft">{dateLabel}</span>
          </div>

          <h1 className="font-display mt-4 text-[33px] leading-[1.1] text-balance text-primary-deep lg:text-[40px]">
            {lesson.title}
          </h1>

          {lesson.date_hook && (
            <p className="mt-2 text-xs italic text-ink-soft">{lesson.date_hook}</p>
          )}

          <div className="mt-3">
            <AudioButton lessonId={lesson.id} initialUrl={audioUrl} />
          </div>

          {others.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
              <span className="flex -space-x-1.5">
                {others.slice(0, 4).map((o, i) =>
                  o.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={o.avatar_url}
                      alt={o.display_name}
                      referrerPolicy="no-referrer"
                      className="h-[22px] w-[22px] rounded-full border-2 border-card"
                    />
                  ) : (
                    <span
                      key={i}
                      className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-card bg-accent text-[10px] font-bold text-white"
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

          {/* Progression de lecture, liée au scroll */}
          <div
            className="mt-4 h-[7px] rounded-full"
            style={{ background: "rgba(67,56,202,.15)" }}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-150"
              style={{ width: `${readProgress * 100}%` }}
            />
          </div>
        </header>

        <div className="space-y-6 px-1">
          <p className="text-[17px] font-medium leading-relaxed text-[#514c6e] lg:text-[19px]">
            {lesson.hook}
          </p>

          <LessonBody body={lesson.body_md} />

          {lesson.anecdote && (
            <aside className="rounded-2xl bg-primary-soft p-4">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-primary">
                L&apos;anecdote
              </p>
              <p className="mt-1.5 text-sm leading-[1.65] text-ink-body">
                {lesson.anecdote}
              </p>
            </aside>
          )}

          {lesson.flex_phrase && (
            <aside className="rounded-2xl bg-accent-soft p-4">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-accent">
                Pour briller
              </p>
              <p className="mt-1.5 text-sm italic leading-[1.65] text-ink-body">
                « {lesson.flex_phrase} »
              </p>
            </aside>
          )}

          <button
            onClick={() => {
              setPhase("quiz");
              window.scrollTo({ top: 0 });
            }}
            className="push-cta min-h-13 w-full rounded-full bg-accent px-6 py-[17px] text-sm font-bold uppercase tracking-[0.14em] text-white"
          >
            Passer au quiz →
          </button>
        </div>
      </article>
    );
  }

  /* ─── Interstitiel bonus ─── */
  if (phase === "bonus-intro") {
    return (
      <div className="animate-fade-up flex flex-col items-center gap-4 pt-20 text-center">
        <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft">
          <Check size={42} strokeWidth={2.5} className="animate-pop text-primary" aria-hidden />
          <span className="absolute -right-2 top-1 h-3.5 w-3.5 rounded-full bg-accent" aria-hidden />
          <span className="absolute -left-3 bottom-3 h-[9px] w-[9px] rounded-full bg-primary" aria-hidden />
        </span>
        <h2 className="font-display text-[34px] text-primary-deep">Sans-faute !</h2>
        <p className="max-w-xs text-[15px] text-balance text-ink-soft">
          2 questions bonus débloquées : plus dures, mais{" "}
          <strong className="font-bold text-accent">20 points</strong> chacune.
        </p>
        <button
          onClick={() => setPhase("quiz")}
          className="push-cta mt-2 min-h-12 rounded-full bg-accent px-10 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-white"
        >
          Je tente !
        </button>
        <button
          onClick={() => void finishQuiz(answers)}
          disabled={submitting}
          className="text-sm text-ink-faint underline-offset-2 hover:underline disabled:opacity-60"
        >
          {submitting ? "Enregistrement…" : "Voir mon score"}
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
  if (!question) return null; // données incomplètes : rien à afficher
  const answered = selected !== null;
  const isBonus = question.tier === "bonus";
  const progressLabel = isBonus
    ? `Bonus ${qIndex - 2}/2 · 20 pts`
    : `Question ${qIndex + 1}/3`;

  return (
    <div key={qIndex} className="animate-slide-in space-y-5">
      <div className="flex items-center justify-between">
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
            isBonus ? "text-accent" : "text-primary"
          }`}
        >
          {progressLabel}
        </p>
        <div className="flex gap-1.5" aria-hidden>
          {[0, 1, 2, 3, 4].slice(0, isBonus ? 5 : 3).map((i) => (
            <span
              key={i}
              className="h-1.5 w-[22px] rounded-full"
              style={{
                background:
                  i < qIndex
                    ? "var(--primary)"
                    : i === qIndex
                      ? "rgba(67,56,202,.45)"
                      : "var(--line)",
              }}
            />
          ))}
        </div>
      </div>

      <h2 className="font-display text-[26px] leading-[1.25] text-primary-deep lg:text-[30px]">
        {question.prompt}
      </h2>

      <div className="space-y-2.5">
        {question.choices.map((choice, i) => {
          let style = "border-line bg-card";
          let anim = "";
          let mark: "good" | "bad" | null = null;
          if (answered) {
            if (i === question.answerIdx) {
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
              selected === question.answerIdx ? "text-good" : "text-accent"
            }`}
          >
            {selected === question.answerIdx ? "Exact !" : "Raté…"}
          </p>
          <p className="mt-1 text-sm leading-[1.6] text-ink-body">
            {question.explanation}
          </p>
        </div>
      )}

      {answered && (
        <button
          onClick={nextQuestion}
          disabled={submitting}
          className="push-cta min-h-13 w-full rounded-full bg-accent px-6 py-[17px] text-sm font-bold uppercase tracking-[0.14em] text-white disabled:opacity-60"
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
  const [rereading, setRereading] = useState(false);

  // Permission notifications, lue côté client uniquement (SSR : indisponible)
  const notifPermission = useSyncExternalStore(
    emptySubscribe,
    () =>
      typeof Notification !== "undefined"
        ? Notification.permission
        : "unsupported",
    () => "unsupported"
  );
  const showNotifPrompt = !result?.alreadyDone && notifPermission === "default";

  return (
    <div className="animate-fade-up flex flex-col items-center gap-5 pt-10 text-center">
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          {result?.alreadyDone
            ? "Leçon validée"
            : mode === "catchup"
              ? "Leçon rattrapée"
              : "Journée validée"}
        </p>
        <h1 className="font-display text-[34px] text-primary-deep">
          {result?.alreadyDone ? "Déjà joué !" : "Quiz terminé !"}
        </h1>
      </div>

      <div
        className={`grid w-full gap-3 ${
          !result?.alreadyDone && mode === "today" ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        <div className="shadow-card rounded-[18px] bg-card px-6 py-4">
          <p className="font-display text-[38px] tabular-nums text-primary">
            {displayPoints}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
            Points
          </p>
        </div>
        {!result?.alreadyDone && mode === "today" && (
          <div className="shadow-card rounded-[18px] bg-card px-6 py-4">
            <p className="flex items-center justify-center gap-1.5 font-display text-[38px] tabular-nums text-accent">
              <Flame size={24} className="animate-flame" fill="currentColor" aria-hidden />
              {result?.streak ?? 0}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
              Streak
            </p>
          </div>
        )}
      </div>

      {result?.streakSaved && (
        <p className="max-w-xs text-balance text-sm font-medium text-good">
          Joker utilisé : ton streak est sauvé !
        </p>
      )}

      {lesson.flex_phrase && (
        <aside className="w-full rounded-2xl bg-accent-soft p-4 text-left">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-accent">
            À ressortir ce soir
          </p>
          <p className="mt-1.5 text-sm italic leading-[1.65] text-ink-body">
            « {lesson.flex_phrase} »
          </p>
        </aside>
      )}

      <DeepDive
        lessonId={lesson.id}
        sections={diveSections(lesson.body_md, Boolean(lesson.anecdote))}
      />

      {showNotifPrompt && <NotificationsToggle />}

      <p className="max-w-xs text-balance text-[12.5px] text-ink-faint">
        {mode === "catchup"
          ? "Les 5 notions de cette leçon rejoignent tes révisions."
          : "Les 5 notions du jour reviendront en révision dans 2 jours. À demain !"}
      </p>

      <button
        onClick={() => setRereading((r) => !r)}
        className="text-sm font-medium text-primary underline underline-offset-2"
      >
        {rereading ? "Masquer la leçon" : "Relire la leçon"}
      </button>
      {rereading && (
        <div className="w-full space-y-4 text-left">
          <h2 className="font-display text-[22px] text-primary-deep">
            {lesson.title}
          </h2>
          <LessonBody body={lesson.body_md} />
        </div>
      )}
    </div>
  );
}
