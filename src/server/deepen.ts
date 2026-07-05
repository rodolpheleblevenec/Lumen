import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";

type LessonForDive = {
  id: string;
  domain: string;
  title: string;
  body_md: string;
  anecdote: string | null;
};

/**
 * Approfondissement « Creuser » d'une partie de leçon, généré à la demande
 * et mis en cache pour tout le cercle (lumen_deep_dives). Jamais de
 * pré-génération : cette fonction n'est appelée que sur un geste utilisateur.
 */
export async function generateDeepDive(
  lesson: LessonForDive,
  sectionKey: string,
  sectionTitle: string,
  userId: string
): Promise<string> {
  const admin = createAdminClient();

  // Cache partagé : quelqu'un du cercle l'a peut-être déjà creusé
  const { data: cached } = await admin
    .from("lumen_deep_dives")
    .select("content_md")
    .eq("lesson_id", lesson.id)
    .eq("section_key", sectionKey)
    .maybeSingle();
  if (cached) return cached.content_md;

  const openai = new OpenAI();
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5.5",
    messages: [
      {
        role: "system",
        content:
          "Tu es le rédacteur en chef de Lumen (culture générale, cercle privé francophone). " +
          "On te donne une leçon déjà publiée et une de ses parties : rédige un approfondissement " +
          "d'environ 300 mots sur cette partie précise, en Markdown (pas de titre principal, " +
          "2-3 petits paragraphes, éventuellement une liste courte). Exactitude absolue, ton vivant, " +
          "aucune répétition de ce que la leçon dit déjà : apporte du neuf (contexte, mécanisme, " +
          "conséquences, chiffre marquant). Interdiction du tiret cadratin « — » et du demi-cadratin.",
      },
      {
        role: "user",
        content:
          `Leçon « ${lesson.title} » (domaine : ${lesson.domain}) :\n\n${lesson.body_md}\n\n` +
          (lesson.anecdote ? `Anecdote : ${lesson.anecdote}\n\n` : "") +
          `Partie à creuser : « ${sectionTitle} ».`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("approfondissement vide");

  // Écriture idempotente : en cas de course, le premier gagne
  await admin
    .from("lumen_deep_dives")
    .upsert(
      {
        lesson_id: lesson.id,
        section_key: sectionKey,
        section_title: sectionTitle,
        content_md: content,
        created_by: userId,
      },
      { onConflict: "lesson_id,section_key", ignoreDuplicates: true }
    );

  const { data: final } = await admin
    .from("lumen_deep_dives")
    .select("content_md")
    .eq("lesson_id", lesson.id)
    .eq("section_key", sectionKey)
    .single();
  return final?.content_md ?? content;
}
