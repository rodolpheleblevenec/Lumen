import { redirect } from "next/navigation";
import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { parisToday } from "@/lib/dates";
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

  const today = parisToday();
  const [{ data: streak }, { count: dueCount }] = await Promise.all([
    supabase
      .from("lumen_streaks")
      .select("current, last_validated_date")
      .eq("user_id", profile.id)
      .maybeSingle(),
    supabase
      .from("lumen_srs_cards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .lte("due_date", today)
      .lt("level", 5),
  ]);

  const validatedToday = streak?.last_validated_date === today;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[600px] flex-col">
      <header className="flex items-center justify-between px-5 pb-2 pt-5">
        <span className="font-display text-[22px] font-semibold tracking-tight">
          Lumen
        </span>
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold tabular-nums ${
            validatedToday
              ? "bg-accent-soft text-accent-strong"
              : "bg-card-soft text-ink-soft"
          }`}
          title={
            validatedToday
              ? "Streak validé aujourd'hui"
              : "Termine le quiz du jour pour valider ta journée"
          }
        >
          <Flame
            size={15}
            className={validatedToday ? "animate-flame" : ""}
            fill={validatedToday ? "currentColor" : "none"}
            aria-hidden
          />
          {streak?.current ?? 0}
        </span>
      </header>

      <main className="flex-1 px-5 pb-28 pt-2">{children}</main>

      <BottomNav dueCount={dueCount ?? 0} />
    </div>
  );
}
