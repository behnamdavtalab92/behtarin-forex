const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Generate unique user ID
function getUserId() {
  let userId = localStorage.getItem('push_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('push_user_id', userId);
  }
  return userId;
}

// Check if push notifications are supported
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Check if already subscribed
export async function isSubscribed() {
  if (!isPushSupported()) return false;
  
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}

// Get VAPID public key from server
async function getVapidPublicKey() {
  const response = await fetch(`${API_URL}/push/vapid-public-key`);
  const data = await response.json();
  return data.publicKey;
}

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Subscribe to push notifications
export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported');
  }

  // Request notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied');
  }

  // Register service worker
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  // Get VAPID public key
  const vapidPublicKey = await getVapidPublicKey();
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

  // Subscribe
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey
  });

  // Send subscription to server
  const userId = getUserId();
  const response = await fetch(`${API_URL}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription, userId })
  });

  if (!response.ok) {
    throw new Error('Failed to subscribe on server');
  }

  console.log('✅ Subscribed to push notifications');
  return true;
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush() {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  
  if (subscription) {
    await subscription.unsubscribe();
  }

  // Remove from server
  const userId = getUserId();
  await fetch(`${API_URL}/push/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });

  console.log('✅ Unsubscribed from push notifications');
  return true;
}

