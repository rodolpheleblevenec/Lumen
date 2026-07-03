"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Repeat2, Trophy, BookOpen, CircleUserRound } from "lucide-react";

const TABS = [
  { href: "/", label: "Aujourd'hui", Icon: Sun },
  { href: "/revisions", label: "Révisions", Icon: Repeat2 },
  { href: "/classement", label: "Classement", Icon: Trophy },
  { href: "/bibliotheque", label: "Bibliothèque", Icon: BookOpen },
  { href: "/profil", label: "Profil", Icon: CircleUserRound },
] as const;

export function BottomNav({ dueCount = 0 }: { dueCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-[600px] items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex min-h-14 min-w-14 flex-1 flex-col items-center justify-center gap-1 text-[10.5px] transition-colors ${
                active ? "font-semibold text-accent" : "text-ink-soft"
              }`}
            >
              <span className="relative">
                <Icon
                  size={21}
                  strokeWidth={active ? 2.4 : 1.9}
                  aria-hidden
                />
                {href === "/revisions" && dueCount > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9.5px] font-bold text-on-accent">
                    {dueCount}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
