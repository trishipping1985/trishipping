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
    <main className="min-h-screen bg-[#071427] px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/50">
              TRI Shipping Dashboard
            </p>

            <h1 className="mt-3 text-5xl font-extrabold text-[#F5C84B]">
              Notifications
            </h1>

            <p className="mt-2 text-white/65">
              Track package updates, photo uploads, shipment changes, and delivery alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80">
              Unread: <span className="font-bold text-[#F5C84B]">{unreadCount}</span>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={markingAll || unreadCount === 0}
              className="rounded-2xl bg-[#F5C84B] px-5 py-3 font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markingAll ? "Marking..." : "Mark All Read"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-red-300">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-6 rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-5 py-4 text-white">
            {message}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-[#F5C84B]/10 bg-white/[0.04] shadow-2xl backdrop-blur-sm">
          {loading ? (
            <div className="p-6 text-white/70">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-white/70">No notifications yet.</div>
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
                    className={`flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between ${
                      item.is_read ? "bg-transparent" : "bg-[#F5C84B]/5"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${typeBadgeClasses(
                            item.type
                          )}`}
                        >
                          {item.type || "general"}
                        </span>

                        {!item.is_read ? (
                          <span className="inline-flex rounded-full border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#F5C84B]">
                            Unread
                          </span>
                        ) : null}
                      </div>

                      <h2 className="text-xl font-bold text-white">
                        {item.title || "Shipment Update"}
                      </h2>

                      <p className="mt-2 text-white/75">
                        {item.message || "Your shipment has a new update."}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/55">
                        <span>{formatDateTime(item.created_at)}</span>

                        {item.tracking_code ? (
                          <span className="font-semibold text-[#F5C84B]">
                            {item.tracking_code}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {destination ? (
                        <Link
                          href={destination}
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white transition hover:bg-black/30"
                        >
                          Open
                        </Link>
                      ) : null}

                      {!item.is_read ? (
                        <button
                          type="button"
                          onClick={() => markOneAsRead(item.id)}
                          disabled={workingId === item.id}
                          className="rounded-2xl bg-[#F5C84B] px-4 py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
