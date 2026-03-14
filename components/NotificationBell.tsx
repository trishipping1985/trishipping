"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadUnreadCount() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUnreadCount(0);
      return;
    }

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setUnreadCount(count || 0);
  }

  useEffect(() => {
    loadUnreadCount();

    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        async () => {
          await loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Link
      href="/dashboard/notifications"
      className="group relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-all duration-200 hover:border-[#F5C84B]/25 hover:bg-white/10"
      aria-label="Notifications"
    >
      <span className="text-lg transition-transform duration-200 group-hover:scale-105">
        🔔
      </span>

      {unreadCount > 0 ? (
        <span className="absolute -right-2 -top-2 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full border border-[#F5C84B]/30 bg-[#F5C84B] px-1.5 text-[10px] font-black text-black shadow-[0_8px_20px_rgba(245,200,75,0.35)]">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white/15 transition-colors duration-200 group-hover:bg-[#F5C84B]/40" />
      )}
    </Link>
  );
}
