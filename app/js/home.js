/* The Home view, where the app opens: the cusp and the tagline, a very short "how it works" (each line leads to
   its tab), and widgets for the current course: the next lesson (one tap to play it), today's review, streak / XP /
   lessons.
   A new student sees the explanation and the first lesson; once something is done, the widgets come first.
   "About Cusp" at the end explains the whole app in one paragraph. */
(function () {
  "use strict";
  var C = window.CUSP;
  var $ = C.$, el = C.el, escapeHtml = C.escapeHtml, fmt = C.fmt, P = C.P, L = C.L, course = C.course;

  var ICON = {
    learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z"/><path d="M7 10.6V15c0 1.4 2.2 3 5 3s5-1.6 5-3v-4.4"/><path d="M21 8.5V14"/></svg>',
    feed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="7" rx="1.5"/><rect x="4" y="14" width="16" height="7" rx="1.5"/></svg>',
    review: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg>',
    go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  function button(cls, html, fn) { var b = el("button", cls, html); b.type = "button"; b.addEventListener("click", fn); return b; }
  function goTo(view) { try { history.replaceState(history.state, "", "#" + view); } catch (e) { /* ignore */ } C.show(view); }
  function isNew() { return C.doneCount() === 0 && !P.xp; }

  // "How it works": one sentence, then three lines, each one a way in
  function intro(s) { return el("p", "h-intro", escapeHtml(s.hIntro)); }
  function how(s) {
    var box = el("section", "h-how");
    [["learn", s.learn, s.hLearn, function () { goTo("learn"); }],
     ["feed", s.feed, s.hFeed, function () { goTo("feed"); }],
     ["review", s.dailyTitle, s.hReview, null]].forEach(function (r) {
      var row = el(r[3] ? "button" : "div", "h-row h-" + r[0],
        '<span class="h-ic">' + ICON[r[0]] + '</span><span class="h-txt"><b>' + escapeHtml(r[1]) + "</b>" + escapeHtml(r[2]) + "</span>" +
        (r[3] ? '<span class="h-arrow">' + ICON.go + "</span>" : ""));
      if (r[3]) { row.type = "button"; row.addEventListener("click", r[3]); }
      box.appendChild(row);
    });
    return box;
  }

  // "About Cusp": one paragraph for a newcomer: what the app is, how a lesson works, where progress is kept
  function about(s) {
    var box = el("section", "h-about");
    box.appendChild(el("h2", "h-about-t", escapeHtml(s.hAboutT)));
    box.appendChild(el("p", null, escapeHtml(s.hAbout)));
    return box;
  }

  // The next lesson in the current course, with its progress and a button that plays it
  function next(c, s) {
    var w = el("section", "h-card h-next");
    var head = el("div", "h-k");
    head.appendChild(el("span", null, escapeHtml(c.title)));
    head.appendChild(button("h-change", escapeHtml(s.hChange), function () { C.openCourseSheet(); }));
    w.appendChild(head);
    if (!c.units) {
      w.appendChild(el("p", "h-sub", escapeHtml(c.hasLessons ? s.loading : s.soonText)));
      return w;
    }
    var st = C.courseState(c), title, sub, label, play;
    if (st.next) {
      title = st.nextTitle;
      sub = st.next.unit.title;
      label = st.done ? s.hContinue : s.hStart;
      play = function () { C.startSession({ node: st.next }); };
    } else if (!st.finalDone) {
      title = s.singTitle; sub = fmt(s.singSub, { n: C.FINAL_Q }); label = s.hStart;
      play = function () { C.startSession({ final: true }); };
    } else {
      title = s.hAllDone; sub = s.singDone; label = s.hMap;
      play = function () { goTo("learn"); };
    }
    w.appendChild(el("div", "h-k2", escapeHtml(st.next && !st.done ? s.hFirst : s.hNext)));
    w.appendChild(el("h2", "h-title", escapeHtml(title)));
    w.appendChild(el("p", "h-sub", escapeHtml(sub)));
    var row = el("div", "h-progress");
    var meter = el("div", "meter", "<span></span>");
    meter.firstChild.style.width = Math.round(100 * st.done / Math.max(1, st.total)) + "%";
    row.appendChild(meter);
    row.appendChild(el("span", "h-count", fmt(s.hLessonsOf, { a: st.done, b: st.total })));
    w.appendChild(row);
    var foot = el("div", "h-actions");
    foot.appendChild(button("fc-go h-play", escapeHtml(label), play));
    if (st.next || !st.finalDone) foot.appendChild(button("h-link", escapeHtml(s.hMap) + ICON.go, function () { goTo("learn"); }));
    w.appendChild(foot);
    return w;
  }

  function stats(s) {
    return el("div", "tiles h-tiles",
      '<div class="tile"><div class="k">' + escapeHtml(s.streak) + '</div><div class="v">' + C.liveStreak() + "</div></div>" +
      '<div class="tile"><div class="k">' + escapeHtml(s.xp) + '</div><div class="v">' + P.xp + "</div></div>" +
      '<div class="tile"><div class="k">' + escapeHtml(s.hLessons) + '</div><div class="v">' + C.doneCount() + "</div></div>");
  }

  // Today's review, when something is due
  function review(c, s) {
    var due = c.units ? C.dueKeys(c).length : 0;
    if (!due) return null;
    var w = el("button", "h-card h-wide h-review",
      '<span class="h-ic">' + ICON.review + '</span><span class="h-txt"><b>' + escapeHtml(fmt(s.daily, { n: Math.min(due, C.DAILY_Q) + (due > C.DAILY_Q ? "+" : "") })) +
      "</b>" + escapeHtml(s.hReview) + '</span><span class="h-arrow">' + ICON.go + "</span>");
    w.type = "button";
    w.addEventListener("click", function () { C.startSession({ review: true }); });
    return w;
  }

  function render() {
    var c = course(), s = L(), body = $("homeBody");
    $("homeTagline").textContent = s.tagline;
    if (c.hasLessons && !c.units) C.load(c).then(function () { if (course() === c) render(); }, function () { /* shown as loading */ });
    body.innerHTML = "";
    // a new student: what this is, where to start, how it works; later: the widgets first, the explanation below
    var parts = isNew() ? [intro(s), next(c, s), how(s), about(s)] : [next(c, s), review(c, s), stats(s), intro(s), how(s), about(s)];
    parts.forEach(function (p) { if (p) body.appendChild(p); });
  }

  ["progress", "admin", "course", "loaded", "lang"].forEach(function (ev) { C.on(ev, function () { if (!$("view-home").hidden) render(); }); });
  C.renderHome = render;
})();
