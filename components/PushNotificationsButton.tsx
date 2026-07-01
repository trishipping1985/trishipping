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
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import type {
  ActionPerformed,
  PushNotificationSchema,
  Token,
} from "@capacitor/push-notifications";
import { supabase } from "@/lib/supabaseClient";

let firebaseConfigPromise: Promise<FirebaseOptions> | null = null;

type SupportCheckResult = {
  supported: boolean;
  reason: string;
};

type TokenPlatform = "web" | "android" | "ios";

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

function isNativeApp() {
  try {
    return typeof window !== "undefined" && Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function getNativePlatform(): TokenPlatform {
  const platform = Capacitor.getPlatform();

  if (platform === "ios") {
    return "ios";
  }

  return "android";
}

function getSafeNotificationUrl(rawUrl: unknown) {
  if (typeof window === "undefined") {
    return "/dashboard";
  }

  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    return "/dashboard";
  }

  if (rawUrl.startsWith("/")) {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl);

    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }

    return "/dashboard";
  } catch {
    return "/dashboard";
  }
}

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Please sign in first, then enable notifications.");
  }

  return user;
}

async function saveTokenToSupabase({
  userId,
  token,
  platform,
}: {
  userId: string;
  token: string;
  platform: TokenPlatform;
}) {
  const { error } = await supabase.from("notification_tokens").upsert(
    {
      user_id: userId,
      token,
      platform,
      user_agent:
        typeof navigator !== "undefined"
          ? `${platform} | ${navigator.userAgent}`
          : platform,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,token",
    }
  );

  if (error) {
    throw new Error(`Token created, but Supabase save failed: ${error.message}`);
  }
}

