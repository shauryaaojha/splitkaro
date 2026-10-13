// v3 drops the old cache, which could hold a redirected "/" that breaks
// navigation after login ("This site can't be reached").
const CACHE_NAME = "splitkaro-static-v3";
// Pages depend on the auth cookie, so only cookie-independent files are precached.
const STATIC_ASSETS = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

const isStaticAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/icons/") ||
  url.pathname === "/manifest.json";

// Browsers reject redirected responses for navigations, and opaque or error
// responses are not worth keeping, so only clean 200s go into the cache.
const isCacheable = (response) =>
  response.ok && !response.redirected && response.type === "basic";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Pages and RSC payloads always go to the network so auth redirects
  // (login → OAuth callback → "/") are never answered from a stale cache.
  if (!isStaticAsset(url)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (isCacheable(response)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});

// ── Push notification handler ──────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "SplitKaro", body: event.data.text() };
  }

  const title = payload.title || "SplitKaro";
  const options = {
    body: payload.body || "You have a new notification",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag || "splitkaro-notification",
    data: payload.data || {},
    vibrate: [200, 100, 200],
    actions: payload.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click handler ─────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          if (client.navigate) client.navigate(url);
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
