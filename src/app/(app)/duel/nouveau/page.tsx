import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DuelNew } from "@/components/duel-new";

export default async function NouveauDuelPage({
  searchParams,
}: {
  searchParams: Promise<{ vs?: string }>;
}) {
  const { vs } = await searchParams;
  if (!vs) notFound();

  const supabase = await createClient();
  const { data: opponent } = await supabase
    .from("lumen_profiles")
    .select("id, display_name")
    .eq("id", vs)
    .maybeSingle();
  if (!opponent) notFound();

  return <DuelNew opponentId={opponent.id} opponentName={opponent.display_name} />;
}
