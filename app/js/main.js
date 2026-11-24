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

  // The launch screen: Cusp is only complementary material. It enters by itself after SPLASH_S seconds or on
  // the button. Browser tests (navigator.webdriver) skip it unless the address has ?splash.
  var SPLASH_S = 6;
  function splash() {
    var box = $("splash"), s = C.L();
    if (navigator.webdriver && !/[?&]splash\b/.test(location.search)) { box.remove(); return; }
    var left = SPLASH_S, go = $("splashGo"), timer;
    $("splashK").textContent = s.spK;
    $("splashText").textContent = s.sp;
    function label() { go.textContent = s.spGo + " (" + left + ")"; }
    function enter() {
      clearInterval(timer);
      box.classList.add("out");
      setTimeout(function () { box.remove(); }, 400);
    }
    label();
    $("splashBar").style.animationDuration = SPLASH_S + "s";
    timer = setInterval(function () { left--; if (left <= 0) enter(); else label(); }, 1000);
    go.addEventListener("click", enter);
    go.focus();
  }

  C.show = show;
  C.renderPath();        // loads the current course first if needed
  show(location.hash.slice(1));
  splash();
})();
