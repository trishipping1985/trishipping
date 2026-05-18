"use client";

import { useCallback, useEffect, useState } from "react";
import type { FirebaseOptions } from "firebase/app";
import { getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";
import { supabase } from "@/lib/supabaseClient";

let firebaseConfigPromise: Promise<FirebaseOptions> | null = null;

type SupportCheckResult = {
  supported: boolean;
  reason: string;
};

function getReadableError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const value = error as { code?: string; message?: string };
    return value.message || value.code || JSON.stringify(value);
  }

  return String(error);
}

async function checkPushSupport(): Promise<SupportCheckResult> {
  if (typeof window === "undefined") {
    return {
      supported: false,
      reason: "Notifications can only be checked in the browser.",
    };
  }

  if (!window.isSecureContext) {
    return {
      supported: false,
      reason: "Notifications require HTTPS.",
    };
  }

  if (!("Notification" in window)) {
    return {
      supported: false,
      reason: "This browser does not support notifications.",
    };
  }

  if (!("serviceWorker" in navigator)) {
    return {
      supported: false,
      reason: "This browser does not support service workers.",
    };
  }

  if (!("PushManager" in window)) {
    return {
      supported: false,
      reason: "This browser does not support push notifications.",
    };
  }

  const firebaseSupported = await isSupported().catch(() => false);

  if (!firebaseSupported) {
    return {
      supported: false,
      reason: "Firebase messaging is not supported on this browser.",
    };
  }

  return {
    supported: true,
    reason: "Notifications are supported.",
  };
}

async function loadFirebaseConfig() {
  if (firebaseConfigPromise) {
    return firebaseConfigPromise;
  }

  firebaseConfigPromise = fetch("/api/firebase-config", {
    cache: "no-store",
  }).then(async (response) => {
    const json = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        json?.error ||
          json?.missingKeys?.join(", ") ||
          "Failed to load Firebase config."
      );
    }

    return {
      apiKey: json.apiKey,
      authDomain: json.authDomain,
      projectId: json.projectId,
      storageBucket: json.storageBucket,
      messagingSenderId: json.messagingSenderId,
      appId: json.appId,
    } as FirebaseOptions;
  });

  return firebaseConfigPromise;
}

async function getFirebaseClientApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const firebaseConfig = await loadFirebaseConfig();
  return initializeApp(firebaseConfig);
}

async function waitForActiveServiceWorker(
  registration: ServiceWorkerRegistration
) {
  if (registration.active) {
    return registration;
  }

  const serviceWorker =
    registration.installing || registration.waiting || registration.active;

  if (!serviceWorker) {
    await navigator.serviceWorker.ready;
    return registration;
  }

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => {
      resolve();
    }, 8000);

    serviceWorker.addEventListener("statechange", () => {
      if (serviceWorker.state === "activated") {
        window.clearTimeout(timeout);
        resolve();
      }
    });
  });

  await navigator.serviceWorker.ready;
  return registration;
}

