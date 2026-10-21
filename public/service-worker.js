const CACHE_NAME = "zed-gift-shop-v4";
const STATIC_ASSETS = ["/icon.png", "/logo.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.allSettled(STATIC_ASSETS.map((path) => cache.add(path))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept cross-origin or API traffic.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Pages and RSC data: always prefer the network so storefront content is fresh.
  if (request.mode === "navigate" || url.pathname.startsWith("/_next/data") || url.searchParams.has("_rsc")) {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached ?? new Response("Offline", { status: 503 }))
      )
    );
    return;
  }

  // Immutable build assets and media: cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|png|jpe?g|webp|avif|svg|gif|ico|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Everything else: network-first, cache as an offline fallback.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? new Response("Offline", { status: 503 })))
  );
});
