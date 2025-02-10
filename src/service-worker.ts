declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "app-cache-v2"; // Updated cache name
const OFFLINE_URL = "/offline.html";
const STATIC_ASSETS = [
  // Static assets for caching
  "/",
  "/index.html",
  OFFLINE_URL,
  "/manifest.json",
  "/static/css/main.css",
  "/static/js/main.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all( cacheNames
        .filter((name) => name !== CACHE_NAME) 
        .map((cache) => caches.delete(cache))
      )
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
      .catch(() => caches.match(OFFLINE_URL).then(
        (response) => response || caches.match(event.request)
      )
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});