export default function PushNotificationsButton() {
  const [status, setStatus] = useState("Checking notification status...");
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const saveNotificationToken = useCallback(
    async ({ askPermission }: { askPermission: boolean }) => {
      if (typeof window === "undefined") return false;

      const supportCheck = await checkPushSupport();

      if (!supportCheck.supported) {
        setSupported(false);
        setEnabled(false);
        setStatus(supportCheck.reason);
        return false;
      }

      setSupported(true);

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

      if (!vapidKey) {
        setEnabled(false);
        setStatus("Firebase VAPID key is missing.");
        return false;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setEnabled(false);
        setStatus("Please sign in first, then enable notifications.");
        return false;
      }

      let permission = Notification.permission;

      if (askPermission) {
        setStatus("Requesting notification permission...");
        permission = await Notification.requestPermission();
      }

      if (permission === "denied") {
        setEnabled(false);
        setStatus("Notifications are blocked. Enable them from phone settings.");
        return false;
      }

      if (permission !== "granted") {
        setEnabled(false);
        setStatus("Notifications are available. Tap enable.");
        return false;
      }

      setStatus("Saving this device for notifications...");

      const existingRegistration = await navigator.serviceWorker.getRegistration(
        "/"
      );

      if (existingRegistration) {
        await existingRegistration.update();
      }

      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        {
          scope: "/",
          updateViaCache: "none",
        }
      );

      await waitForActiveServiceWorker(registration);

      const app = await getFirebaseClientApp();
      const messaging = getMessaging(app);

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        setEnabled(false);
        setStatus("Could not create notification token.");
        return false;
      }

      const { error } = await supabase.from("notification_tokens").upsert(
        {
          user_id: user.id,
          token,
          platform: "web",
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,token",
        }
      );

      if (error) {
        console.error("Supabase notification token error:", error);
        setEnabled(false);
        setStatus(`Token created, but Supabase save failed: ${error.message}`);
        return false;
      }

      setEnabled(true);
      setStatus("Notifications enabled successfully.");
      return true;
    },
    []
  );

  useEffect(() => {
    async function checkSupportAndAutoSave() {
      try {
        setChecking(true);
        setStatus("Checking notification status...");

        if (typeof window === "undefined") return;

        const supportCheck = await checkPushSupport();

        if (!supportCheck.supported) {
          setSupported(false);
          setEnabled(false);
          setStatus(supportCheck.reason);
          return;
        }

        setSupported(true);

        if (Notification.permission === "granted") {
          setStatus("Notifications are allowed. Saving this device...");
          await saveNotificationToken({ askPermission: false });
        } else if (Notification.permission === "denied") {
          setEnabled(false);
          setStatus("Notifications are blocked. Enable them from phone settings.");
        } else {
          setEnabled(false);
          setStatus("Notifications are available. Tap enable.");
        }
      } catch (error) {
        console.error("Auto-save notification token error:", error);
        setEnabled(false);
        setStatus(`Auto-save failed: ${getReadableError(error)}`);
      } finally {
        setChecking(false);
      }
    }

    checkSupportAndAutoSave();
  }, [saveNotificationToken]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function listenForForegroundMessages() {
      if (typeof window === "undefined") return;

      const supportCheck = await checkPushSupport();
      if (!supportCheck.supported) return;

      const app = await getFirebaseClientApp();
      const messaging = getMessaging(app);

      unsubscribe = onMessage(messaging, (payload) => {
        console.log("TRI Shipping foreground message:", payload);

        const title = payload.notification?.title || "TRI Shipping Update";
        const body =
          payload.notification?.body || "You have a new package status update.";

        if (Notification.permission === "granted") {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
              body,
              icon: "/trilogo.png",
              badge: "/trilogo.png",
              data: {
                url: payload.fcmOptions?.link || "/dashboard",
              },
              requireInteraction: true,
            });
          });
        }
      });
    }

    listenForForegroundMessages();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  async function enablePushNotifications() {
    try {
      setLoading(true);
      setStatus("Checking notification setup...");
      await saveNotificationToken({ askPermission: true });
    } catch (error) {
      console.error("Enable push notification error:", error);
      setEnabled(false);
      setStatus(`Notification setup failed: ${getReadableError(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function sendTestNotification() {
    try {
      setTesting(true);
      setStatus("Sending test notification...");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setStatus("Please sign in again before sending a test notification.");
        return;
      }

      const response = await fetch("/api/send-test-notification", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus(json?.error || "Failed to send test notification.");
        return;
      }

      setStatus("Test notification sent successfully.");
    } catch (error) {
      console.error("Send test notification error:", error);
      setStatus(`Test failed: ${getReadableError(error)}`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4 text-white shadow-[0_14px_40px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-black leading-tight text-white">
            TRI Shipping Notifications
          </div>

          <p className="mt-1 text-xs leading-5 text-white/55">{status}</p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
            enabled
              ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
              : supported
              ? "border-[#F5C84B]/20 bg-[#F5C84B]/10 text-[#F5C84B]"
              : "border-white/10 bg-white/5 text-white/45"
          }`}
        >
          {enabled ? "On" : supported ? "Ready" : "Off"}
        </span>
      </div>

      {!checking && !enabled && supported ? (
        <button
          type="button"
          onClick={enablePushNotifications}
          disabled={loading}
          className="mt-3 w-full rounded-2xl bg-[#F5C84B] px-4 py-2.5 text-sm font-black text-black transition hover:bg-[#f8d76a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Enabling..." : "Enable notifications"}
        </button>
      ) : null}

      {!checking && enabled ? (
        <button
          type="button"
          onClick={sendTestNotification}
          disabled={testing}
          className="mt-3 w-full rounded-2xl border border-[#F5C84B]/25 bg-[#F5C84B]/10 px-4 py-2.5 text-sm font-black text-[#F5C84B] transition hover:bg-[#F5C84B]/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {testing ? "Sending test..." : "Send test notification"}
        </button>
      ) : null}
    </div>
  );
}