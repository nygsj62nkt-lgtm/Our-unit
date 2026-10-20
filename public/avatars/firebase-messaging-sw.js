importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB7McjnXFMPyIkIzNML4l2dXzo2Nf2Wvt8',
  authDomain: 'our-unit.firebaseapp.com',
  projectId: 'our-unit',
  storageBucket: 'our-unit.firebasestorage.app',
  messagingSenderId: '136384065875',
  appId: '1:136384065875:web:cb2dac4435893a7e7c31a6'
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'היחידה שלנו';
  const options = {
    body: payload.notification?.body || payload.data?.text || 'יש עדכון חדש',
    data: { url: payload.data?.url || '/' },
    tag: payload.data?.entityId || 'our-unit-update'
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then((list)=>{
    for(const client of list){ if('focus' in client){ client.navigate(url); return client.focus(); } }
    return clients.openWindow ? clients.openWindow(url) : undefined;
  }));
});
