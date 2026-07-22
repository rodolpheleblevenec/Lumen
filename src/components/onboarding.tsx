"use client";

import { useState } from "react";
import { Sun, Repeat2, Flame } from "lucide-react";
import { markOnboarded } from "@/app/(app)/actions";

const SLIDES = [
  {
    Icon: Sun,
    title: "Une leçon par jour",
    body: "Chaque matin, une leçon de culture générale de 5 minutes, la même pour tout le cercle. Lis-la, puis valide-la avec un quiz : 3 questions, et 2 bonus si tu fais un sans-faute.",
  },
  {
    Icon: Repeat2,
    title: "Ta mémoire fait le reste",
    body: "Chaque notion apprise revient en révision à J+2, J+7, J+30 puis J+90. C'est la répétition espacée : 2 minutes par jour, et dans six mois tu sauras encore.",
  },
  {
    Icon: Flame,
    title: "Le streak, entre proches",
    body: "Terminer le quiz du jour entretient ton streak et te fait grimper au classement. Un jour raté ? Rattrape la leçon d'hier avec ton joker (1 par semaine).",
  },
] as const;

/** Bulles tutorielles du premier accès. Vu = enregistré sur le compte. */
export function Onboarding({ show }: { show: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  const [slide, setSlide] = useState(0);

  if (!show || dismissed) return null;

  function close() {
    setDismissed(true);
    void markOnboarded().catch(() => {
      /* réessaiera à la prochaine visite */
    });
  }

  const { Icon, title, body } = SLIDES[slide];
  const last = slide === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(34,32,58,.42)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenue sur Lumen"
    >
      <div
        key={slide}
        className="animate-fade-up mx-auto w-full max-w-[440px] space-y-5 rounded-t-[26px] bg-card p-6 pb-8 shadow-xl sm:rounded-[26px]"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
          <Icon size={26} className="text-primary" aria-hidden />
        </span>
        <div className="space-y-2">
          <h2 className="font-display text-[26px] text-primary-deep">{title}</h2>
          <p className="text-sm leading-relaxed text-ink-soft">{body}</p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1.5" aria-hidden>
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide ? "w-[22px] bg-primary" : "w-1.5 bg-line"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-4">
            {!last && (
              <button onClick={close} className="text-sm text-ink-soft">
                Passer
              </button>
            )}
            <button
              onClick={() => (last ? close() : setSlide(slide + 1))}
              className="push-cta min-h-11 rounded-full bg-accent px-6 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white"
            >
              {last ? "C'est parti" : "Suivant"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
