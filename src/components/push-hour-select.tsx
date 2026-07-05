"use client";

import { useState, useTransition } from "react";
import { Clock } from "lucide-react";
import { setPushHour } from "@/app/(app)/actions";

/** Heure du rappel quotidien, au choix de chacun (heure de Paris). */
export function PushHourSelect({ initialHour }: { initialHour: number }) {
  const [hour, setHour] = useState(initialHour);
  const [pending, startTransition] = useTransition();

  function change(h: number) {
    const previous = hour;
    setHour(h);
    startTransition(() => setPushHour(h).catch(() => setHour(previous)));
  }

  return (
    <div className="shadow-card flex min-h-12 items-center justify-between gap-4 rounded-[18px] bg-card p-4">
      <span className="flex items-center gap-2.5">
        <Clock size={16} className="text-primary" aria-hidden />
        <span>
          <span className="block text-[13.5px] font-bold">Heure du rappel</span>
          <span className="block text-xs text-ink-soft">Heure de Paris.</span>
        </span>
      </span>
      <select
        value={hour}
        disabled={pending}
        onChange={(e) => change(Number(e.target.value))}
        className="min-h-10 rounded-full border-2 border-line bg-card px-3 text-sm font-semibold tabular-nums disabled:opacity-60"
        aria-label="Heure du rappel quotidien"
      >
        {Array.from({ length: 24 }, (_, h) => (
          <option key={h} value={h}>
            {h} h
          </option>
        ))}
      </select>
    </div>
  );
}
