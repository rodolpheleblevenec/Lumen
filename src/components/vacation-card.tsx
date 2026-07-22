"use client";

import { useState, useTransition } from "react";
import { TreePalm } from "lucide-react";
import { cancelVacation, setVacation } from "@/app/(app)/actions";

function formatFr(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(
    new Date(date + "T12:00:00Z")
  );
}

/**
 * Mode vacances : le streak est gelé sur la période déclarée (on fige,
 * les jours gelés ne comptent pas). Max 14 jours par an.
 */
export function VacationCard({
  start,
  end,
  remaining,
  today,
}: {
  start: string | null;
  end: string | null;
  remaining: number;
  today: string;
}) {
  const [form, setForm] = useState({ start: "", end: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const active = Boolean(start && end && end >= today);
  const ongoing = active && start! <= today;

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await setVacation(form.start, form.end);
      if (!res.ok) setError(res.error ?? "Impossible d'enregistrer.");
    });
  }

  function cancel() {
    setError(null);
    startTransition(async () => {
      const res = await cancelVacation();
      if (!res.ok) setError(res.error ?? "Impossible d'annuler.");
    });
  }

  return (
    <div className="shadow-card space-y-3 rounded-[18px] bg-card p-4">
      <div className="flex items-center gap-2.5">
        <TreePalm size={16} className="text-teal" aria-hidden />
        <span>
          <span className="block text-[13.5px] font-bold">Mode vacances</span>
          <span className="block text-xs text-ink-soft">
            Streak gelé sur la période. {remaining} jour{remaining > 1 ? "s" : ""}{" "}
            restant{remaining > 1 ? "s" : ""} cette année.
          </span>
        </span>
      </div>

      {active ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">
            {ongoing ? "En cours" : "Prévu"} du{" "}
            <strong className="font-semibold">{formatFr(start!)}</strong> au{" "}
            <strong className="font-semibold">{formatFr(end!)}</strong>.
          </p>
          <button
            onClick={cancel}
            disabled={pending}
            className="shrink-0 rounded-full px-4 py-2 text-xs font-medium text-ink-soft disabled:opacity-60"
            style={{ border: "1.5px solid #ddd6c8" }}
          >
            Annuler
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <label className="min-w-0 text-xs text-ink-soft">
              Du
              <input
                type="date"
                min={today}
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
                className="mt-1 block w-full min-w-0 appearance-none rounded-xl border-2 border-line bg-card px-2.5 py-2 text-sm text-ink"
              />
            </label>
            <label className="min-w-0 text-xs text-ink-soft">
              Au
              <input
                type="date"
                min={form.start || today}
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
                className="mt-1 block w-full min-w-0 appearance-none rounded-xl border-2 border-line bg-card px-2.5 py-2 text-sm text-ink"
              />
            </label>
          </div>
          <button
            onClick={save}
            disabled={pending || !form.start || !form.end}
            className="push-cta-primary min-h-11 w-full rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
          >
            Geler mon streak
          </button>
        </div>
      )}

      {error && <p className="text-xs font-medium text-bad">{error}</p>}
    </div>
  );
}
