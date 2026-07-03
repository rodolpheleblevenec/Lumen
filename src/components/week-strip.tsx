import { addDays } from "@/lib/dates";

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

/** Ruban de la semaine : 7 pastilles lun→dim + état du joker. */
export function WeekStrip({
  today,
  monday,
  validatedDates,
  jokerAvailable,
}: {
  today: string;
  monday: string;
  validatedDates: string[];
  jokerAvailable: boolean;
}) {
  const validated = new Set(validatedDates);

  return (
    <div className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
      <div className="flex gap-2.5">
        {DAY_LABELS.map((label, i) => {
          const date = addDays(monday, i);
          const isToday = date === today;
          const isFuture = date > today;
          const done = validated.has(date);
          return (
            <div key={date} className="flex flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                  done
                    ? "bg-sun text-on-sun"
                    : isToday
                      ? "border-2 border-accent text-accent"
                      : isFuture
                        ? "border border-line text-ink-soft/50"
                        : "border border-line bg-card-soft text-ink-soft"
                }`}
                aria-label={done ? `${date} validé` : date}
              >
                {done ? "✓" : label}
              </span>
            </div>
          );
        })}
      </div>
      <span
        className="text-lg"
        title={
          jokerAvailable
            ? "Joker disponible : rattraper la leçon d'hier sauve ton streak"
            : "Joker déjà utilisé cette semaine"
        }
      >
        {jokerAvailable ? "🃏" : <span className="opacity-30 grayscale">🃏</span>}
      </span>
    </div>
  );
}
