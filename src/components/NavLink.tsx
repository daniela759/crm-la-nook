"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({
  href,
  icon,
  children,
  badge,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  badge?: number | string;
}) {
  const pathname = usePathname();
  // Activ când e exact pagina sau o subpagină (ex. /contacte/nou)
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-nook-forest text-nook-paper"
          : "text-nook-ink-soft hover:bg-nook-paper-warm hover:text-nook-ink"
      }`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center ${
          active ? "text-nook-paper" : "text-nook-ink-soft"
        }`}
      >
        {icon}
      </span>
      <span className="flex-1 font-medium">{children}</span>
      {badge != null && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            active
              ? "bg-nook-paper/20 text-nook-paper"
              : "bg-nook-paper-warm text-nook-ink-soft"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
