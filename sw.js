// ══════════════════════════════════════════════
//  Hùng Lê Design Studio — Service Worker
//  Chiến lược: Cache-First cho assets tĩnh,
//              Network-First cho API GAS,
//              Stale-While-Revalidate cho HTML
// ══════════════════════════════════════════════

const SW_VERSION   = 'nhadep-v1.2';
const STATIC_CACHE = SW_VERSION + '-static';
const IMG_CACHE    = SW_VERSION + '-images';

// Assets tĩnh cần pre-cache khi install
const PRECACHE_URLS = [
  './home.html',
  './index.html',
  './huong.html',
  './estimate.html',
  'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap',
];

// ── INSTALL: pre-cache assets tĩnh ──────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(
        PRECACHE_URLS.filter(u => !u.startsWith('https://fonts'))
      ))
      .then(() => self.skipWaiting()) // kích hoạt ngay, không chờ tab cũ đóng
  );
});

// ── ACTIVATE: dọn cache cũ ───────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('nhadep-') && k !== STATIC_CACHE && k !== IMG_CACHE)
          .map(k => {
            console.log('[SW] Xoá cache cũ:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim()) // tiếp quản tất cả tabs ngay
  );
});

// ── FETCH: xử lý theo loại request ──────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Google Apps Script API → Network-only (không bao giờ cache dữ liệu nhà)
  if (url.hostname === 'script.google.com') {
    event.respondWith(networkOnly(request));
    return;
  }

  // 2. Google Drive thumbnail (ảnh mẫu nhà) → Cache-First, TTL 7 ngày
  if (url.hostname === 'drive.google.com' && url.pathname.startsWith('/thumbnail')) {
    event.respondWith(cacheFirstWithTTL(request, IMG_CACHE, 7 * 24 * 60 * 60 * 1000));
    return;
  }

  // 3. Google Fonts → Cache-First (font ít thay đổi)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 4. HTML pages → Stale-While-Revalidate (hiển thị cache ngay, cập nhật ngầm)
  if (request.destination === 'document') {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // 5. Tất cả còn lại (JS inline, CSS inline) → Network với fallback cache
  event.respondWith(networkWithCacheFallback(request, STATIC_CACHE));
});

// ══ STRATEGIES ════════════════════════════════════

/** Chỉ network, không cache */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/** Cache trước, fallback network nếu không có */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

/** Cache trước với kiểm tra TTL — cache hết hạn sẽ fetch mới */
async function cacheFirstWithTTL(request, cacheName, ttlMs) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    const cachedDate = cached.headers.get('sw-cached-at');
    if (cachedDate && Date.now() - Number(cachedDate) < ttlMs) {
      return cached;
    }
    // Hết TTL → xoá entry cũ
    cache.delete(request);
  }
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      // Thêm header thời gian cache để kiểm tra TTL sau
      const headers = new Headers(fresh.headers);
      headers.set('sw-cached-at', String(Date.now()));
      const cachedResponse = new Response(await fresh.clone().blob(), { headers });
      cache.put(request, cachedResponse);
    }
    return fresh;
  } catch {
    return cached || new Response('Offline', { status: 503 });
  }
}

/** Trả cache ngay, đồng thời fetch mới để cập nhật cache ngầm */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(fresh => {
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  }).catch(() => null);

  return cached || await fetchPromise || new Response('Offline', { status: 503 });
}

/** Network trước, fallback về cache khi offline */
async function networkWithCacheFallback(request, cacheName) {
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// ── MESSAGE: cho phép trang gửi lệnh xoá cache ──
self.addEventListener('message', event => {
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('nhadep-')).map(k => caches.delete(k)))
    ).then(() => {
      event.source?.postMessage({ type: 'CACHE_CLEARED' });
    });
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
