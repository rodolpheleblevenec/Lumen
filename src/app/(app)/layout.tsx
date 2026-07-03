import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  // Le pool auth est partagé avec d'autres apps : membre = profil Lumen.
  const { data: profile } = await supabase
    .from("lumen_profiles")
    .select("id, display_name, avatar_url")
    .eq("id", claims.sub)
    .maybeSingle();
  if (!profile) redirect("/non-invite");

  const { data: streak } = await supabase
    .from("lumen_streaks")
    .select("current")
    .eq("user_id", profile.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[600px] flex-col">
      <header className="flex items-center justify-between px-5 pb-2 pt-5">
        <span className="text-xl font-bold tracking-tight">☀️ Lumen</span>
        <span
          className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700 dark:bg-orange-950 dark:text-orange-300"
          title="Jours d'affilée"
        >
          🔥 {streak?.current ?? 0}
        </span>
      </header>

      <main className="flex-1 px-5 pb-28 pt-2">{children}</main>

      <BottomNav />
    </div>
  );
}
