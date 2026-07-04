"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Repeat2, Trophy, BookOpen, CircleUserRound } from "lucide-react";

const TABS = [
  { href: "/", label: "Jour", Icon: Sun },
  { href: "/revisions", label: "Réviser", Icon: Repeat2 },
  { href: "/classement", label: "Classement", Icon: Trophy },
  { href: "/bibliotheque", label: "Biblio", Icon: BookOpen },
  { href: "/profil", label: "Profil", Icon: CircleUserRound },
] as const;

export function BottomNav({ dueCount = 0 }: { dueCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="shadow-nav mx-auto flex max-w-[600px] items-center justify-around rounded-full bg-card px-2 py-2">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
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
                {href === "/revisions" && dueCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-bold text-white">
                    {dueCount}
                  </span>
                )}
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
