/* Lemma service worker: makes the app installable and usable offline.
   build.py fills in VERSION (a hash of the built files) and PRECACHE, so every rebuild
   that changes something installs a fresh cache and drops the old one. */
var VERSION = "__VERSION__";
var PRECACHE = __PRECACHE__;
var APP = "lemma-app-" + VERSION;
var FONTS = "lemma-fonts";

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(APP).then(function (c) { return c.addAll(PRECACHE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("lemma-app-") === 0 && k !== APP; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  // Google Fonts: serve from cache, refresh in the background.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTS).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // The page itself: network first (so updates arrive), cache when offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(APP).then(function (c) { c.put("index.html", copy); }); }
      return res;
    }).catch(function () {
      return caches.match("index.html", { ignoreSearch: true });
    }));
    return;
  }

  // Everything else (KaTeX, images, icons): cache first.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(APP).then(function (c) { c.put(req, copy); }); }
      return res;
    });
  }));
});
