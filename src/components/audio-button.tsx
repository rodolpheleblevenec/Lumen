"use client";

import { useState, useTransition } from "react";
import { Headphones, Loader2 } from "lucide-react";
import { getLessonAudio } from "@/app/(app)/actions";

/**
 * « Écouter » : l'audio est généré au premier clic du cercle (TTS),
 * puis servi à tous depuis le bucket. Zéro coût si personne n'écoute.
 */
export function AudioButton({
  lessonId,
  initialUrl,
}: {
  lessonId: string;
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [, startTransition] = useTransition();

  if (url && playing) {
    return (
      <audio
        controls
        autoPlay
        src={url}
        className="h-9 w-full"
        aria-label="Écouter la leçon"
      />
    );
  }

  function listen() {
    if (url) {
      setPlaying(true);
      return;
    }
    setError(false);
    setLoading(true);
    startTransition(async () => {
      try {
        const res = await getLessonAudio(lessonId);
        setUrl(res.url);
        setPlaying(true);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={listen}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-[11px] font-medium text-ink-soft transition active:scale-[0.97] disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={11} className="animate-spin" aria-hidden />
        ) : (
          <Headphones size={11} aria-hidden />
        )}
        {loading ? "Préparation…" : "Écouter"}
      </button>
      {error && (
        <span className="text-[11px] text-bad">Réessaie dans un instant</span>
      )}
    </span>
  );
}
