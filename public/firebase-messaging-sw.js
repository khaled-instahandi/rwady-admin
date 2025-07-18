// This a service worker file for background messages.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
firebase.initializeApp({
  apiKey: "AIzaSyBQTf8X_KYSo7969Ss1-0a3a-wwyT55nEo",
  authDomain: "rwady-4f7a2.firebaseapp.com",
  projectId: "rwady-4f7a2",
  storageBucket: "rwady-4f7a2.firebasestorage.app",
  messagingSenderId: "189406462238",
  appId: "1:189406462238:web:0b9b6ace58b55c7907c90f",
  measurementId: "G-3NVZZVVYWV"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'إشعار جديد';
  const notificationOptions = {
    body: payload.notification?.body || 'لديك إشعار جديد',
    icon: '/firebase-logo.png',
    badge: '/firebase-logo.png',
    data: payload.data,
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'عرض',
        icon: '/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'إغلاق',
        icon: '/dismiss-icon.png'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  if (event.action === 'view') {
    // Open the app when user clicks on the notification
    event.waitUntil(
      clients.openWindow('/notifications')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    console.log('Notification dismissed');
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
