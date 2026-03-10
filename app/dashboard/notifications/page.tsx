"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Notification = {
  id: string;
  tracking_code: string;
  message: string;
  status: string;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setNotifications(data);
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold text-[#F5C84B] mb-8">
          Notifications
        </h1>

        <div className="space-y-4">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="bg-white/5 border border-white/10 p-5 rounded-xl"
            >
              <div className="text-lg font-semibold">
                {n.message}
              </div>

              <div className="text-sm text-white/60 mt-2">
                {new Date(n.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
