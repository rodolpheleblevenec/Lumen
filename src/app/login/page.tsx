import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoTile } from "@/components/logo";
import { GoogleButton } from "./google-button";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/");

  return (
    <main className="halo-login flex min-h-dvh flex-col items-center justify-center gap-10 px-8">
      <div className="flex flex-col items-center gap-5 text-center">
        <LogoTile size={88} />
        <h1 className="font-display text-[46px] text-primary-deep">Lumen</h1>
        <p className="max-w-xs text-balance text-ink-soft">
          5 minutes par jour pour une culture générale qui reste.
        </p>
      </div>

      <GoogleButton />

      <p className="max-w-xs text-center text-[11px] text-ink-faint">
        Cercle privé — l&apos;accès est réservé aux invités.
      </p>
    </main>
  );
}
