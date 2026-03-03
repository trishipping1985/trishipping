"use client";

import Link from "next/link";

export default function AdminNavLink() {
  // IMPORTANT: admin pages live under /admin/*
  return (
    <Link
      href="/admin/packages"
      className="px-4 py-2 rounded bg-[#111827] hover:bg-[#1f2937]"
    >
      Admin
    </Link>
  );
}
