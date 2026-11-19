const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env")
});

const express = require("express");
const webpush = require("web-push");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5000;


// Check environment variables
if (
  !process.env.VAPID_PUBLIC_KEY ||
  !process.env.VAPID_PRIVATE_KEY ||
  !process.env.VAPID_SUBJECT
) {
  throw new Error("Missing VAPID environment variables");
}


// Middleware
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN
}));

app.use(express.json({
  limit: "32kb"
}));


// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);


// Temporary subscription storage
const subscriptions = new Map();

async function sendPushNotification(notification) {
  let sent = 0;
  let expired = 0;
  let failed = 0;

  for (const [endpoint, subscription] of subscriptions) {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify(notification),
        { TTL: 60 * 60 }
      );

      sent++;
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        subscriptions.delete(endpoint);
        expired++;
      } else {
        failed++;
        console.error(error);
      }
    }
  }

  return { sent, expired, failed };
}


// Save a subscription
app.post("/api/subscribe", (req, res) => {
  const subscription = req.body.subscription;

  if (
    !subscription ||
    !subscription.endpoint ||
    !subscription.keys?.p256dh ||
    !subscription.keys?.auth
  ) {
    return res.status(400).json({
      error: "Invalid subscription"
    });
  }

  subscriptions.set(
    subscription.endpoint,
    subscription
  );

  res.status(201).json({
    message: "Subscription saved"
  });
});


// Remove a subscription
app.delete("/api/subscribe", (req, res) => {
  const endpoint = req.body.endpoint;

  if (!endpoint || typeof endpoint !== "string") {
    return res.status(400).json({
      error: "Invalid endpoint"
    });
  }

  subscriptions.delete(endpoint);

  res.json({
    message: "Subscription removed"
  });
});

app.post("/api/schedule-notification", (req, res) => {
  const { title, minutes, seconds } = req.body;
  const delayMs = (minutes * 60 + seconds) * 1000;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.length > 120 ||
    !Number.isInteger(minutes) ||
    minutes < 0 ||
    !Number.isInteger(seconds) ||
    seconds < 0 ||
    seconds > 59 ||
    !Number.isSafeInteger(delayMs) ||
    delayMs > 2 ** 31 - 1
  ) {
    return res.status(400).json({
      error: "Enter a title and a valid delay of up to about 24 days"
    });
  }

  setTimeout(() => {
    sendPushNotification({
      title: title.trim(),
      body: "Your scheduled notification is here!",
      url: "/"
    }).catch(console.error);
  }, delayMs);

  res.status(202).json({
    message: "Notification scheduled"
  });
});


// Development-only notification test endpoint
if (process.env.NODE_ENV !== "production") {
  app.post("/api/test-notification", async (req, res) => {
    const result = await sendPushNotification({
      title: req.body.title || "Test Notification",
      body: req.body.body || "Your push notifications are working!",
      url: req.body.url || "/"
    });

    res.json({
      message: "Notification test completed",
      ...result
    });
  });
}


// Start server
app.listen(PORT, () => {
  console.log(
    `Push notification server running on port ${PORT}`
  );
});