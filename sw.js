// 極簡 Service Worker — 讓網站具備 PWA「可安裝」資格
// 不做離線快取（工單系統需要即時雲端資料）
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());
self.addEventListener('fetch', (e) => { /* 不攔截，直接走網路 */ });
