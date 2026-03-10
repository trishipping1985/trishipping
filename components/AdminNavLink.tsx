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
      className={`block px-4 py-3 rounded-xl transition ${
        active
          ? "bg-[#F5C84B] text-black font-semibold"
          : "text-white/80 hover:bg-white/10"
      }`}
    >
      {label}
    </Link>
  );
}
