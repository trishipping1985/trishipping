"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type DebugState = {
  host: string;
  href: string;
  hasSession: boolean;
  userEmail: string;
  userId: string;
  localStorageKeys: string[];
  error: string;
};

export default function AuthDebugPage() {
  const [debug, setDebug] = useState<DebugState>({
    host: "",
    href: "",
    hasSession: false,
    userEmail: "",
    userId: "",
    localStorageKeys: [],
    error: "",
  });

  async function loadDebug() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      const keys =
        typeof window !== "undefined"
          ? Object.keys(window.localStorage).filter((key) =>
              key.toLowerCase().includes("supabase")
            )
          : [];

      setDebug({
        host: window.location.host,
        href: window.location.href,
        hasSession: Boolean(session?.user),
        userEmail: session?.user?.email || "",
        userId: session?.user?.id || "",
        localStorageKeys: keys,
        error: error?.message || "",
      });
    } catch (err) {
      setDebug((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  useEffect(() => {
    loadDebug();
  }, []);

  return (
    <main className="min-h-screen bg-[#071427] p-6 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-black text-[#F5C84B]">
          TRI Auth Debug
        </h1>

        <p className="mt-2 text-sm text-white/60">
          Temporary session test page. No password or token value is shown.
        </p>

        <div className="mt-6 space-y-3 text-sm">
          <DebugRow label="Host" value={debug.host} />
          <DebugRow label="URL" value={debug.href} />
          <DebugRow label="Has Session" value={debug.hasSession ? "YES" : "NO"} />
          <DebugRow label="User Email" value={debug.userEmail || "-"} />
          <DebugRow label="User ID" value={debug.userId || "-"} />
          <DebugRow
            label="Supabase Storage Keys"
            value={
              debug.localStorageKeys.length > 0
                ? debug.localStorageKeys.join(", ")
                : "No Supabase keys found"
            }
          />
          <DebugRow label="Error" value={debug.error || "-"} />
        </div>

        <button
          type="button"
          onClick={loadDebug}
          className="mt-6 rounded-xl bg-[#F5C84B] px-5 py-3 text-sm font-black text-black"
        >
          Refresh Debug
        </button>
      </div>
    </main>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
        {label}
      </div>
      <div className="mt-2 break-all text-white">{value}</div>
    </div>
  );
}