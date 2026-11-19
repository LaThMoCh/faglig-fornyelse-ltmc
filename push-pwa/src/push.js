const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY;


// Convert VAPID public key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    rawData,
    (character) => character.charCodeAt(0)
  );
}


// Check browser support
function checkSupport() {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}


// Save subscription on backend
async function saveSubscription(subscription) {
  const response = await fetch(
    `${API_URL}/api/subscribe`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        subscription: subscription.toJSON()
      })
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save subscription");
  }

  return response.json();
}


// Get existing subscription
export async function getCurrentSubscription() {
  if (!checkSupport()) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription =
    await registration.pushManager.getSubscription();

  if (subscription) {
    try {
      await saveSubscription(subscription);
    } catch (error) {
      console.error(
        "Could not sync subscription with server:",
        error
      );
    }
  }

  return subscription;
}


// Subscribe to push notifications
export async function subscribeToPush() {
  if (!checkSupport()) {
    throw new Error(
      "Push notifications are not supported"
    );
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error("Missing VAPID public key");
  }

  // Request permission
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Notification permission denied");
  }

  // Get service worker
  const registration = await navigator.serviceWorker.ready;

  // Check for existing subscription
  let subscription =
    await registration.pushManager.getSubscription();

  // Create subscription if needed
  if (!subscription) {
    subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,

        applicationServerKey:
          urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
  }

  // Save subscription on backend
  await saveSubscription(subscription);

  return subscription;
}


// Unsubscribe from push notifications
export async function unsubscribeFromPush(subscription) {
  const response = await fetch(
    `${API_URL}/api/subscribe`,
    {
      method: "DELETE",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        endpoint: subscription.endpoint
      })
    }
  );

  if (!response.ok) {
    throw new Error("Failed to remove server subscription");
  }

  await subscription.unsubscribe();
}


export async function schedulePushNotification({ title, minutes, seconds }) {
  const response = await fetch(
    `${API_URL}/api/schedule-notification`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title, minutes, seconds })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to schedule notification");
  }

  return result;
}