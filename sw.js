const CACHE_NAME = "naehrwerte-v2";
const ASSETS = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Nur eigene, statische Dateien cachen (App-Shell). Backend-API- und
// OpenFoodFacts-Aufrufe laufen unverändert direkt übers Netz.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((resp) => { caches.open(CACHE_NAME).then((c) => c.put(event.request, resp.clone())); return resp; })
        .catch(() => cached);
      return cached || network;
    })
  );
});
