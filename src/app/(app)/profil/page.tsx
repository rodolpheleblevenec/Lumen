import Link from "next/link";
import {
  Brain,
  Crown,
  Flame,
  Gem,
  GraduationCap,
  Medal,
  Star,
  Swords,
  Trophy,
  Undo2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { parisToday } from "@/lib/dates";
import { BADGES } from "@/lib/types";
import { NotificationsToggle } from "@/components/notifications-toggle";
import { PushHourSelect } from "@/components/push-hour-select";
import { VacationCard } from "@/components/vacation-card";

const BADGE_ICONS: Record<
  string,
  { Icon: LucideIcon; color: string; soft: string; fill?: boolean }
> = {
  perfect_quiz: { Icon: Star, color: "var(--primary)", soft: "var(--primary-soft)", fill: true },
  streak_7: { Icon: Flame, color: "var(--accent)", soft: "var(--accent-soft)", fill: true },
  streak_30: { Icon: Zap, color: "var(--accent)", soft: "var(--accent-soft)", fill: true },
  streak_100: { Icon: Gem, color: "var(--teal)", soft: "var(--teal-soft)" },
  streak_365: { Icon: Crown, color: "var(--primary)", soft: "var(--primary-soft)" },
  notions_50: { Icon: Brain, color: "var(--teal)", soft: "var(--teal-soft)" },
  domain_master: { Icon: GraduationCap, color: "var(--green)", soft: "var(--green-soft)" },
  duel_first: { Icon: Swords, color: "var(--accent)", soft: "var(--accent-soft)" },
  duel_5_wins: { Icon: Medal, color: "var(--primary)", soft: "var(--primary-soft)" },
  duel_revenge: { Icon: Undo2, color: "var(--teal)", soft: "var(--teal-soft)" },
};

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string;

  const [{ data: profile }, { data: streak }, { count: acquired }, { data: badges }] =
    await Promise.all([
      supabase
        .from("lumen_profiles")
        .select("display_name, avatar_url, push_hour")
        .eq("id", userId)
        .single(),
      supabase
        .from("lumen_streaks")
        .select(
          "current, best, vacation_start, vacation_end, vacation_days_used, vacation_year"
        )
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("lumen_srs_cards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("level", 5),
      supabase
        .from("lumen_badges")
        .select("badge_key, earned_at")
        .eq("user_id", userId)
        .order("earned_at", { ascending: true }),
    ]);

  const earned = new Set((badges ?? []).map((b) => b.badge_key));
  const progressOf = (kind: "streak" | "notions") =>
    kind === "streak" ? (streak?.best ?? 0) : (acquired ?? 0);

  const stats = [
    {
      Icon: Flame,
      color: "var(--accent)",
      value: streak?.current ?? 0,
      label: "Streak actuel",
    },
    {
      Icon: Trophy,
      color: "var(--primary)",
      value: streak?.best ?? 0,
      label: "Record",
    },
    {
      Icon: GraduationCap,
      color: "var(--teal)",
      value: acquired ?? 0,
      label: "Notions acquises",
    },
  ];

  return (
    <div className="animate-fade-up space-y-6">
      <h1 className="font-display text-[30px] text-primary-deep">Profil</h1>

      <div className="shadow-card flex items-center gap-4 rounded-[18px] bg-card p-4">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-[54px] w-[54px] rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="font-display flex h-[54px] w-[54px] items-center justify-center rounded-full bg-primary-soft text-[26px] text-primary">
            {profile?.display_name?.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-bold">{profile?.display_name}</p>
          <p className="truncate text-[12.5px] text-ink-soft">
            {String(data?.claims?.email ?? "")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {stats.map(({ Icon, color, value, label }) => (
          <div key={label} className="shadow-card rounded-[18px] bg-card px-2 py-4">
            <Icon size={18} className="mx-auto" style={{ color }} aria-hidden />
            <p className="font-display mt-1 text-[26px] tabular-nums text-primary-deep">
              {value}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-faint">
              {label}
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-[13.5px] font-bold">Badges</h2>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
          {Object.entries(BADGES).map(([key, meta]) => {
            const has = earned.has(key);
            const { Icon, color, soft, fill } =
              BADGE_ICONS[key] ?? BADGE_ICONS.perfect_quiz;
            const progress =
              !has && meta.goal
                ? `${Math.min(progressOf(meta.goal.kind), meta.goal.target)}/${meta.goal.target}`
                : null;
            return (
              <div
                key={key}
                className={`flex items-center gap-2.5 rounded-[18px] p-3 ${
                  has ? "shadow-card bg-card" : "opacity-70"
                }`}
                style={
                  has
                    ? undefined
                    : {
                        background: "#faf8f2",
                        border: "1.5px dashed #ddd6c8",
                      }
                }
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={
                    has
                      ? { background: soft, color }
                      : { background: "var(--line-soft)", color: "var(--ink-faint)" }
                  }
                  aria-hidden
                >
                  <Icon size={17} fill={fill ? "currentColor" : "none"} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold leading-tight">
                    {meta.label}
                  </span>
                  {progress && (
                    <span className="block text-[10.5px] tabular-nums text-ink-faint">
                      {progress}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[13.5px] font-bold">Notifications</h2>
        <NotificationsToggle />
        <PushHourSelect initialHour={profile?.push_hour ?? 8} />
      </section>

      <Link
        href="/recap"
        className="hover-lift shadow-card block rounded-[18px] bg-card p-4 text-sm font-medium text-primary"
      >
        Voir le récap du mois dernier →
      </Link>

      <section className="space-y-3">
        <h2 className="text-[13.5px] font-bold">Vacances</h2>
        <VacationCard
          start={streak?.vacation_start ?? null}
          end={streak?.vacation_end ?? null}
          remaining={Math.max(
            0,
            14 -
              (streak?.vacation_year === Number(parisToday().slice(0, 4))
                ? (streak?.vacation_days_used ?? 0)
                : 0)
          )}
          today={parisToday()}
        />
      </section>

      <form action="/auth/signout" method="post" className="pt-2">
        <button
          type="submit"
          className="min-h-12 w-full rounded-full px-6 py-3 font-medium text-ink-soft transition active:scale-[0.98]"
          style={{ border: "1.5px solid #ddd6c8" }}
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
