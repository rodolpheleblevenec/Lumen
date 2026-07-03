import { NextResponse, type NextRequest } from "next/server";
import { generateLesson } from "@/server/generation/generate";
import { parisToday } from "@/lib/dates";

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
    return NextResponse.json(result);
  } catch (e) {
    console.error("[generate-lesson]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