async function checkWebPushSupport(): Promise<SupportCheckResult> {
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

function checkNativePushSupport(): SupportCheckResult {
  if (!isNativeApp()) {
    return {
      supported: false,
      reason: "Native notifications are only available inside the Android app.",
    };
  }

  if (!Capacitor.isPluginAvailable("PushNotifications")) {
    return {
      supported: false,
      reason:
        "Native push plugin is not installed in this test app yet. Sync Android and build a test APK.",
    };
  }

  return {
    supported: true,
    reason: "Android app notifications are supported.",
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

async function registerNativePushToken() {
  let registrationListener: PluginListenerHandle | null = null;
  let errorListener: PluginListenerHandle | null = null;
  let timeoutId: number | null = null;
  let settled = false;

  return new Promise<string>(async (resolve, reject) => {
    const cleanup = async () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      await registrationListener?.remove().catch(() => undefined);
      await errorListener?.remove().catch(() => undefined);
    };

    const finish = async (error: unknown, token?: string) => {
      if (settled) return;

      settled = true;
      await cleanup();

      if (error) {
        reject(error);
        return;
      }

      if (!token) {
        reject(new Error("Could not create native notification token."));
        return;
      }

      resolve(token);
    };

    try {
      registrationListener = await PushNotifications.addListener(
        "registration",
        (token: Token) => {
          finish(null, token.value);
        }
      );

      errorListener = await PushNotifications.addListener(
        "registrationError",
        (error) => {
          finish(error);
        }
      );

      timeoutId = window.setTimeout(() => {
        finish(new Error("Timed out while registering this phone."));
      }, 20000);

      await PushNotifications.register();
    } catch (error) {
      await finish(error);
    }
  });
}

export default function PushNotificationsButton() {
  const [status, setStatus] = useState("Checking notification status...");
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [foregroundNotification, setForegroundNotification] = useState<{
    title: string;
    body: string;
    url: string;
  } | null>(null);
  const [currentDeviceToken, setCurrentDeviceToken] = useState<string | null>(null);

  const saveWebNotificationToken = useCallback(
    async ({ askPermission }: { askPermission: boolean }) => {
      if (typeof window === "undefined") return false;

      const supportCheck = await checkWebPushSupport();

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

      const user = await getCurrentUser();

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

      setCurrentDeviceToken(token);

      await saveTokenToSupabase({
        userId: user.id,
        token,
        platform: "web",
      });

      setEnabled(true);
      setStatus("Notifications enabled successfully.");
      return true;
    },
    []
  );

  const saveNativeNotificationToken = useCallback(
    async ({ askPermission }: { askPermission: boolean }) => {
      if (typeof window === "undefined") return false;

      const supportCheck = checkNativePushSupport();

      if (!supportCheck.supported) {
        setSupported(false);
        setEnabled(false);
        setStatus(supportCheck.reason);
        return false;
      }

      setSupported(true);

      const user = await getCurrentUser();

      setStatus("Checking Android notification permission...");

      let permission = await PushNotifications.checkPermissions();

      if (permission.receive !== "granted") {
        if (!askPermission) {
          setEnabled(false);
          setStatus("Android app notifications are available. Tap enable.");
          return false;
        }

        setStatus("Requesting Android notification permission...");
        permission = await PushNotifications.requestPermissions();
      }

      if (permission.receive !== "granted") {
        setEnabled(false);
        setStatus("Notifications are blocked. Enable them from app settings.");
        return false;
      }

      setStatus("Registering this phone for notifications...");

      const token = await registerNativePushToken();

      setCurrentDeviceToken(token);

      await saveTokenToSupabase({
        userId: user.id,
        token,
        platform: getNativePlatform(),
      });

      setEnabled(true);
      setStatus("Android app notifications enabled successfully.");
      return true;
    },
    []
  );

  const saveNotificationToken = useCallback(
    async ({ askPermission }: { askPermission: boolean }) => {
      if (isNativeApp()) {
        return saveNativeNotificationToken({ askPermission });
      }

      return saveWebNotificationToken({ askPermission });
    },
    [saveNativeNotificationToken, saveWebNotificationToken]
  );

  useEffect(() => {
    async function checkSupportAndAutoSave() {
      try {
        setChecking(true);
        setStatus("Checking notification status...");

        if (typeof window === "undefined") return;

        if (isNativeApp()) {
          const supportCheck = checkNativePushSupport();

          if (!supportCheck.supported) {
            setSupported(false);
            setEnabled(false);
            setStatus(supportCheck.reason);
            return;
          }

          setSupported(true);

          const permission = await PushNotifications.checkPermissions();

          if (permission.receive === "granted") {
            setStatus("Android notifications are allowed. Saving this phone...");
            await saveNativeNotificationToken({ askPermission: false });
          } else {
            setEnabled(false);
            setStatus("Android app notifications are available. Tap enable.");
          }

          return;
        }

        const supportCheck = await checkWebPushSupport();

        if (!supportCheck.supported) {
          setSupported(false);
          setEnabled(false);
          setStatus(supportCheck.reason);
          return;
        }

        setSupported(true);

        if (Notification.permission === "granted") {
          setStatus("Notifications are allowed. Saving this device...");
          await saveWebNotificationToken({ askPermission: false });
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
  }, [saveNativeNotificationToken, saveWebNotificationToken]);

  useEffect(() => {
    let unsubscribeWeb: (() => void) | undefined;
    let nativeReceivedListener: PluginListenerHandle | null = null;
    let nativeActionListener: PluginListenerHandle | null = null;
    let mounted = true;

    async function listenForMessages() {
      if (typeof window === "undefined") return;

      if (isNativeApp()) {
        if (!Capacitor.isPluginAvailable("PushNotifications")) return;

        nativeReceivedListener = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification: PushNotificationSchema) => {
            console.log("TRI Shipping native push received:", notification);

            if (!mounted) return;

            setStatus(
              notification.title
                ? `Notification received: ${notification.title}`
                : "New TRI Shipping notification received."
            );
          }
        );

        nativeActionListener = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action: ActionPerformed) => {
            console.log("TRI Shipping native push opened:", action);

            const rawUrl =
              action.notification.data?.url ||
              action.notification.data?.link ||
              "/dashboard";

            window.location.href = getSafeNotificationUrl(rawUrl);
          }
        );

        return;
      }

      const supportCheck = await checkWebPushSupport();
      if (!supportCheck.supported) return;

      const app = await getFirebaseClientApp();
      const messaging = getMessaging(app);

      unsubscribeWeb = onMessage(messaging, (payload) => {
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

    listenForMessages();

    return () => {
      mounted = false;

      if (unsubscribeWeb) unsubscribeWeb();

      nativeReceivedListener?.remove().catch(() => undefined);
      nativeActionListener?.remove().catch(() => undefined);
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

      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: currentDeviceToken,
          platform: isNativeApp() ? getNativePlatform() : "web",
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus(json?.error || "Failed to send test notification.");
        return;
      }

      setStatus(
        isNativeApp()
          ? "Test notification sent. If the app is open, Android may show it inside the app instead of as a popup."
          : "Test notification sent successfully."
      );
    } catch (error) {
      console.error("Send test notification error:", error);
      setStatus(`Test failed: ${getReadableError(error)}`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <>
      {foregroundNotification ? (
        <button
          type="button"
          onClick={() => {
            window.location.href = getSafeNotificationUrl(foregroundNotification.url);
          }}
          className="fixed left-4 right-4 top-4 z-[70] rounded-2xl border border-[#F5C84B]/40 bg-[#081020] p-4 text-left shadow-2xl shadow-black/40 md:hidden"
        >
          <span className="block text-[10px] font-bold uppercase tracking-[0.28em] text-[#F5C84B]">
            TRI Shipping
          </span>
          <span className="mt-1 block text-sm font-black text-white">
            {foregroundNotification.title}
          </span>
          <span className="mt-1 block text-xs leading-5 text-white/70">
            {foregroundNotification.body}
          </span>
        </button>
      ) : null}
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
    </>
  );
}

