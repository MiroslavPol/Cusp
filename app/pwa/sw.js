/* Lemma service worker: makes the app installable and usable offline.
   build.py fills in VERSION (a hash of the built files) and PRECACHE, so every rebuild
   that changes something installs a fresh cache and drops the old one. */
var VERSION = "__VERSION__";
var PRECACHE = __PRECACHE__;
var APP = "lemma-app-" + VERSION;      // "lemma": the app's old name, kept so existing installs clean up their caches
var NAV_TIMEOUT = 3000;                // ms to wait for the network before showing the cached page

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

  if (url.origin !== self.location.origin) return;

  // The page itself: network first (so updates arrive), but on a slow connection (weak Wi-Fi, a train) don't
  // wait longer than NAV_TIMEOUT: show the cached page and let the network answer update the cache for next time.
  // Offline: the cached page right away.
  if (req.mode === "navigate") {
    var net = fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); return caches.open(APP).then(function (c) { return c.put("index.html", copy); }).then(function () { return res; }); }
      return res;
    });
    e.waitUntil(net.catch(function () { /* offline: nothing to update */ }));
    e.respondWith(new Promise(function (resolve) {
      var done = false;
      function cached() { return caches.match("index.html", { ignoreSearch: true }); }
      function give(res) { if (!done && res) { done = true; resolve(res); } }
      var timer = setTimeout(function () { cached().then(give); }, NAV_TIMEOUT);
      net.then(function (res) { clearTimeout(timer); give(res); }, function () {
        clearTimeout(timer);
        cached().then(function (hit) { give(hit || Response.error()); });
      });
    }));
    return;
  }

  // Everything else (course data, KaTeX, fonts, images, icons): cache first. A new version brings a new cache.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(APP).then(function (c) { c.put(req, copy); }); }
      return res;
    });
  }));
});
