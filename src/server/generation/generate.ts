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
    "date_hook",
    "questions",
    "notions",
  ],
  properties: {
    title: { type: "string", description: "Titre accrocheur de la leçon" },
    hook: { type: "string", description: "Chapeau : l'essentiel en 3 phrases" },
    date_hook: {
      type: ["string", "null"],
      description:
        "Une phrase courte si la date du jour a un lien réel et vérifiable avec le sujet (anniversaire, journée mondiale), sinon null. Ne jamais forcer.",
    },
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
  date_hook: string | null;
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
  if (/[—–]/.test(JSON.stringify(lesson)))
    return "le tiret cadratin « — » (et demi-cadratin « – ») est interdit : reformule avec deux points, virgule ou parenthèses";
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

export type ThemeOption = { title: string; pitch: string };

/**
 * Crée (si absent) le sondage du thème « Carte blanche » d'un dimanche :
 * 4 options titre + pitch proposées par l'IA. Appelé le jeudi par le cron.
 */
export async function ensureThemePoll(sunday: string) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("lumen_theme_polls")
    .select("id")
    .eq("sunday", sunday)
    .eq("kind", "sunday")
    .maybeSingle();
  if (existing) return { ok: true as const, skipped: true as const, sunday };

  // Dimanche couvert par une série votée ? Le fil rouge prime : pas de
  // vote hebdo ce dimanche-là.
  const monthFirst = sunday.slice(0, 8) + "01";
  const nth = Math.floor((Number(sunday.slice(8, 10)) - 1) / 7);
  if (nth <= 3) {
    const series = await winningOption(supabase, monthFirst, "series");
    if (series) return { ok: true as const, skipped: true as const, sunday };
  }

  const { data: past } = await supabase
    .from("lumen_lessons")
    .select("title")
    .order("date", { ascending: false })
    .limit(30);
  const pastTitles = (past ?? []).map((l) => `- ${l.title}`).join("\n");

  const openai = new OpenAI();
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5.5",
    messages: [
      {
        role: "system",
        content:
          "Tu proposes des thèmes de leçon de culture générale pour Lumen (cercle privé francophone). " +
          "Propose 4 thèmes « Carte blanche » variés et précis (pas de survol encyclopédique), " +
          "hors des sentiers battus, chacun avec un titre accrocheur et un pitch d'une phrase. " +
          "Interdiction du tiret cadratin. Ne reprends aucun sujet déjà traité :\n" +
          pastTitles,
      },
      { role: "user", content: `Propose les 4 thèmes pour le dimanche ${sunday}.` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "lumen_theme_options",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["options"],
          properties: {
            options: {
              type: "array",
              description: "Exactement 4 thèmes",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "pitch"],
                properties: {
                  title: { type: "string" },
                  pitch: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("proposition de thèmes vide");
  const { options } = JSON.parse(content) as { options: ThemeOption[] };
  if (options.length !== 4) throw new Error("il faut exactement 4 thèmes");

  const { error } = await supabase
    .from("lumen_theme_polls")
    .insert({ sunday, options });
  if (error) throw error;

  return { ok: true as const, skipped: false as const, sunday, options };
}

export type SeriesOption = ThemeOption & { episodes: string[] };

/**
 * Option gagnante d'un sondage (le plus voté, premier en cas d'égalité).
 * `key` : le dimanche pour un vote hebdo, le 1er du mois pour une série.
 */
async function winningOption<T extends ThemeOption>(
  supabase: ReturnType<typeof createAdminClient>,
  key: string,
  kind: "sunday" | "series"
): Promise<T | null> {
  const { data: poll } = await supabase
    .from("lumen_theme_polls")
    .select("id, options")
    .eq("sunday", key)
    .eq("kind", kind)
    .maybeSingle();
  if (!poll) return null;

  const { data: ballots } = await supabase
    .from("lumen_theme_ballots")
    .select("option_idx")
    .eq("poll_id", poll.id);
  if (!ballots?.length) return null;

  const tally = [0, 0, 0, 0];
  for (const b of ballots) tally[b.option_idx]++;
  const winner = tally.indexOf(Math.max(...tally));
  return (poll.options as T[])[winner] ?? null;
}

/**
 * Crée (si absent) le sondage de la série « fil rouge » d'un mois :
 * 4 séries de 4 épisodes (un par dimanche). Appelé le dernier jeudi
 * du mois précédent par le cron.
 */
export async function ensureSeriesPoll(monthFirst: string) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("lumen_theme_polls")
    .select("id")
    .eq("sunday", monthFirst)
    .eq("kind", "series")
    .maybeSingle();
  if (existing) return { ok: true as const, skipped: true as const, month: monthFirst };

  const { data: past } = await supabase
    .from("lumen_lessons")
    .select("title")
    .order("date", { ascending: false })
    .limit(30);
  const pastTitles = (past ?? []).map((l) => `- ${l.title}`).join("\n");

  const monthLabel = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(monthFirst + "T12:00:00Z"));

  const openai = new OpenAI();
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5.5",
    messages: [
      {
        role: "system",
        content:
          "Tu proposes des séries « fil rouge » pour Lumen (culture générale, cercle privé francophone). " +
          "Une série = un thème fort décliné en 4 épisodes progressifs, un par dimanche du mois. " +
          "Propose 4 séries variées et précises, chacune avec : un titre accrocheur, un pitch d'une phrase, " +
          "et les titres de ses 4 épisodes. Interdiction du tiret cadratin. " +
          "Ne recoupe aucun sujet déjà traité :\n" +
          pastTitles,
      },
      { role: "user", content: `Propose les 4 séries pour ${monthLabel}.` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "lumen_series_options",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["options"],
          properties: {
            options: {
              type: "array",
              description: "Exactement 4 séries",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "pitch", "episodes"],
                properties: {
                  title: { type: "string" },
                  pitch: { type: "string" },
                  episodes: {
                    type: "array",
                    description: "Exactement 4 titres d'épisodes",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("proposition de séries vide");
  const { options } = JSON.parse(content) as { options: SeriesOption[] };
  if (options.length !== 4 || options.some((o) => o.episodes.length !== 4))
    throw new Error("il faut 4 séries de 4 épisodes");

  const { error } = await supabase
    .from("lumen_theme_polls")
    .insert({ sunday: monthFirst, kind: "series", options });
  if (error) throw error;

  return { ok: true as const, skipped: false as const, month: monthFirst, options };
}

export async function generateLesson(date: string) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("lumen_lessons")
    .select("id, title, status")
    .eq("date", date)
    .maybeSingle();
  if (existing?.status === "published") {
    return { ok: true as const, skipped: true as const, date, title: existing.title };
  }
  if (existing) {
    // Draft orphelin d'une génération interrompue : on le purge et on
    // regénère (les questions/notions suivent par ON DELETE CASCADE).
    const { error: purgeErr } = await supabase
      .from("lumen_lessons")
      .delete()
      .eq("id", existing.id);
    if (purgeErr) throw purgeErr;
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

  // Dimanche Carte blanche : série « fil rouge » du mois d'abord,
  // sinon thème hebdo voté, sinon carte blanche libre.
  let themeLine = "";
  let series: { title: string; episode: number } | null = null;
  if (domain === "Carte blanche") {
    const monthFirst = date.slice(0, 8) + "01";
    const nth = Math.floor((Number(date.slice(8, 10)) - 1) / 7);
    if (nth <= 3) {
      const s = await winningOption<SeriesOption>(supabase, monthFirst, "series");
      if (s) {
        series = { title: s.title, episode: nth + 1 };
        themeLine =
          `\n\nCette leçon est l'épisode ${nth + 1}/4 de la série du mois choisie par le cercle : ` +
          `« ${s.title} » (${s.pitch}). Sujet de cet épisode : « ${s.episodes[nth]} ». ` +
          `Traite précisément ce sujet ; tu peux rappeler la série en une phrase, sans résumer les autres épisodes.`;
      }
    }
    if (!themeLine) {
      const theme = await winningOption<ThemeOption>(supabase, date, "sunday");
      if (theme) {
        themeLine = `\n\nThème choisi par le cercle : « ${theme.title} » (${theme.pitch}). Traite précisément ce thème.`;
      }
    }
  }

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
            `Rédige la leçon Lumen du ${dateFr} (domaine : ${domain}).` +
            themeLine +
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
        date_hook: lesson.date_hook,
        series_title: series?.title ?? null,
        series_episode: series?.episode ?? null,
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
