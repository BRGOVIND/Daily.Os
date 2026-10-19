/* Daily OS service worker — lightweight offline app-shell caching.
 * Network-first for navigations (fresh UI when online, cached shell offline),
 * cache-first for static build assets. IndexedDB holds user data, so the SW
 * only needs to keep the app itself available offline. */

// The postbuild script stamps this template with the build ID and chunk list.
const CACHE = "daily-os-__BUILD_ID__";
const PRECACHE_ASSETS = /* __ASSET_JSON__ */ [];
const APP_SHELL = [
  "/",
  "/welcome",
  "/capture",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
];

async function precacheShell() {
  const cache = await caches.open(CACHE);
  // A working home document is required before claiming offline support.
  await cache.add("/");
  await Promise.all(APP_SHELL.filter((url) => url !== "/").map((url) =>
    cache.add(url).catch(() => {}),
  ));

  // Cache every build chunk, including unopened dialogs. Work in small groups
  // so installation does not flood a phone connection with parallel requests.
  for (let index = 0; index < PRECACHE_ASSETS.length; index += 8) {
    await Promise.all(PRECACHE_ASSETS.slice(index, index + 8).map((url) => cache.add(url)));
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheShell());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith("daily-os-") && k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, fall back to cached shell.
  if (request.mode === "navigate") {
    const fresh = fetch(request);
    event.waitUntil(fresh.then((res) => {
      if (!res.ok) return;
      return caches.open(CACHE).then((cache) => cache.put(request, res.clone()));
    }).catch(() => {}));
    event.respondWith(
      fresh.catch(() => caches.match(request).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Static assets: cache-first, then network (and cache it).
  let fromCache = false;
  const response = caches.match(request).then((cached) => {
    if (cached) {
      fromCache = true;
      return cached;
    }
    return fetch(request);
  });
  event.waitUntil(response.then((res) => {
    if (fromCache || !res.ok || !(url.pathname.startsWith("/_next/") || res.type === "basic")) return;
    return caches.open(CACHE).then((cache) => cache.put(request, res.clone()));
  }).catch(() => {}));
  event.respondWith(response);
});
