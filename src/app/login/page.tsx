import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoogleButton } from "./google-button";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/");

  return (
    <main className="sunrise flex min-h-dvh flex-col items-center justify-center gap-10 px-8">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Marque : soleil Lumen (cohérent avec l'icône PWA) */}
        <svg width="72" height="72" viewBox="0 0 512 512" aria-hidden>
          <circle cx="256" cy="256" r="104" fill="var(--accent)" />
          <g stroke="var(--accent)" strokeWidth="30" strokeLinecap="round">
            <line x1="256" y1="72" x2="256" y2="122" />
            <line x1="256" y1="390" x2="256" y2="440" />
            <line x1="72" y1="256" x2="122" y2="256" />
            <line x1="390" y1="256" x2="440" y2="256" />
            <line x1="126" y1="126" x2="161" y2="161" />
            <line x1="351" y1="351" x2="386" y2="386" />
            <line x1="126" y1="386" x2="161" y2="351" />
            <line x1="351" y1="161" x2="386" y2="126" />
          </g>
        </svg>
        <h1 className="font-display text-5xl font-semibold tracking-tight">
          Lumen
        </h1>
        <p className="max-w-xs text-balance text-ink-soft">
          5 minutes par jour pour une culture générale qui reste.
        </p>
      </div>

      <GoogleButton />

      <p className="max-w-xs text-center text-xs text-ink-soft/70">
        Cercle privé — l&apos;accès est réservé aux invités.
      </p>
    </main>
  );
}
