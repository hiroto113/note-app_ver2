// Service Worker for offline support and caching
const CACHE_NAME = 'my-notes-v1';
const STATIC_CACHE_NAME = 'static-cache-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1';

// キャッシュするリソース
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  // 重要なCSS/JSファイル（実際のビルド後のファイル名に更新が必要）
  // '/css/critical.css',
  // スタイルとスクリプト
];

// 動的にキャッシュするパス
const CACHE_PATTERNS = [
  /\/api\/posts/,
  /\/api\/categories/,
  /\/_app\/immutable/,
  /\.css$/,
  /\.js$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.webp$/,
  /\.svg$/
];

// インストール時の処理
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
  
  // 新しいSWを即座に有効化
  self.skipWaiting();
});

// アクティベート時の処理
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
  
  // 全てのクライアントを即座に制御
  self.clients.claim();
});

// フェッチイベントの処理
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // 外部リソースは無視
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // GET リクエストのみ処理
  if (request.method !== 'GET') {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

/**
 * フェッチリクエストを処理
 */
async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // HTML ページの処理
    if (request.headers.get('accept')?.includes('text/html')) {
      return await handlePageRequest(request);
    }
    
    // 静的アセットの処理
    if (shouldCacheResource(url.pathname)) {
      return await handleAssetRequest(request);
    }
    
    // API リクエストの処理
    if (url.pathname.startsWith('/api/')) {
      return await handleAPIRequest(request);
    }
    
    // その他のリクエストはネットワークファーストで処理
    return await fetch(request);
    
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    
    // オフライン時のフォールバック
    if (request.headers.get('accept')?.includes('text/html')) {
      const offlineResponse = await caches.match('/offline');
      return offlineResponse || new Response('オフラインです', { status: 503 });
    }
    
    return new Response('リソースを取得できませんでした', { status: 503 });
  }
}

/**
 * ページリクエストの処理（ネットワークファースト）
 */
async function handlePageRequest(request) {
  try {
    // まずネットワークから取得を試行
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 成功した場合はキャッシュに保存
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network request failed, trying cache');
  }
  
  // ネットワーク失敗時はキャッシュから取得
  const cachedResponse = await caches.match(request);
  return cachedResponse;
}

/**
 * 静的アセットの処理（キャッシュファースト）
 */
async function handleAssetRequest(request) {
  // まずキャッシュから取得を試行
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // キャッシュになければネットワークから取得
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 成功した場合はキャッシュに保存
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Asset fetch failed:', error);
    throw error;
  }
}

/**
 * API リクエストの処理（ネットワークファースト、短期キャッシュ）
 */
async function handleAPIRequest(request) {
  try {
    // まずネットワークから取得
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // GETリクエストのみキャッシュ（5分間）
      if (request.method === 'GET') {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const responseWithTimestamp = new Response(networkResponse.body, {
          status: networkResponse.status,
          statusText: networkResponse.statusText,
          headers: {
            ...networkResponse.headers,
            'sw-cached-at': Date.now().toString()
          }
        });
        cache.put(request, responseWithTimestamp.clone());
        return networkResponse;
      }
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] API network request failed, trying cache');
  }
  
  // ネットワーク失敗時はキャッシュから取得（5分以内のもののみ）
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    const cachedAt = cachedResponse.headers.get('sw-cached-at');
    if (cachedAt && (Date.now() - parseInt(cachedAt)) < 5 * 60 * 1000) {
      return cachedResponse;
    }
  }
  
  throw new Error('API request failed and no valid cache available');
}

/**
 * リソースをキャッシュすべきかどうかを判定
 */
function shouldCacheResource(pathname) {
  return CACHE_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * バックグラウンド同期の処理
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(
      // バックグラウンドでの同期処理
      syncOfflineActions()
    );
  }
});

/**
 * オフライン時のアクションを同期
 */
async function syncOfflineActions() {
  try {
    // IndexedDBからオフライン時のアクションを取得
    // （実装時に追加）
    console.log('[SW] Syncing offline actions');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

/**
 * プッシュ通知の処理
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: data.tag || 'notification',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

/**
 * 通知クリックの処理
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action) {
    // アクションボタンがクリックされた場合
    console.log('[SW] Notification action clicked:', event.action);
  } else {
    // 通知本体がクリックされた場合
    event.waitUntil(
      self.clients.openWindow(event.notification.data?.url || '/')
    );
  }
});