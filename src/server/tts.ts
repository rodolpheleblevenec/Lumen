import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "lumen-audio";
// Limite d'entrée de l'API TTS : 4096 caractères. On découpe par paragraphes.
const CHUNK_MAX = 3200;
const VOICES = ["marin", "coral"]; // marin d'abord, coral en repli

/** URL publique d'un fichier du bucket audio. */
export function audioPublicUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** Markdown → texte lisible à voix haute. */
function toSpeechText(title: string, hook: string, body: string): string {
  const plain = body
    .replace(/^##\s*(.+)$/gm, "$1.") // titres de sections → phrases
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n");
  return `${title}.\n\n${hook}\n\n${plain}`;
}

function chunk(text: string): string[] {
  const parts: string[] = [];
  let current = "";
  for (const para of text.split(/\n\n+/)) {
    if ((current + "\n\n" + para).length > CHUNK_MAX && current) {
      parts.push(current);
      current = para;
    } else {
      current = current ? current + "\n\n" + para : para;
    }
  }
  if (current) parts.push(current);
  return parts;
}

/**
 * Audio d'une leçon, généré au premier clic puis servi à tout le cercle
 * depuis le bucket (zéro coût si personne n'écoute, un seul coût sinon).
 */
export async function ensureLessonAudio(lessonId: string): Promise<string> {
  const admin = createAdminClient();

  const { data: lesson } = await admin
    .from("lumen_lessons")
    .select("id, title, hook, body_md, audio_path")
    .eq("id", lessonId)
    .eq("status", "published")
    .maybeSingle();
  if (!lesson) throw new Error("leçon introuvable");
  if (lesson.audio_path) return audioPublicUrl(lesson.audio_path);

  const openai = new OpenAI();
  const chunks = chunk(toSpeechText(lesson.title, lesson.hook, lesson.body_md));

  let voiceUsed = "";
  const buffers: Buffer[] = [];
  for (const input of chunks) {
    let done = false;
    for (const voice of voiceUsed ? [voiceUsed] : VOICES) {
      try {
        const res = await openai.audio.speech.create({
          model: "gpt-4o-mini-tts",
          voice,
          input,
          instructions:
            "Français naturel, ton chaleureux et posé, rythme de podcast culturel. " +
            "Articule les noms propres, marque de courtes pauses entre les sections.",
        });
        buffers.push(Buffer.from(await res.arrayBuffer()));
        voiceUsed = voice;
        done = true;
        break;
      } catch (e) {
        if (voiceUsed) throw e; // la voix marchait, l'erreur est autre
      }
    }
    if (!done) throw new Error("génération TTS impossible (voix indisponibles)");
  }

  const path = `lessons/${lesson.id}.mp3`;
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, Buffer.concat(buffers), {
      contentType: "audio/mpeg",
      upsert: true,
    });
  if (upErr) throw upErr;

  await admin
    .from("lumen_lessons")
    .update({ audio_path: path })
    .eq("id", lesson.id);

  return audioPublicUrl(path);
}
