"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Repeat2, Trophy, BookOpen, CircleUserRound } from "lucide-react";
import { Logo } from "@/components/logo";

const TABS = [
  { href: "/", label: "Jour", labelLong: "Aujourd'hui", Icon: Sun },
  { href: "/revisions", label: "Réviser", labelLong: "Révisions", Icon: Repeat2 },
  { href: "/classement", label: "Classement", labelLong: "Classement", Icon: Trophy },
  { href: "/bibliotheque", label: "Biblio", labelLong: "Bibliothèque", Icon: BookOpen },
  { href: "/profil", label: "Profil", labelLong: "Profil", Icon: CircleUserRound },
] as const;

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function DueBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-2 -top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-bold text-white">
      {count}
    </span>
  );
}

/** Pill flottante en bas sur mobile. */
export function BottomNav({ dueCount = 0 }: { dueCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 px-4 pb-[max(16px,env(safe-area-inset-bottom))] lg:hidden">
      <div className="shadow-nav mx-auto flex max-w-[600px] items-center justify-around rounded-full bg-card px-2 py-2">
        {TABS.map(({ href, label, Icon }) => {
          const active = isActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`relative flex min-h-11 items-center justify-center gap-1.5 rounded-full transition-colors ${
                active
                  ? "bg-primary-soft px-4 text-primary"
                  : "min-w-11 text-ink-faint"
              }`}
            >
              <span className="relative">
                <Icon size={21} strokeWidth={active ? 2.2 : 1.9} aria-hidden />
                {href === "/revisions" && <DueBadge count={dueCount} />}
              </span>
              {active && (
                <span className="text-[10px] font-bold uppercase tracking-[0.08em]">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Rail latéral sur desktop (≥ lg). */
export function SideNav({ dueCount = 0 }: { dueCount?: number }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[230px] shrink-0 flex-col gap-8 py-8 lg:flex">
      <Link href="/" className="flex items-center gap-2.5 px-4">
        <Logo size={26} />
        <span className="font-display text-[28px] text-primary-deep">Lumen</span>
      </Link>
      <nav className="flex flex-col gap-1.5">
        {TABS.map(({ href, labelLong, Icon }) => {
          const active = isActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-full px-4 py-3 text-[15px] transition-colors ${
                active
                  ? "bg-primary-soft font-bold text-primary"
                  : "font-medium text-ink-soft hover:bg-card"
              }`}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2.2 : 1.9} aria-hidden />
                {href === "/revisions" && <DueBadge count={dueCount} />}
              </span>
              {labelLong}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
