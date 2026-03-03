"use client";

import Link from "next/link";

export default function AdminNavLink() {
  return (
    <Link
      href="/admin/packages"
      className="
        w-full
        px-4 py-2
        rounded
        border border-yellow-500
        text-yellow-400
        font-medium
        text-center
        hover:bg-yellow-500
        hover:text-black
        transition-all duration-200
        shadow-[0_0_0px_rgba(0,0,0,0)]
        hover:shadow-[0_0_12px_rgba(234,179,8,0.6)]
      "
    >
      Admin Panel
    </Link>
  );
}
