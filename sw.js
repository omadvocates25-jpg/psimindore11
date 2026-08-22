// Deliberately does NOT cache anything. This site has been bitten badly before by
// aggressive caching serving stale content to returning visitors — this service
// worker exists only to satisfy PWA "reliability" checks (installability score),
// not to cache assets. Every request always goes straight to the network.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
 event.respondWith(fetch(event.request));
});
