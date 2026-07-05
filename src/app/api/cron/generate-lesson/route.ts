import { NextResponse, type NextRequest } from "next/server";
import {
  ensureSeriesPoll,
  ensureThemePoll,
  generateLesson,
} from "@/server/generation/generate";
import { addDays, parisToday, weekdayOf } from "@/lib/dates";

export const maxDuration = 300;

// Appelée par GCP Cloud Scheduler chaque nuit (~4h30 Europe/Paris).
// Auth : Authorization: Bearer <CRON_SECRET>.
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const date =
    request.nextUrl.searchParams.get("date") ?? parisToday();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ ok: false, error: "date invalide" }, { status: 400 });
  }

  try {
    const result = await generateLesson(date);

    // Jeudi : ouvrir les votes. Non bloquant : un échec ici ne doit
    // pas faire échouer la leçon du jour.
    let poll: Awaited<ReturnType<typeof ensureThemePoll>> | null = null;
    let seriesPoll: Awaited<ReturnType<typeof ensureSeriesPoll>> | null = null;
    if (weekdayOf(date) === 4) {
      // Dernier jeudi du mois : vote de la série « fil rouge » du mois suivant
      if (addDays(date, 7).slice(0, 7) !== date.slice(0, 7)) {
        try {
          const nextMonthFirst = addDays(date, 7).slice(0, 8) + "01";
          seriesPoll = await ensureSeriesPoll(nextMonthFirst);
        } catch (e) {
          console.error("[series-poll]", e);
        }
      }
      // Vote hebdo du dimanche qui vient (sauté si une série le couvre)
      try {
        poll = await ensureThemePoll(addDays(date, 3));
      } catch (e) {
        console.error("[theme-poll]", e);
      }
    }

    return NextResponse.json({
      ...result,
      ...(poll ? { poll } : {}),
      ...(seriesPoll ? { seriesPoll } : {}),
    });
  } catch (e) {
    console.error("[generate-lesson]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
