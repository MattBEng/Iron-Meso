/* Lift Daddy service worker — auto-updating.
   Strategy:
     - App shell (HTML / navigation): NETWORK-FIRST, fall back to cache offline.
       This is what makes new deploys appear immediately when online.
     - Static assets (icons, fonts, etc.): CACHE-FIRST, refreshed in background.
   The CACHE name carries a build stamp; changing the deployed sw.js (which
   happens automatically on each build below) invalidates old caches on activate.
*/
const BUILD = "20260804030452";
const CACHE = "liftdaddy-" + BUILD;
const SHELL = ["./", "./index.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(()=>{}));
  // Do NOT auto-skipWaiting here; the page controls promotion so it can reload cleanly.
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isShell(req){
  if (req.mode === "navigate") return true;
  const u = new URL(req.url);
  return u.pathname.endsWith("/") || u.pathname.endsWith("/index.html");
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  if (isShell(req)) {
    // NETWORK-FIRST: always try the live version, cache it, fall back offline.
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put("./index.html", copy)).catch(()=>{});
          return res;
        })
        .catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // CACHE-FIRST for everything else, refresh in background.
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});

self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });
