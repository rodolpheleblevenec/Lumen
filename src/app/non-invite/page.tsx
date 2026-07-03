import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function NonInvitePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  // Si un profil Lumen existe, l'utilisateur est membre : retour à l'app.
  const { data: profile } = await supabase
    .from("lumen_profiles")
    .select("id")
    .eq("id", claims.sub)
    .maybeSingle();
  if (profile) redirect("/");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-8 text-center">
      <span className="text-5xl" aria-hidden>
        🔒
      </span>
      <h1 className="text-2xl font-bold">Pas encore invité</h1>
      <p className="max-w-sm text-balance text-stone-600 dark:text-stone-300">
        Lumen est un cercle privé. Ton compte{" "}
        <span className="font-medium">{String(claims.email ?? "")}</span>{" "}
        n&apos;est pas dans la liste des invités — demande à Rodolphe de
        t&apos;ajouter !
      </p>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="min-h-12 rounded-full border border-stone-300 px-6 py-3 font-medium transition active:scale-95 dark:border-stone-600"
        >
          Se déconnecter
        </button>
      </form>
    </main>
  );
}
