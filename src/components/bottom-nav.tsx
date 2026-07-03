"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Aujourd'hui", icon: "☀️" },
  { href: "/revisions", label: "Révisions", icon: "🔁" },
  { href: "/classement", label: "Classement", icon: "🏆" },
  { href: "/bibliotheque", label: "Bibliothèque", icon: "📚" },
  { href: "/profil", label: "Profil", icon: "👤" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
      <div className="mx-auto flex max-w-[600px] items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-h-14 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${
                active
                  ? "font-semibold text-orange-600 dark:text-orange-400"
                  : "text-stone-500 dark:text-stone-400"
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                {tab.icon}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
