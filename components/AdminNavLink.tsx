"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  label: string;
};

export default function AdminNavLink({ href, label }: Props) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`group relative flex items-center overflow-hidden rounded-2xl px-5 py-3.5 text-[15px] font-semibold transition-all duration-200 ${
        active
          ? "bg-[linear-gradient(90deg,rgba(245,200,75,0.18),rgba(245,200,75,0.08))] text-[#F5C84B] shadow-[0_0_0_1px_rgba(245,200,75,0.22)]"
          : "text-white/80 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-7 w-1.5 -translate-y-1/2 rounded-r-full bg-[#F5C84B]" />
      )}

      <span
        className={`ml-3 tracking-[0.01em] ${
          active ? "font-bold" : "font-semibold"
        }`}
      >
        {label}
      </span>

      <span
        className={`absolute inset-0 rounded-2xl transition-opacity duration-200 ${
          active
            ? "bg-[radial-gradient(circle_at_left,rgba(245,200,75,0.08),transparent_35%)] opacity-100"
            : "opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_left,rgba(255,255,255,0.05),transparent_35%)]"
        }`}
      />
    </Link>
  );
}
