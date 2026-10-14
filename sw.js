const CACHE_NAME = "macrotrack-v8";
const ASSETS = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./privacy.html"];

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
  // Netzwerk zuerst (neue Version sofort), bei Offline der Cache
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        if (resp && resp.ok) { const copy = resp.clone(); caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)); }
        return resp;
      })
      .catch(() => caches.match(event.request).then((c) => c || caches.match("./index.html")))
  );
});
