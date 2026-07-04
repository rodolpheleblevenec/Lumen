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
    <div className="shadow-card flex items-center justify-between rounded-[18px] bg-card px-4 py-3">
      <div className="flex gap-2">
        {DAY_LABELS.map((label, i) => {
          const date = addDays(monday, i);
          const isToday = date === today;
          const isFuture = date > today;
          const done = validated.has(date);
          return (
            <span
              key={date}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                done
                  ? "bg-primary text-white"
                  : isToday
                    ? "border-[2.5px] border-accent text-accent"
                    : isFuture
                      ? "bg-line-soft text-ink-faint"
                      : "border border-line text-ink-faint"
              }`}
              aria-label={done ? `${date} validé` : date}
            >
              {label}
            </span>
          );
        })}
      </div>
      <span
        className={`text-right text-[9px] font-bold uppercase leading-snug tracking-[0.12em] ${
          jokerAvailable ? "text-primary" : "text-ink-faint"
        }`}
        title={
          jokerAvailable
            ? "Joker disponible : rattraper la leçon d'hier sauve ton streak"
            : "Joker déjà utilisé cette semaine"
        }
      >
        {validated.size}/7
        <br />
        {jokerAvailable ? "Joker dispo" : "Joker utilisé"}
      </span>
    </div>
  );
}
