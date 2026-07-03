// Toutes les dates métier de Lumen sont des dates calendaires Europe/Paris
// au format YYYY-MM-DD (colonne `date` des leçons, due_date des cartes…).

export function parisToday(): string {
  // fr-CA formate en YYYY-MM-DD
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(
    new Date()
  );
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 0 = dimanche … 6 = samedi (convention lumen_domain_calendar). */
export function weekdayOf(dateStr: string): number {
  return new Date(dateStr + "T12:00:00Z").getUTCDay();
}

/** Lundi de la semaine courante (pour le classement hebdo). */
export function mondayOfWeek(dateStr: string): string {
  const wd = weekdayOf(dateStr); // 0 = dimanche
  const delta = wd === 0 ? -6 : 1 - wd;
  return addDays(dateStr, delta);
}

export function formatDateFr(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(dateStr + "T12:00:00Z"));
}
