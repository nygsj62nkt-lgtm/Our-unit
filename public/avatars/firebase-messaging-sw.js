/* Firebase Cloud Messaging service worker for Our Unit */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB7McjnXFMPyIkIzNML4l2dXzo2Nf2Wvt8',
  authDomain: 'our-unit.firebaseapp.com',
  projectId: 'our-unit',
  storageBucket: 'our-unit.firebasestorage.app',
  messagingSenderId: '136384065875',
  appId: '1:136384065875:web:cb2dac4435893a7e7c31a6',
  measurementId: 'G-EVMG15FL0K'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // If FCM already supplied a notification payload, the browser can display it.
  // For data-only messages, display it ourselves.
  if (payload.notification) return;
  const title = payload.data?.title || 'היחידה שלנו';
  const body = payload.data?.body || payload.data?.text || 'יש עדכון חדש ביחידה';
  self.registration.showNotification(title, {
    body,
    tag: payload.data?.entityId || 'our-unit-update',
    data: { url: payload.data?.url || '/' }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow ? clients.openWindow(targetUrl) : undefined;
    })
  );
});
