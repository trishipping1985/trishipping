"use client";

import Link from "next/link";

export default function AdminNavLink() {
  return (
    <Link
      href="/admin/packages"
      className="block w-full px-4 py-2 rounded bg-[#111827] hover:bg-[#1f2937] text-white text-center font-medium"
    >
      Admin
    </Link>
  );
}
