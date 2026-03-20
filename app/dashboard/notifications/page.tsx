"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type NotificationRow = {
  id: string;
  user_id: string;
  title: string | null;
  message: string | null;
  type: string | null;
  tracking_code: string | null;
  link: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

function typeBadgeClasses(type: string | null) {
  const value = String(type || "").trim().toLowerCase();

  if (value === "status") {
    return "border-sky-400/30 bg-sky-500/15 text-sky-300";
  }

  if (value === "photo") {
    return "border-purple-400/30 bg-purple-500/15 text-purple-300";
  }

  if (value === "package") {
    return "border-yellow-400/30 bg-yellow-500/15 text-yellow-300";
  }

  if (value === "delivery") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
  }

  return "border-white/10 bg-black/20 text-white/80";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadNotifications() {
    setLoading(true);
    setError("");
    setMessage("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setNotifications([]);
      setError(authError?.message || "User not found");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, title, message, type, tracking_code, link, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setNotifications([]);
      setError(error.message);
      setLoading(false);
      return;
    }

    setNotifications((data || []) as NotificationRow[]);
    setLoading(false);
  }

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel("notifications-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        async () => {
          await loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !item.is_read).length;
  }, [notifications]);

  async function markOneAsRead(notificationId: string) {
    setWorkingId(notificationId);
    setError("");
    setMessage("");

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      setWorkingId(null);
      setError(error.message);
      return;
    }

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId ? { ...item, is_read: true } : item
      )
    );

    setWorkingId(null);
  }

  async function markAllAsRead() {
    setMarkingAll(true);
    setError("");
    setMessage("");

    const unreadIds = notifications
      .filter((item) => !item.is_read)
      .map((item) => item.id);

    if (unreadIds.length === 0) {
      setMarkingAll(false);
      setMessage("No unread notifications.");
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (error) {
      setMarkingAll(false);
      setError(error.message);
      return;
    }

    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        is_read: true,
      }))
    );

    setMarkingAll(false);
    setMessage("All notifications marked as read.");
  }

  return (
    <main className="min-h-screen bg-[#071427] px-3 py-3 text-white sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-[22px] border border-[#F5C84B]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[28px] sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(245,200,75,0.05),transparent)]" />
          <div className="absolute -right-16 top-0 h-32 w-32 rounded-full bg-[#F5C84B]/10 blur-3xl sm:h-40 sm:w-40" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5C84B] sm:px-4 sm:text-xs sm:tracking-[0.3em]">
                TRI Shipping Dashboard
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:mt-4 sm:text-4xl">
                Notifications
              </h1>

              <p className="mt-2 text-sm leading-6 text-white/65 sm:mt-3 sm:text-base sm:leading-7">
                Track package updates, photo uploads, shipment changes, and delivery alerts.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80 backdrop-blur-xl">
                Unread: <span className="font-bold text-[#F5C84B]">{unreadCount}</span>
              </div>

              <button
                type="button"
                onClick={markAllAsRead}
                disabled={markingAll || unreadCount === 0}
                className="rounded-2xl bg-[#F5C84B] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {markingAll ? "Marking..." : "Mark All Read"}
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-4 text-sm text-red-300 sm:mt-5 sm:px-5">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-4 rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-4 py-4 text-sm text-white sm:mt-5 sm:px-5">
            {message}
          </div>
        ) : null}

        <section className="mt-4 overflow-hidden rounded-[22px] border border-[#F5C84B]/10 bg-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:mt-5 sm:rounded-[30px]">
          {loading ? (
            <div className="p-5 text-sm text-white/70 sm:p-6">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-5 text-sm text-white/70 sm:p-6">
              No notifications yet.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {notifications.map((item) => {
                const destination =
                  item.link ||
                  (item.tracking_code
                    ? `/track/${encodeURIComponent(item.tracking_code)}`
                    : null);

                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 ${
                      item.is_read ? "bg-transparent" : "bg-[#F5C84B]/5"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2.5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] sm:text-xs sm:tracking-[0.2em] ${typeBadgeClasses(
                              item.type
                            )}`}
                          >
                            {item.type || "general"}
                          </span>

                          {!item.is_read ? (
                            <span className="inline-flex rounded-full border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5C84B] sm:text-xs sm:tracking-[0.2em]">
                              Unread
                            </span>
                          ) : null}
                        </div>

                        <h2 className="text-lg font-bold text-white sm:text-xl">
                          {item.title || "Shipment Update"}
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-white/75 sm:text-base sm:leading-7">
                          {item.message || "Your shipment has a new update."}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/55 sm:text-sm">
                          <span>{formatDateTime(item.created_at)}</span>

                          {item.tracking_code ? (
                            <span className="font-semibold text-[#F5C84B]">
                              {item.tracking_code}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        {destination ? (
                          <Link
                            href={destination}
                            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white transition hover:bg-black/30"
                          >
                            Open
                          </Link>
                        ) : null}

                        {!item.is_read ? (
                          <button
                            type="button"
                            onClick={() => markOneAsRead(item.id)}
                            disabled={workingId === item.id}
                            className="inline-flex items-center justify-center rounded-2xl bg-[#F5C84B] px-4 py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {workingId === item.id ? "Marking..." : "Mark Read"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/35"
                          >
                            Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
