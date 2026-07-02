"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      isPluginAvailable?: (name: string) => boolean;
    };
  }
}

function isAndroidDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export default function NotificationPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAndroidDevice()) return;

    const alreadyDismissed =
      window.localStorage.getItem("tri-notification-prompt-dismissed") === "true";

    if (alreadyDismissed) return;

    const timer = window.setTimeout(() => {
      setShow(true);
    }, 700);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleAllow() {
    try {
      setLoading(true);

      if (typeof window !== "undefined") {
        window.localStorage.setItem("tri-notification-prompt-dismissed", "true");
      }

      if (typeof window !== "undefined" && window.Capacitor?.isPluginAvailable?.("PushNotifications")) {
        const mod = await import("@capacitor/push-notifications");
        const PushNotifications = mod.PushNotifications;

        let permission = await PushNotifications.checkPermissions();

        if (permission.receive !== "granted") {
          permission = await PushNotifications.requestPermissions();
        }

        if (permission.receive === "granted") {
          await PushNotifications.register();
        }
      } else if (typeof Notification !== "undefined" && Notification.permission === "default") {
        await Notification.requestPermission();
      }

      setShow(false);
    } catch (error) {
      console.error("Notification permission prompt error:", error);
      setShow(false);
    } finally {
      setLoading(false);
    }
  }

  function handleNotNow() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("tri-notification-prompt-dismissed", "true");
    }

    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 md:hidden">
      <div className="w-full rounded-[24px] border border-[#F5C84B]/30 bg-[#081020] p-5 shadow-2xl shadow-black/50">
        <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#F5C84B]">
          TRI Shipping
        </div>

        <h2 className="mt-2 text-xl font-black text-white">
          Enable TRI Shipping Notifications
        </h2>

        <p className="mt-2 text-sm leading-6 text-white/70">
          Get package updates, shipment status changes, and delivery alerts directly on this phone.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleNotNow}
            disabled={loading}
            className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-bold text-white/70 disabled:opacity-50"
          >
            Not now
          </button>

          <button
            type="button"
            onClick={handleAllow}
            disabled={loading}
            className="rounded-2xl bg-[#F5C84B] px-4 py-3 text-sm font-black text-[#081020] disabled:opacity-50"
          >
            {loading ? "Opening..." : "Allow"}
          </button>
        </div>
      </div>
    </div>
  );
}
