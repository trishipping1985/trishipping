"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  label: string;
  onClick?: () => void;
};

export default function AdminNavLink({ href, label, onClick }: Props) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex items-center overflow-hidden rounded-2xl px-5 py-3.5 text-[15px] font-semibold transition-all duration-200 ${
        active
          ? "border border-[#F5C84B]/20 bg-[linear-gradient(90deg,rgba(245,200,75,0.16),rgba(245,200,75,0.06))] text-white shadow-[0_10px_30px_rgba(245,200,75,0.08)]"
          : "border border-transparent text-white/75 hover:border-white/8 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      <span
        className={`absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200 ${
          active
            ? "bg-[#F5C84B] shadow-[0_0_14px_rgba(245,200,75,0.65)]"
            : "bg-transparent group-hover:bg-white/20"
        }`}
      />

      <span
        className={`relative z-10 ml-3 tracking-[0.01em] transition-all duration-200 ${
          active ? "font-bold text-[#FFF4CC]" : "font-semibold"
        }`}
      >
        {label}
      </span>

      <span
        className={`pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-200 ${
          active
            ? "bg-[radial-gradient(circle_at_left,rgba(245,200,75,0.14),transparent_38%)] opacity-100"
            : "bg-[radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_38%)] opacity-0 group-hover:opacity-100"
        }`}
      />

      {active && (
        <span className="pointer-events-none absolute inset-y-[7px] right-3 w-12 rounded-full bg-[radial-gradient(circle,rgba(245,200,75,0.18),transparent_70%)] blur-md" />
      )}
    </Link>
  );
}