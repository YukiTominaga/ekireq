// Minimal service worker registered to satisfy "Add to Home Screen" on Android
// Chrome. Modern Chrome no longer requires a fetch handler for installability,
// and an empty fetch listener can cause the first launch from the home screen
// to fail with "This page couldn't load" — so we intentionally do not register
// one. All requests go straight to the network.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
