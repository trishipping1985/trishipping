"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type UserRow = {
  id: string;
  role: string | null;
};

export default function AdminNavLink() {
  const [canSee, setCanSee] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCanSee(false);
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      const row = data as UserRow | null;
      const role = String(row?.role || "").trim().toLowerCase();

      setCanSee(role === "admin" || role === "owner");
    }

    checkAdmin();
  }, []);

  if (!canSee) return null;

  return (
    <Link
      href="/dashboard/update-status"
      className="px-4 py-2 rounded bg-[#111827] hover:bg-[#1f2937]"
    >
      Update Status
    </Link>
  );
}
