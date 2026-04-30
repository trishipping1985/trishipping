/* TRI Shipping Firebase Cloud Messaging Service Worker */

importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

let messagingReadyPromise = null;

async function initializeFirebaseMessaging() {
  if (messagingReadyPromise) {
    return messagingReadyPromise;
  }

  messagingReadyPromise = fetch("/api/firebase-config")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load Firebase config.");
      }

      return response.json();
    })
    .then((firebaseConfig) => {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      const messaging = firebase.messaging();

      messaging.onBackgroundMessage((payload) => {
        console.log("TRI Shipping background message received:", payload);

        const notificationTitle =
          payload?.notification?.title || "TRI Shipping Update";

        const notificationOptions = {
          body:
            payload?.notification?.body ||
            "You have a new package status update.",
          icon: "/trilogo.png",
          badge: "/trilogo.png",
          data: {
            url:
              payload?.fcmOptions?.link ||
              payload?.data?.url ||
              "/dashboard",
          },
        };

        self.registration.showNotification(
          notificationTitle,
          notificationOptions
        );
      });

      return messaging;
    })
    .catch((error) => {
      console.error("Firebase messaging service worker setup failed:", error);
      throw error;
    });

  return messagingReadyPromise;
}

initializeFirebaseMessaging();

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification?.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }

      return null;
    })
  );
});