// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQTf8X_KYSo7969Ss1-0a3a-wwyT55nEo",
  authDomain: "rwady-4f7a2.firebaseapp.com",
  projectId: "rwady-4f7a2",
  storageBucket: "rwady-4f7a2.firebasestorage.app",
  messagingSenderId: "189406462238",
  appId: "1:189406462238:web:0b9b6ace58b55c7907c90f",
  measurementId: "G-3NVZZVVYWV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: any = null;
if (typeof window !== 'undefined') {
  messaging = getMessaging(app);
}

// VAPID Key for web push
const VAPID_KEY = "BAsbppFmvRVKDynGLmh8RXF9B80PJKh-cVa3uTGamMOv1R-mf7TtsDRyIVKZXwNBMtLaXKhO1CpdJBxvqSslEfo";

// Function to request notification permission and get token
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      console.log('Messaging not available');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });
      
      if (currentToken) {
        console.log('Registration token:', currentToken);
        // Send the token to your server and update the UI if necessary
        return currentToken;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Unable to get permission to notify.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

// Function to handle foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) {
      console.log('Messaging not available');
      return;
    }
    
    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      resolve(payload);
    });
  });

// Function to show maintenance notification
export const showMaintenanceNotification = (isMaintenanceMode: boolean) => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    const title = isMaintenanceMode ? 'الموقع تحت الصيانة' : 'الموقع متاح الآن';
    const body = isMaintenanceMode 
      ? 'الموقع في وضع الصيانة حالياً. سيكون متاحاً قريباً.' 
      : 'الموقع أصبح متاحاً الآن ويمكنك المتابعة بشكل طبيعي.';
    const icon = '/favicon.ico';

    new Notification(title, {
      body,
      icon,
      badge: icon,
      requireInteraction: true,
      tag: 'maintenance-status'
    });
  }
};

// Function to get stored device token
export const getStoredDeviceToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('device_token');
  }
  return null;
};

// Function to clear stored device token
export const clearStoredDeviceToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('device_token');
  }
};

export { app, analytics, messaging };
