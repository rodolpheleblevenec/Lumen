"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Swords } from "lucide-react";
import { createDuel } from "@/app/(app)/actions";

/** Lancement d'un duel : gage libre optionnel, le défieur joue d'abord. */
export function DuelNew({
  opponentId,
  opponentName,
}: {
  opponentId: string;
  opponentName: string;
}) {
  const router = useRouter();
  const [stake, setStake] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function launch() {
    setError(null);
    startTransition(async () => {
      const res = await createDuel(opponentId, stake || null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/duel/${res.duelId}`);
    });
  }

  return (
    <div className="animate-fade-up flex flex-col items-center gap-4 pt-14 text-center">
      <span className="flex h-24 w-24 items-center justify-center rounded-full bg-accent-soft">
        <Swords size={38} className="text-accent" aria-hidden />
      </span>
      <h1 className="font-display text-[34px] text-primary-deep">
        Défier {opponentName}
      </h1>
      <p className="max-w-xs text-[15px] text-balance text-ink-soft">
        5 questions tirées des leçons que vous avez validées tous les deux.
        Mêmes questions, même ordre : le score départage, puis la vitesse.
        Chacun a 24h pour jouer.
      </p>

      <label className="w-full max-w-sm text-left text-xs text-ink-soft">
        Gage (optionnel, visible par vous deux)
        <input
          type="text"
          maxLength={120}
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          placeholder="Le perdant apporte les croissants"
          className="mt-1 block w-full rounded-2xl border-2 border-line bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-faint"
        />
      </label>

      <button
        onClick={launch}
        disabled={pending}
        className="push-cta mt-2 min-h-13 w-full max-w-sm rounded-full bg-accent px-8 py-[17px] text-sm font-bold uppercase tracking-[0.14em] text-white disabled:opacity-60"
      >
        {pending ? "Préparation…" : "Lancer le duel (tu joues d'abord)"}
      </button>
      {error && <p className="text-sm font-medium text-bad">{error}</p>}
    </div>
  );
}
