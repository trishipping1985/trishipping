"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminNavLink() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        if (!cancelled) setIsAdmin(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const role = profile?.role ? String(profile.role) : "client";
      if (!cancelled) setIsAdmin(role === "admin");
    }

    run();

    const { data: sub } = supabase.auth.onAuthStateChange(() => run());
    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  if (!isAdmin) return null;

  const active =
    pathname === "/dashboard/admin" ||
    pathname.startsWith("/dashboard/admin/");

  return (
    <Link
      href="/dashboard/admin/packages"
      className={[
        "block w-full rounded-xl px-4 py-3 text-left transition",
        active
          ? "bg-[#caa24a] text-black"
          : "bg-white/5 text-white hover:bg-white/10",
      ].join(" ")}
    >
      Admin
    </Link>
  );
}
