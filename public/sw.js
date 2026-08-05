const CACHE = "quran-parho-v2";

const SHELL_EXTRA = [
  "/quran_parho_framework_2025.pdf",
  "/Quran%20Parho%20-%20English%20Poster.png",
  "/Quran%20Parho%20-%20Urdu%20Poster.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        try {
          const res = await fetch("/");
          if (res.ok) {
            cache.put("/", res.clone());
            const html = await res.text();
            const urls = [
              ...new Set(
                [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
              ),
            ];
            for (const url of urls) {
              try {
                const r = await fetch(url);
                if (r.ok) cache.put(url, r);
              } catch {
                /* skip assets that fail */
              }
            }
          }
          for (const url of SHELL_EXTRA) {
            try {
              const r = await fetch(url);
              if (r.ok) cache.put(url, r);
            } catch {
              /* skip shell extras that fail */
            }
          }
        } catch {
          /* shell precache is best-effort */
        }
      })
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
  precacheAllSurahs();
});

async function precacheAllSurahs() {
  try {
    const cache = await caches.open(CACHE);
    const cached = await cache.keys();
    const cachedSet = new Set(cached.map((r) => new URL(r.url).pathname));
    const queue = [];
    for (let n = 1; n <= 114; n++) {
      const path = `/quran/surah-${n}.json`;
      if (!cachedSet.has(path)) queue.push(path);
    }
    for (let i = 0; i < queue.length; i += 6) {
      await Promise.all(
        queue.slice(i, i + 6).map((path) =>
          fetch(path)
            .then((r) => {
              if (r.ok) return cache.put(path, r);
            })
            .catch(() => {})
        )
      );
    }
  } catch {
    /* background precache is best-effort and resumable */
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const home = await cache.match("/");
      if (home) return home;
      return new Response("You are offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    return new Response("", { status: 504 });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return new Response("", { status: 504 });
  }
}

async function backgroundRefresh(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "CACHE_URLS") return;
  const urls = Array.isArray(event.data.urls) ? event.data.urls : [];
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        urls.map((url) =>
          fetch(url)
            .then((r) => {
              if (r.ok) cache.put(url, r);
            })
            .catch(() => {})
        )
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Audio from everyayah.com is never cached (requires network; errors surface via the reader's toast).
  if (url.hostname === "everyayah.com") return;

  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }

  // Only cache same-origin assets and Google Fonts.
  const isSameOrigin = url.origin === self.location.origin;
  const isGoogleFont =
    url.hostname.endsWith(".gstatic.com") || url.hostname.endsWith(".googleapis.com");
  if (!isSameOrigin && !isGoogleFont) return;

  const path = url.pathname;
  const decoded = decodeURIComponent(path);

  if (path.startsWith("/quran/surah-")) {
    event.respondWith(backgroundRefresh(req));
    return;
  }

  if (
    isGoogleFont ||
    path.startsWith("/fonts/") ||
    path.startsWith("/assets/") ||
    path === "/logo.png" ||
    path.startsWith("/favicon") ||
    path === "/apple-touch-icon.png" ||
    path === "/og-image.png" ||
    path === "/quran_parho_framework_2025.pdf" ||
    decoded === "/Quran Parho - English Poster.png" ||
    decoded === "/Quran Parho - Urdu Poster.png" ||
    req.destination === "script" ||
    req.destination === "style" ||
    req.destination === "font" ||
    req.destination === "image"
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }
});
