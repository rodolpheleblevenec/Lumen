import { promises as fs } from "fs";
import path from "path";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";
import { weekdayOf } from "@/lib/dates";

// Schéma de sortie strict — miroir de src/server/generation/prompt.md.
const LESSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "hook",
    "body_md",
    "anecdote",
    "flex_phrase",
    "questions",
    "notions",
  ],
  properties: {
    title: { type: "string", description: "Titre accrocheur de la leçon" },
    hook: { type: "string", description: "Chapeau : l'essentiel en 3 phrases" },
    body_md: {
      type: "string",
      description:
        "Corps de la leçon en Markdown, 3-4 sections titrées (##), ~800 mots au total",
    },
    anecdote: { type: "string", description: "Anecdote authentique et mémorable" },
    flex_phrase: { type: "string", description: "La phrase à ressortir en société" },
    questions: {
      type: "array",
      description: "Exactement 5 questions : indices 0-2 = base, 3-4 = bonus",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["tier", "prompt", "choices", "answer_idx", "explanation"],
        properties: {
          tier: { type: "string", enum: ["base", "bonus"] },
          prompt: { type: "string" },
          choices: {
            type: "array",
            items: { type: "string" },
            description: "Exactement 4 choix",
          },
          answer_idx: {
            type: "integer",
            description: "Index 0-3 de la bonne réponse",
          },
          explanation: { type: "string" },
        },
      },
    },
    notions: {
      type: "array",
      description: "Exactement 5 notions, notions[i] rattachée à questions[i]",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label"],
        properties: {
          label: { type: "string", description: "3 à 8 mots : ce qu'il faut retenir" },
        },
      },
    },
  },
} as const;

type GeneratedLesson = {
  title: string;
  hook: string;
  body_md: string;
  anecdote: string;
  flex_phrase: string;
  questions: {
    tier: "base" | "bonus";
    prompt: string;
    choices: string[];
    answer_idx: number;
    explanation: string;
  }[];
  notions: { label: string }[];
};

function validate(lesson: GeneratedLesson): string | null {
  if (lesson.questions.length !== 5) return "il faut exactement 5 questions";
  const tiers = lesson.questions.map((q) => q.tier).join(",");
  if (tiers !== "base,base,base,bonus,bonus")
    return "l'ordre attendu est 3 questions base puis 2 bonus";
  for (const [i, q] of lesson.questions.entries()) {
    if (q.choices.length !== 4) return `question ${i + 1} : il faut 4 choix`;
    if (q.answer_idx < 0 || q.answer_idx > 3)
      return `question ${i + 1} : answer_idx hors bornes`;
  }
  if (lesson.notions.length !== 5) return "il faut exactement 5 notions";
  return null;
}

async function loadSystemPrompt(domain: string, pastTitles: string[]) {
  const raw = await fs.readFile(
    path.join(process.cwd(), "src/server/generation/prompt.md"),
    "utf-8"
  );
  // La section System du prompt versionné, variables injectées.
  const system = raw.split("## System")[1]?.split("## Format de sortie")[0];
  if (!system) throw new Error("prompt.md : section System introuvable");
  return system
    .replaceAll("{{domain}}", domain)
    .replaceAll(
      "{{past_titles}}",
      pastTitles.length ? pastTitles.map((t) => `- ${t}`).join("\n") : "(aucun)"
    )
    .trim();
}

export async function generateLesson(date: string) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("lumen_lessons")
    .select("id, title")
    .eq("date", date)
    .maybeSingle();
  if (existing) {
    return { ok: true as const, skipped: true as const, date, title: existing.title };
  }

  const { data: cal } = await supabase
    .from("lumen_domain_calendar")
    .select("domain")
    .eq("weekday", weekdayOf(date))
    .single();
  const domain = cal!.domain;

  const { data: past } = await supabase
    .from("lumen_lessons")
    .select("title")
    .eq("domain", domain)
    .order("date", { ascending: false })
    .limit(50);
  const pastTitles = (past ?? []).map((l) => l.title);

  const system = await loadSystemPrompt(domain, pastTitles);
  const dateFr = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date + "T12:00:00Z"));

  const openai = new OpenAI();
  const model = process.env.OPENAI_MODEL ?? "gpt-5.5";

  let lastError = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            `Rédige la leçon Lumen du ${dateFr} — domaine : ${domain}.` +
            (lastError
              ? `\n\nTa tentative précédente était invalide : ${lastError}. Corrige.`
              : ""),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lumen_lesson",
          strict: true,
          schema: LESSON_SCHEMA as unknown as Record<string, unknown>,
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      lastError = "réponse vide";
      continue;
    }

    let lesson: GeneratedLesson;
    try {
      lesson = JSON.parse(content) as GeneratedLesson;
    } catch {
      lastError = "JSON invalide";
      continue;
    }

    const problem = validate(lesson);
    if (problem) {
      lastError = problem;
      continue;
    }

    // Insertion transactionnelle « à la main » : leçon en draft,
    // puis questions/notions, puis publication.
    const { data: inserted, error: lessonErr } = await supabase
      .from("lumen_lessons")
      .insert({
        date,
        domain,
        title: lesson.title,
        hook: lesson.hook,
        body_md: lesson.body_md,
        anecdote: lesson.anecdote,
        flex_phrase: lesson.flex_phrase,
        status: "draft",
      })
      .select("id")
      .single();
    if (lessonErr) throw lessonErr;

    const { data: questions, error: qErr } = await supabase
      .from("lumen_questions")
      .insert(
        lesson.questions.map((q, i) => ({
          lesson_id: inserted.id,
          tier: q.tier,
          position: q.tier === "base" ? i : i - 3,
          prompt: q.prompt,
          choices: q.choices,
          answer_idx: q.answer_idx,
          explanation: q.explanation,
        }))
      )
      .select("id, tier, position");
    if (qErr) throw qErr;

    const ordered = [...questions].sort((a, b) =>
      a.tier === b.tier
        ? a.position - b.position
        : a.tier === "base"
          ? -1
          : 1
    );
    const { error: nErr } = await supabase.from("lumen_notions").insert(
      lesson.notions.map((n, i) => ({
        lesson_id: inserted.id,
        question_id: ordered[i]?.id ?? null,
        label: n.label,
      }))
    );
    if (nErr) throw nErr;

    const { error: pubErr } = await supabase
      .from("lumen_lessons")
      .update({ status: "published" })
      .eq("id", inserted.id);
    if (pubErr) throw pubErr;

    const usage = completion.usage;
    return {
      ok: true as const,
      skipped: false as const,
      date,
      domain,
      title: lesson.title,
      attempt,
      tokens: { input: usage?.prompt_tokens, output: usage?.completion_tokens },
    };
  }

  throw new Error(`génération invalide après 3 tentatives : ${lastError}`);
}
