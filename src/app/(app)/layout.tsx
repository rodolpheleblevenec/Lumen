import { redirect } from "next/navigation";
import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { parisToday } from "@/lib/dates";
import { BottomNav, SideNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  // Le pool auth est partagé avec d'autres apps : membre = profil Lumen.
  // Accès ouvert : au premier passage, on crée le profil (self-serve).
  let { data: profile } = await supabase
    .from("lumen_profiles")
    .select("id, display_name, avatar_url")
    .eq("id", claims.sub)
    .maybeSingle();
  if (!profile) {
    const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
    const displayName =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      String(claims.email ?? "").split("@")[0] ||
      "Membre";
    const avatarUrl =
      (typeof meta.avatar_url === "string" && meta.avatar_url) ||
      (typeof meta.picture === "string" && meta.picture) ||
      null;
    await supabase
      .from("lumen_profiles")
      .upsert(
        { id: claims.sub, display_name: displayName, avatar_url: avatarUrl },
        { onConflict: "id", ignoreDuplicates: true }
      );
    await supabase
      .from("lumen_streaks")
      .upsert(
        { user_id: claims.sub },
        { onConflict: "user_id", ignoreDuplicates: true }
      );
    ({ data: profile } = await supabase
      .from("lumen_profiles")
      .select("id, display_name, avatar_url")
      .eq("id", claims.sub)
      .maybeSingle());
  }
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
    <div className="mx-auto flex min-h-dvh w-full max-w-[600px] lg:max-w-[1020px] lg:gap-14 lg:px-8">
      <SideNav dueCount={dueCount ?? 0} />

      <div className="flex min-h-dvh w-full min-w-0 flex-col lg:max-w-[680px]">
      <header className="flex items-center justify-between px-5 pb-2 pt-5 lg:justify-end lg:px-1 lg:pt-8">
        <span className="flex items-center gap-2 lg:hidden">
          <Logo size={22} />
          <span className="font-display text-[25px] text-primary-deep">
            Lumen
          </span>
        </span>
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums text-white ${
            validatedToday ? "push-pill-accent" : "push-pill bg-primary"
          }`}
          style={
            validatedToday
              ? { background: "linear-gradient(135deg,#e2543a,#c73d24)" }
              : undefined
          }
          title={
            validatedToday
              ? "Streak validé aujourd'hui"
              : "Termine le quiz du jour pour valider ta journée"
          }
        >
          <Flame
            size={14}
            className={validatedToday ? "animate-flame" : ""}
            fill="currentColor"
            aria-hidden
          />
          {streak?.current ?? 0}
        </span>
      </header>

      <main className="flex-1 px-4 pb-32 pt-2 lg:px-1 lg:pb-16">{children}</main>
      </div>

      <BottomNav dueCount={dueCount ?? 0} />
    </div>
  );
}
