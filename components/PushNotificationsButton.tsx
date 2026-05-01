"use client";

import { useCallback, useEffect, useState } from "react";
import { FirebaseOptions, getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

let firebaseConfigPromise: Promise<FirebaseOptions> | null = null;

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
  const [status, setStatus] = useState("Checking notification status...");
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const saveNotificationToken = useCallback(
    async ({ askPermission }: { askPermission: boolean }) => {
      if (typeof window === "undefined") return false;

      const hasNotification = "Notification" in window;
      const hasServiceWorker = "serviceWorker" in navigator;
      const firebaseSupported = await isSupported().catch(() => false);

      if (!hasNotification || !hasServiceWorker || !firebaseSupported) {
        setSupported(false);
        setEnabled(false);
        setStatus("Push notifications are not supported on this browser.");
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
        setStatus("Notifications are available. Tap to enable.");
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

        const hasNotification = "Notification" in window;
        const hasServiceWorker = "serviceWorker" in navigator;
        const firebaseSupported = await isSupported().catch(() => false);

        if (!hasNotification || !hasServiceWorker || !firebaseSupported) {
          setSupported(false);
          setEnabled(false);
          setStatus("Push notifications are not supported on this browser.");
          return;
        }

        setSupported(true);

        if (Notification.permission === "granted") {
          setStatus("Notifications are already allowed. Saving this device...");
          await saveNotificationToken({ askPermission: false });
        } else if (Notification.permission === "denied") {
          setEnabled(false);
          setStatus("Notifications are blocked. Enable them from phone settings.");
        } else {
          setEnabled(false);
          setStatus("Notifications are available. Tap to enable.");
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

      const firebaseSupported = await isSupported().catch(() => false);
      if (!firebaseSupported) return;

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

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
      <div className="text-sm font-semibold">TRI Shipping Notifications</div>

      <p className="mt-1 text-xs text-white/60">{status}</p>

      {!checking && !enabled ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={enablePushNotifications}
            disabled={loading || !supported}
            className="w-full rounded-xl bg-white px-4 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Enabling..." : "Enable notifications"}
          </button>
        </div>
      ) : null}
    </div>
  );
}