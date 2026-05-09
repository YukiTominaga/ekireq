// Minimal service worker: present only to satisfy Chrome's PWA installability
// requirement (a registered SW with a fetch handler). The fetch handler does
// NOT call respondWith, so all requests pass through to the network unchanged.
// This keeps Firebase realtime connections and Google Maps requests untouched.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // pass-through
});
