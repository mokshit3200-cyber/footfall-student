/* Cmpus - minimal offline service worker */
const CACHE = "cmpus-static-v5";
const PRECACHE = ["/", "/manifest.webmanifest", "/icon-192.png", "/brand/mark-white.png"];

function isCacheableStatic(url) {
  if (url.origin !== self.location.origin) return false;
  const path = url.pathname;
  return (
    path.startsWith("/_next/static/") ||
    path.startsWith("/brand/") ||
    path.startsWith("/icon-") ||
    path.startsWith("/favicon") ||
    path === "/manifest.webmanifest" ||
    /\.(?:css|js|png|jpg|jpeg|webp|gif|svg|ico|woff2?)$/i.test(path)
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Network-first for navigations so updates land; cached shell is only offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put("/", copy));
          }
          return res;
        })
        .catch(() => caches.match("/").then((r) => r || caches.match(request)))
    );
    return;
  }

  const url = new URL(request.url);
  if (!isCacheableStatic(url)) return;

  const isAppCode =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css");

  if (isAppCode) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
    )
  );
});

self.addEventListener("push", (event) => {
  let payload = { title: "Cmpus", body: "New update!", url: "/" };
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (err) {
    payload = { title: "Cmpus", body: event.data ? event.data.text() : "New update!", url: "/" };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/favicon-32.png",
      data: { url: payload.url || "/" }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.navigate) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
