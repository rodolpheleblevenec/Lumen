import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
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
      <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft">
        <Lock size={38} className="text-primary" aria-hidden />
      </span>
      <h1 className="font-display text-[34px] text-primary-deep">
        Pas encore invité
      </h1>
      <p className="max-w-sm text-balance text-ink-soft">
        Lumen est un cercle privé. Ton compte{" "}
        <span className="font-medium">{String(claims.email ?? "")}</span>{" "}
        n&apos;est pas dans la liste des invités. Demande à Rodolphe de
        t&apos;ajouter !
      </p>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="min-h-12 rounded-full px-6 py-3 font-medium text-ink-soft transition active:scale-[0.98]"
          style={{ border: "1.5px solid #ddd6c8" }}
        >
          Se déconnecter
        </button>
      </form>
    </main>
  );
}
