import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Hourglass, Swords, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  resolveExpiredDuel,
  type DuelQuestion,
  type DuelResultSide,
} from "@/server/duels";
import { DuelPlay } from "@/components/duel-play";

export default async function DuelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string;

  const { data: duel } = await supabase
    .from("lumen_duels")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!duel) notFound();

  // Forfait paresseux : duel expiré résolu à la lecture
  let status = duel.status;
  let winner = duel.winner;
  if (status === "pending" && duel.expires_at < new Date().toISOString()) {
    const resolved = await resolveExpiredDuel(duel);
    status = resolved.status;
    winner = resolved.winner;
  }

  const { data: profiles } = await supabase
    .from("lumen_profiles")
    .select("id, display_name")
    .in("id", [duel.challenger, duel.opponent]);
  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  const otherId = duel.challenger === userId ? duel.opponent : duel.challenger;
  const otherName = nameOf.get(otherId) ?? "ton adversaire";

  const duelQuestions = duel.questions as DuelQuestion[];
  const { data: questionRows } = await supabase
    .from("lumen_questions")
    .select("id, prompt, choices, answer_idx")
    .in("id", duelQuestions.map((q) => q.question_id));
  const questionById = new Map((questionRows ?? []).map((q) => [q.id, q]));

  const mySide = duel.challenger === userId ? "challenger_result" : "opponent_result";
  const myResult = duel[mySide] as DuelResultSide | null;

  /* À toi de jouer */
  if (status === "pending" && !myResult) {
    const playQuestions = duelQuestions.map((dq) => {
      const q = questionById.get(dq.question_id)!;
      const choices = q.choices as string[];
      return {
        prompt: q.prompt,
        choices: dq.choice_order.map((c) => choices[c]),
      };
    });
    return (
      <div className="space-y-4">
        {duel.stake && (
          <p className="rounded-2xl bg-accent-soft p-3 text-center text-sm italic text-ink-body">
            Gage : « {duel.stake} »
          </p>
        )}
        <DuelPlay duelId={duel.id} questions={playQuestions} opponentName={otherName} />
      </div>
    );
  }

  /* J'ai joué, l'autre pas encore */
  if (status === "pending") {
    return (
      <div className="animate-fade-up flex flex-col items-center gap-4 pt-16 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft">
          <Hourglass size={38} className="text-primary" aria-hidden />
        </span>
        <h1 className="font-display text-[34px] text-primary-deep">
          Manche jouée !
        </h1>
        <p className="max-w-xs text-[15px] text-balance text-ink-soft">
          {otherName} a jusqu&apos;au{" "}
          {new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "Europe/Paris",
          }).format(new Date(duel.expires_at))}{" "}
          pour jouer. Tu seras notifié du résultat.
        </p>
        {duel.stake && (
          <p className="text-sm italic text-ink-soft">Gage : « {duel.stake} »</p>
        )}
      </div>
    );
  }

  /* Terminé (ou forfait) : face-à-face */
  const challengerResult = duel.challenger_result as DuelResultSide | null;
  const opponentResult = duel.opponent_result as DuelResultSide | null;
  const left = { id: duel.challenger, res: challengerResult };
  const right = { id: duel.opponent, res: opponentResult };
  const totalTime = (r: DuelResultSide | null) =>
    r ? r.timesMs.reduce((a, b) => a + b, 0) / 1000 : null;

  const iWon = winner === userId;
  const draw = status === "completed" && !winner;

  return (
    <div className="animate-fade-up space-y-5">
      <div className="space-y-2 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          {status === "forfeit" ? "Duel · forfait" : "Duel terminé"}
        </p>
        <h1 className="font-display text-[34px] text-primary-deep">
          {draw
            ? "Égalité parfaite !"
            : winner
              ? iWon
                ? "Victoire !"
                : `${nameOf.get(winner) ?? "?"} l'emporte`
              : "Duel expiré"}
        </h1>
        {status === "forfeit" && winner && (
          <p className="text-sm text-ink-soft">
            {nameOf.get(winner === duel.challenger ? duel.opponent : duel.challenger)}{" "}
            n&apos;a pas joué à temps.
          </p>
        )}
        {duel.stake && (
          <p className="text-sm italic text-ink-soft">Gage : « {duel.stake} »</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[left, right].map(({ id: pid, res }) => (
          <div
            key={pid}
            className={`rounded-[18px] bg-card px-4 py-4 text-center ${
              winner === pid ? "border-2 border-primary" : "shadow-card"
            }`}
          >
            <p className="truncate text-xs font-semibold">
              {nameOf.get(pid)}
              {pid === userId && (
                <span className="font-normal text-ink-soft"> (toi)</span>
              )}
            </p>
            <p className="font-display text-[38px] tabular-nums text-primary">
              {res ? res.score : "–"}
              <span className="text-[20px] text-ink-faint">/5</span>
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
              {res ? `${totalTime(res)!.toFixed(1)} s` : "Pas joué"}
            </p>
          </div>
        ))}
      </div>

      {challengerResult && opponentResult && (
        <ol className="space-y-2">
          {duelQuestions.map((dq, i) => {
            const q = questionById.get(dq.question_id);
            if (!q) return null;
            const cell = (r: DuelResultSide) => {
              const ok = dq.choice_order[r.answers[i]] === q.answer_idx;
              return (
                <span className="flex items-center gap-1.5 text-xs tabular-nums text-ink-soft">
                  <span
                    className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-white ${
                      ok ? "bg-good" : "bg-bad"
                    }`}
                    aria-hidden
                  >
                    {ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
                  </span>
                  {(r.timesMs[i] / 1000).toFixed(1)} s
                </span>
              );
            };
            return (
              <li
                key={dq.question_id}
                className="shadow-card space-y-2 rounded-[18px] bg-card p-3.5"
              >
                <p className="text-sm font-medium leading-snug">{q.prompt}</p>
                <div className="flex items-center justify-between">
                  {cell(challengerResult)}
                  {cell(opponentResult)}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Link
        href={`/duel/nouveau?vs=${otherId}`}
        className="push-cta flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-[17px] text-sm font-bold uppercase tracking-[0.14em] text-white"
      >
        <Swords size={16} aria-hidden /> Revanche
      </Link>
    </div>
  );
}
