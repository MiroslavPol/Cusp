/* Tabs (Learn / Feed) and start-up. Loaded last. */
(function () {
  "use strict";
  var C = window.CUSP, $ = C.$;

  var scrollMemo = {}, currentView = null;
  // The app opens on Home (no #… or an unknown one); #learn and #feed open those views directly.
  function show(view, force) {
    if (view !== "feed" && view !== "learn") view = "home";
    if (currentView && !force) scrollMemo[currentView] = window.scrollY;
    currentView = view;
    $("view-home").hidden = view !== "home";
    $("view-learn").hidden = view !== "learn";
    $("view-feed").hidden = view !== "feed";
    document.body.setAttribute("data-view", view);
    if (view === "home") C.renderHome();
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
      if (t.dataset.view === view) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
    });
    if (view === "feed" && window.CUSP_FEED) window.CUSP_FEED.show();
    if (view === "learn") window.CUSP_PATH.refresh();
    window.scrollTo(0, force ? 0 : (scrollMemo[view] || 0));
    if (view === "feed" && window.CUSP_FEED) window.CUSP_FEED.fill();
  }
  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
    t.addEventListener("click", function () {
      try { history.replaceState(null, "", "#" + t.dataset.view); } catch (e) { /* ignore */ }
      show(t.dataset.view);
    });
  });
  window.addEventListener("hashchange", function () { show(location.hash.slice(1)); });

  // Full screen on Android comes only from the manifest ("display": "fullscreen"). There is deliberately no
  // requestFullscreen() here: every such request makes Android show a "swipe to exit full screen" banner, and
  // after a swipe the app could not get back without another tap and banner. An app installed before the
  // manifest asked for full screen gets it when Chrome updates the install, or right away after reinstalling.

  C.show = show;
  C.renderPath();        // loads the current course first if needed
  show(location.hash.slice(1));
})();
