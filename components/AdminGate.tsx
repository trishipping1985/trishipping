"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminGate({
  children,
  redirectTo = "/dashboard",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // 1) must be logged in
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        if (!cancelled) router.replace("/login");
        return;
      }

      // 2) role must be admin
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const role = !error && profile?.role ? String(profile.role) : "client";

      if (role !== "admin") {
        if (!cancelled) router.replace(redirectTo);
        return;
      }

      if (!cancelled) setOk(true);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [router, redirectTo, pathname]);

  if (!ok) return null;
  return <>{children}</>;
}
