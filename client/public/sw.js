const CACHE_NAME = "blog-v3";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json", "/favicon.svg"];

// Install: pre-cache static assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

// 立刻返回缓存，同时后台拉取新版本写回缓存。
// 用于文章正文与 articles.json：老访客首屏仍然很快，
// 但下一次访问就能看到新发布的文章，无需手动 bump CACHE_NAME。
function staleWhileRevalidate(request) {
  return caches.open(CACHE_NAME).then(cache =>
    cache.match(request).then(cached => {
      const network = fetch(request)
        .then(response => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
}

// 只读缓存，未命中才走网络。仅用于内容哈希命名、内容永不变更的构建产物。
function cacheFirst(request) {
  return caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
      }
      return response;
    });
  });
}

// Network-first，离线时回落到缓存。用于 HTML 页面。
function networkFirst(request) {
  return fetch(request)
    .then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
      }
      return response;
    })
    .catch(() =>
      caches.match(request).then(cached => cached || caches.match("/"))
    );
}

self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET" || url.origin !== location.origin) return;

  // Cache-first: 仅限带内容哈希的构建产物。文件名变了内容才会变，
  // 所以「命中就永不回源」是安全的。
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stale-while-revalidate: 内容会原地更新、但文件名不变的资源。
  // /images/ 不带内容哈希（/images/avatar.jpg 换图后路径照旧），
  // 用 cache-first 的话老访客除非 CACHE_NAME 变否则永远看不到新图。
  if (
    url.pathname.startsWith("/articles/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Network-first: HTML pages
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(request));
    return;
  }
});
