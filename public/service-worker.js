const CACHE_NAME = "zed-gift-shop-v2";
const APP_SHELL = [
 "/",
 "/shop",
 "/gifts",
 "/gift-builder",
 "/personalized",
 "/collections",
 "/deals",
 "/about",
 "/contact",
 "/faq",
 "/wishlist",
 "/account",
 "/icon.svg",
 "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
 event.waitUntil(
  caches.open(CACHE_NAME)
   .then(async (cache) => {
    await Promise.allSettled(APP_SHELL.map((path) => cache.add(path)));
   })
   .then(() => self.skipWaiting())
 );
});

self.addEventListener("activate", (event) => {
 event.waitUntil(
 caches.keys().then((names) =>
 Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
 ).then(() => self.clients.claim())
 );
});

self.addEventListener("fetch", (event) => {
 const url = new URL(event.request.url);

 if (event.request.method !== "GET") return;

 if (event.request.mode === "navigate") {
 event.respondWith(
 fetch(event.request)
 .then((response) => {
 const clone = response.clone();
 caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
 return response;
 })
 .catch(() => caches.match(event.request).then((cached) => cached ?? new Response("Offline", { status: 503 })))
 );
 return;
 }

 if (url.pathname.startsWith("/api/")) {
 event.respondWith(
 fetch(event.request)
 .then((response) => {
 if (response.ok) {
 const clone = response.clone();
 caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
 }
 return response;
 })
 .catch(() => caches.match(event.request))
 );
 return;
 }

 event.respondWith(
 caches.match(event.request).then((cached) => cached ?? fetch(event.request).then((response) => {
 if (response.ok) {
 const clone = response.clone();
 caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
 }
 return response;
 }))
 );
});
