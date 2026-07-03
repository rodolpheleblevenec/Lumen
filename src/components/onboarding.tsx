"use client";

import { useEffect, useState } from "react";
import { Sun, Repeat2, Flame } from "lucide-react";

const SLIDES = [
  {
    Icon: Sun,
    title: "Une leçon par jour",
    body: "Chaque matin, une leçon de culture générale de 5 minutes — la même pour tout le cercle. Lis-la, puis valide-la avec un quiz : 3 questions, et 2 bonus si tu fais un sans-faute.",
  },
  {
    Icon: Repeat2,
    title: "Ta mémoire fait le reste",
    body: "Chaque notion apprise revient en révision à J+2, J+7, J+30 puis J+90. C'est la répétition espacée : 2 minutes par jour, et dans six mois tu sauras encore.",
  },
  {
    Icon: Flame,
    title: "Le streak, entre proches",
    body: "Terminer le quiz du jour entretient ton streak 🔥 et te fait grimper au classement de la semaine. Un jour raté ? Rattrape la leçon d'hier avec ton joker 🃏 (1 par semaine).",
  },
] as const;

const STORAGE_KEY = "lumen_onboarded_v1";

export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* stockage indisponible : on n'insiste pas */
    }
  }, []);

  if (!visible) return null;

  function close() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* idem */
    }
    setVisible(false);
  }

  const { Icon, title, body } = SLIDES[slide];
  const last = slide === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenue sur Lumen"
    >
      <div
        key={slide}
        className="animate-fade-up mx-auto w-full max-w-[440px] space-y-5 rounded-t-3xl bg-card p-6 pb-8 shadow-xl sm:rounded-3xl"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
          <Icon size={26} className="text-accent-strong" aria-hidden />
        </span>
        <div className="space-y-2">
          <h2 className="font-display text-[22px] font-semibold">{title}</h2>
          <p className="leading-relaxed text-ink-soft">{body}</p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1.5" aria-hidden>
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide ? "w-6 bg-accent" : "w-1.5 bg-line"
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
              className="min-h-11 rounded-full bg-accent px-6 py-2.5 font-semibold text-on-accent transition active:scale-95"
            >
              {last ? "C'est parti ☀️" : "Suivant"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
