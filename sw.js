// A service worker whose only job is to remove itself.
//
// The old Replit shop registered a Workbox service worker at this exact path on
// froglogic.co.uk and www.froglogic.co.uk. A service worker outlives the site
// that installed it: it sits in the browser, answers requests from its own
// cache, and keeps serving the old "Mental Health Frogs" page to anyone who
// ever visited — even though the domain now points at Netlify and Netlify is
// serving the new shop correctly. Nothing on the server can fix that, because
// the request never reaches the server.
//
// The one thing that does reach it is a new copy of THIS file. Browsers check
// for an updated service worker script on navigation, and when they find this
// one they install it — and it deletes every cache the old worker left behind,
// unregisters itself, and reloads any open tab so the person sees the real
// shop instead of a ghost.
//
// This file has to keep existing. Deleting it puts the old worker back in
// charge for anyone who hasn't been updated yet.

self.addEventListener("install", () => {
  // Don't wait for the old worker's tabs to close — take over immediately.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));

      await self.registration.unregister();

      // Reload whatever is open, so the stale page on screen is replaced now
      // rather than on some later visit.
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        try {
          client.navigate(client.url);
        } catch (err) {
          // Navigating another tab can be refused; unregistering is the part
          // that matters, and the next load will be clean regardless.
        }
      }
    })()
  );
});

// No fetch handler on purpose. With none registered, the browser goes straight
// to the network — which is the whole point.
