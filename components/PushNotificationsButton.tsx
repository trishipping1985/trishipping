"use client";

import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";
import { createClient } from "@supabase/supabase-js";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env
    .NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

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
    serviceWorker.addEventListener("statechange", () => {
      if (serviceWorker.state === "activated") {
        resolve();
      }
    });
  });

  await navigator.serviceWorker.ready;
  return registration;
}

export default function PushNotificationsButton() {
  const [status, setStatus] = useState("Checking notification support...");
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    async function checkSupport() {
      if (typeof window === "undefined") return;

      const hasNotification = "Notification" in window;
      const hasServiceWorker = "serviceWorker" in navigator;
      const firebaseSupported = await isSupported().catch(() => false);

      if (!hasNotification || !hasServiceWorker || !firebaseSupported) {
        setSupported(false);
        setStatus("Push notifications are not supported on this browser.");
        return;
      }

      setSupported(true);

      if (Notification.permission === "granted") {
        setStatus("Notifications are already allowed. Tap to save this device.");
      } else if (Notification.permission === "denied") {
        setStatus("Notifications are blocked. Enable them from browser settings.");
      } else {
        setStatus("Notifications are available. Tap to enable.");
      }
    }

    checkSupport();
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function listenForForegroundMessages() {
      if (typeof window === "undefined") return;

      const firebaseSupported = await isSupported().catch(() => false);
      if (!firebaseSupported) return;

      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
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

      if (!supported) {
        setStatus("Push notifications are not supported on this browser.");
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

      if (!vapidKey) {
        setStatus("Firebase VAPID key is missing in .env.local.");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setStatus("Please sign in first, then enable notifications.");
        return;
      }

      setStatus("Requesting notification permission...");

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus("Notification permission was not allowed.");
        return;
      }

      setStatus("Registering notification service...");

      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        {
          scope: "/",
        }
      );

      await waitForActiveServiceWorker(registration);

      setStatus("Creating notification token...");

      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const messaging = getMessaging(app);

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        setStatus("Could not create notification token.");
        return;
      }

      setStatus("Saving notification token...");

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
        setStatus("Token was created, but saving to Supabase failed.");
        return;
      }

      setStatus("Notifications enabled successfully.");
    } catch (error) {
      console.error("Enable push notification error:", error);
      setStatus("Something went wrong while enabling notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function sendTestNotification() {
    try {
      setTestLoading(true);
      setStatus("Sending test notification...");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setStatus("Please sign in first, then send a test notification.");
        return;
      }

      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("Test notification error:", json);
        setStatus(json?.error || "Test notification failed.");
        return;
      }

      setStatus("Test notification sent successfully.");
    } catch (error) {
      console.error("Send test notification error:", error);
      setStatus("Something went wrong while sending the test notification.");
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
      <div className="text-sm font-semibold">TRI Shipping Notifications</div>

      <p className="mt-1 text-xs text-white/60">{status}</p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={enablePushNotifications}
          disabled={loading || !supported}
          className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Enabling..." : "Enable notifications"}
        </button>

        <button
          type="button"
          onClick={sendTestNotification}
          disabled={testLoading || !supported}
          className="rounded-xl border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-4 py-2 text-sm font-bold text-[#F5C84B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {testLoading ? "Sending..." : "Send test notification"}
        </button>
      </div>
    </div>
  );
}