import './App.css'
import { useEffect, useState } from "react";

import {
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
  schedulePushNotification
} from "./push";


function App() {
  const [permission, setPermission] = useState(
    () => (
      "Notification" in window
        ? Notification.permission
        : "unsupported"
    )
  );

  const [subscribed, setSubscribed] = useState(false);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [minutes, setMinutes] = useState("0");
  const [seconds, setSeconds] = useState("0");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [scheduling, setScheduling] = useState(false);


  // Check existing subscription
  useEffect(() => {
    let cancelled = false;

    getCurrentSubscription()
      .then((subscription) => {
        if (!cancelled) {
          setSubscribed(Boolean(subscription));
        }
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, []);


  // Enable notifications
  async function handleSubscribe() {
    setLoading(true);
    setMessage("");

    try {
      await subscribeToPush();

      setSubscribed(true);
      setPermission(Notification.permission);

      setMessage("Notifications successfully enabled!");

    } catch (error) {
      setMessage(error.message);

      if ("Notification" in window) {
        setPermission(Notification.permission);
      }

    } finally {
      setLoading(false);
    }
  }


  // Disable notifications
  async function handleUnsubscribe() {
    setLoading(true);
    setMessage("");

    try {
      const subscription = await getCurrentSubscription();

      if (subscription) {
        await unsubscribeFromPush(subscription);
      }

      setSubscribed(false);

      setMessage("Notifications successfully disabled!");

    } catch (error) {
      setMessage(error.message);

    } finally {
      setLoading(false);
    }
  }


  async function handleScheduleNotification(event) {
    event.preventDefault();
    setScheduling(true);
    setScheduleMessage("");

    try {
      const result = await schedulePushNotification({
        title: notificationTitle,
        minutes: Number(minutes),
        seconds: Number(seconds)
      });

      setScheduleMessage(result.message);
      setNotificationTitle("");
    } catch (error) {
      setScheduleMessage(error.message);
    } finally {
      setScheduling(false);
    }
  }


  // Check browser support
  const supported =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;


  if (!supported) {
    return (
      <div>
        <h2>Push Notifications</h2>

        <p>
          Your browser does not support push notifications.
        </p>
      </div>
    );
  }


  return (
    <div className="App">

      <h1>Push Notifications</h1>

      <p>
        Permission: {permission}
      </p>

      <p>
        Subscription: {subscribed ? "Active" : "Inactive"}
      </p>

      {!subscribed ? (

        <button
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading
            ? "Enabling..."
            : "Enable Notifications"}
        </button>

      ) : (

        <button
          onClick={handleUnsubscribe}
          disabled={loading}
        >
          {loading
            ? "Disabling..."
            : "Disable Notifications"}
        </button>

      )}

      {message && (
        <p role="status">
          {message}
        </p>
      )}

      <div className="timed-message">
        <h2>Schedule a notification</h2>

        <p>
          Choose when it should arrive and give it a title.
        </p>

        <form className="schedule-form" onSubmit={handleScheduleNotification}>
          <label>
            Notification title
            <input
              type="text"
              value={notificationTitle}
              onChange={(event) => setNotificationTitle(event.target.value)}
              maxLength={120}
              required
            />
          </label>

          <div className="duration-fields">
            <label>
              Minutes
              <input
                type="number"
                min="0"
                step="1"
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
                required
              />
            </label>
            <label>
              Seconds
              <input
                type="number"
                min="0"
                max="59"
                step="1"
                value={seconds}
                onChange={(event) => setSeconds(event.target.value)}
                required
              />
            </label>
          </div>

          <button type="submit" disabled={!subscribed || scheduling}>
            {scheduling ? "Scheduling..." : "Schedule notification"}
          </button>
        </form>

        {!subscribed && <p>Enable notifications before scheduling one.</p>}
        {scheduleMessage && <p role="status">{scheduleMessage}</p>}
      </div>
    </div>
  );
}

export default App;