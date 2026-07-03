import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoogleButton } from "./google-button";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-gradient-to-b from-amber-50 to-orange-100 px-8 dark:from-stone-950 dark:to-stone-900">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-6xl" aria-hidden>
          ☀️
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-stone-900 dark:text-amber-50">
          Lumen
        </h1>
        <p className="max-w-xs text-balance text-stone-600 dark:text-stone-300">
          5 minutes par jour pour une culture générale qui reste.
        </p>
      </div>

      <GoogleButton />

      <p className="max-w-xs text-center text-xs text-stone-400 dark:text-stone-500">
        Cercle privé — l&apos;accès est réservé aux invités.
      </p>
    </main>
  );
}
