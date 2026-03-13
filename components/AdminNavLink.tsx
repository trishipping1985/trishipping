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
      className={`group relative flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-[#F5C84B]/15 text-[#F5C84B] shadow-[0_0_0_1px_rgba(245,200,75,0.25)]"
          : "text-white/80 hover:bg-white/5 hover:text-white"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-[#F5C84B]" />
      )}

      <span className="ml-2">{label}</span>
    </Link>
  );
}
