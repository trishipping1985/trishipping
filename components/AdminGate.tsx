"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeRole(role?: string | null) {
  return String(role || "").trim().toLowerCase();
}

export default function AdminGate({
  children,
  redirectTo = "/dashboard",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function getSessionWithRetry() {
      const firstCheck = await supabase.auth.getSession();

      if (firstCheck.data.session?.user) {
        return firstCheck.data.session;
      }

      await wait(800);

      const secondCheck = await supabase.auth.getSession();
      return secondCheck.data.session;
    }

    async function run() {
      setChecking(true);

      const session = await getSessionWithRetry();
      const user = session?.user;

      if (cancelled) return;

      if (!user) {
        setOk(false);
        setChecking(false);

        setTimeout(() => {
          if (!cancelled) router.replace("/login");
        }, 500);

        return;
      }

      let role = "client";

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (userData?.role) {
        role = normalizeRole(userData.role);
      } else {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        role = normalizeRole(profileData?.role) || "client";
      }

      const allowedAdmin = role === "admin" || role === "owner";

      if (!allowedAdmin) {
        setOk(false);
        setChecking(false);
        router.replace(redirectTo);
        return;
      }

      setOk(true);
      setChecking(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [router, redirectTo]);

  if (checking) return null;
  if (!ok) return null;

  return <>{children}</>;
}