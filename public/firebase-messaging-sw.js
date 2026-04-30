/* TRI Shipping Firebase Cloud Messaging Service Worker */

importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDJNTz4C0BUvBrWS_dGDni-8jpulm8nqBE",
  authDomain: "tri-shipping.firebaseapp.com",
  projectId: "tri-shipping",
  storageBucket: "tri-shipping.firebasestorage.app",
  messagingSenderId: "884336384992",
  appId: "1:884336384992:web:12ce6b8a50131636962985",
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  console.log("TRI Shipping background message received:", payload);

  const notificationTitle =
    payload?.notification?.title || "TRI Shipping Update";

  const notificationOptions = {
    body:
      payload?.notification?.body ||
      "You have a new package status update.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: {
      url: payload?.fcmOptions?.link || "/dashboard",
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

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
    })
  );
});