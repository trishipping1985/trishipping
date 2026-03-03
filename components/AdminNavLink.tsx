"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminNavLink() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        if (mounted) {
          setIsAdmin(false);
          setChecked(true);
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error || !data) {
        setIsAdmin(false);
        setChecked(true);
        return;
      }

      setIsAdmin(data.role === "admin");
      setChecked(true);
    }

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  if (!checked || !isAdmin) return null;

  return (
    <Link
      href="/admin/packages"
      className="block w-full px-4 py-2 rounded bg-[#111827] hover:bg-[#1f2937] text-white text-center font-medium"
    >
      Admin
    </Link>
  );
}
