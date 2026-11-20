/* Tabs (Learn / Feed) and start-up. Loaded last. */
(function () {
  "use strict";
  var C = window.CUSP, $ = C.$;

  var scrollMemo = {}, currentView = null;
  function show(view, force) {
    if (view !== "feed") view = "learn";
    if (currentView && !force) scrollMemo[currentView] = window.scrollY;
    currentView = view;
    $("view-learn").hidden = view !== "learn";
    $("view-feed").hidden = view !== "feed";
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
      if (t.dataset.view === view) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
    });
    if (view === "feed" && window.LemmaFeed) window.LemmaFeed.show();
    if (view === "learn") window.LEMMA_PATH.refresh();
    window.scrollTo(0, force ? 0 : (scrollMemo[view] || 0));
    if (view === "feed" && window.LemmaFeed) window.LemmaFeed.fill();
  }
  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
    t.addEventListener("click", function () {
      try { history.replaceState(null, "", "#" + t.dataset.view); } catch (e) { /* ignore */ }
      show(t.dataset.view);
    });
  });
  window.addEventListener("hashchange", function () { show(location.hash.slice(1)); });

  window.LEMMA = C;      // older name, handy in the browser console
  C.show = show;
  C.renderPath();        // loads the current course first if needed
  show(location.hash.slice(1));
})();
