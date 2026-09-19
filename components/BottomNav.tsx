"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MusicNotes, MagnifyingGlass, BookOpenText, Sparkle, ChartBar } from "@phosphor-icons/react";

const TABS = [
  { href: "/masses", label: "Masses", Icon: MusicNotes },
  { href: "/search", label: "Search", Icon: MagnifyingGlass },
  { href: "/library", label: "Library", Icon: BookOpenText },
  { href: "/recommend", label: "AI", Icon: Sparkle, ai: true },
  { href: "/stats", label: "Stats", Icon: ChartBar },
];

export function BottomNav({ showAi }: { showAi: boolean }) {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-void/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-[680px]">
        {TABS.filter((t) => !t.ai || showAi).map(({ href, label, Icon }) => {
          const active = path.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider ${active ? "text-lime" : "text-faint"}`}
              >
                <Icon size={22} weight={active ? "fill" : "regular"} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
