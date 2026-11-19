self.addEventListener("push", (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = {
        body: event.data.text()
      };
    }
  }

  const title = data.title || "New Notification";

  const options = {
    body: data.body || "You have a new notification!",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/icon-192.png",
    tag: data.tag,
    data: {
      url: data.url || "/"
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});


// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      let targetUrl;

      try {
        targetUrl = new URL(
          event.notification.data?.url || "/",
          self.location.origin
        );
      } catch {
        targetUrl = new URL("/", self.location.origin);
      }

      // Only allow navigation within this application
      if (targetUrl.origin !== self.location.origin) {
        targetUrl = new URL("/", self.location.origin);
      }

      const windowClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      for (const client of windowClients) {
        if (
          new URL(client.url).origin === self.location.origin
        ) {
          await client.focus();

          if (typeof client.navigate === "function") {
            await client.navigate(targetUrl.href);
          }

          return;
        }
      }

      await clients.openWindow(targetUrl.href);
    })()
  );
});