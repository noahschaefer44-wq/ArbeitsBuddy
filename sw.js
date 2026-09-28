/* Azubino – Offline-Speicher. Bei jeder neuen Version CACHE hochzählen. */
const CACHE = "azubino-v10";
const FILES = ["./", "./index.html", "./arbeitsbuddy.html", "./manifest.webmanifest", "./berichtsheft-pool.json", "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Seiten: immer zuerst aus dem Netz (neueste Version), offline aus dem Speicher.
   Symbole und Manifest: aus dem Speicher, im Hintergrund aktualisieren. */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const page = req.mode === "navigate" || /\.html$|\/$/.test(new URL(req.url).pathname);
  e.respondWith(caches.open(CACHE).then(async c => {
    if (page) {
      try { const r = await fetch(req, { cache: "no-store" }); if (r.ok) c.put(req, r.clone()); return r; }
      catch (err) { return (await c.match(req, { ignoreSearch: true })) || c.match("./arbeitsbuddy.html"); }
    }
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
