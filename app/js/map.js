/* The Learn view: header (course, streak, XP), the spiral map (drawn by path.js), the card of the tapped stop,
   the course picker with progress backup, and admin mode (tap the XP pill 7 times). */
(function () {
  "use strict";
  var C = window.CUSP;
  var $ = C.$, el = C.el, escapeHtml = C.escapeHtml, fmt = C.fmt, P = C.P, L = C.L, course = C.course;

  var UNIT_COLORS = ["var(--def)", "var(--prf)", "var(--thm)", "var(--ex)", "var(--app)", "var(--hist)"];
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  var ICON_STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8L12 3Z"/></svg>';
  var ICON_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  var ICON_SPARK = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Zm7 12 .9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14Z"/></svg>';

  function applyChrome() {
    var s = L(), c = course();
    document.documentElement.lang = C.lang();
    $("courseKicker").textContent = s.course;
    $("tabLearnLabel").textContent = s.learn;
    $("tabFeedLabel").textContent = s.feed;
    $("tabHomeLabel").textContent = s.home;
    $("lessonClose").setAttribute("aria-label", s.close);
    $("guideClose").setAttribute("aria-label", s.closeGuide);
    $("sheetTitle").textContent = s.chooseCourse;
  }
  function renderStats() {
    var s = L();
    var days = C.liveStreak();
    $("streakN").textContent = days;
    $("daysLabel").textContent = C.fmt(s.days, { n: days });
    $("streakStat").classList.toggle("cold", P.last !== C.today());
    $("streakStat").title = P.last === C.today() ? s.streakToday : s.streakTodo;
    $("xpN").textContent = P.xp;
  }

  function allNodes(c) { var out = []; c.units.forEach(function (u) { out = out.concat(u.nodes); }); return out; }
  function nodeTitle(n) { return n.checkpoint ? L().checkpoint : n.title.replace(/^Bonus:\s*/, ""); }
  function nodeStatuses(c) {
    var st = {}, coreOk = true, currentSet = false, admin = C.isAdmin();
    allNodes(c).forEach(function (n) {
      if (P.done[n.id]) { st[n.id] = "done"; return; }
      if (n.bonus) { st[n.id] = (coreOk || admin) ? "open" : "locked"; return; }
      if (coreOk && !currentSet) { st[n.id] = "current"; currentSet = true; coreOk = false; return; }
      coreOk = false; st[n.id] = admin ? "open" : "locked";
    });
    return st;
  }
  function unitKicker(c, u, ui) { return c.lectures && u.lect ? u.lect : fmt(C.stringsFor(c).unitN, { n: ui + 1 }); }

  // The path is a spiral map (app/js/path.js): it starts on the outer rim and winds into the singularity.
  function renderPath() {
    var c = course(), s = L(), path = $("path");
    $("courseName").textContent = c.title;
    $("courseName").parentNode.classList.toggle("long", c.title.length > 16);
    applyChrome();
    renderStats();
    if (!c.units) {
      if (!c.hasLessons) { path.innerHTML = '<p class="soon">' + escapeHtml(s.soonText) + "</p>"; return; }
      path.innerHTML = '<p class="soon">' + escapeHtml(s.loading) + "</p>";
      C.load(c).then(function () { if (course() === c) renderPath(); });
      return;
    }
    var nodes = allNodes(c), core = nodes.filter(function (n) { return !n.bonus; });
    var doneCount = core.filter(function (n) { return P.done[n.id]; }).length;
    var st = nodeStatuses(c);

    // HUD on top: progress, today's review, admin tools
    var hud = el("div", "hud-panel");
    var row = el("div", "hud-row");
    var meter = el("div", "meter", "<span></span>");
    meter.firstChild.style.width = Math.round(100 * doneCount / Math.max(1, core.length)) + "%";
    meter.title = fmt(s.complete, { a: doneCount, b: core.length });
    row.appendChild(meter);
    row.appendChild(el("span", "hud-count", doneCount + "/" + core.length));
    var due = C.dueKeys(c);
    if (due.length) {
      var rb = el("button", "review-btn", escapeHtml(fmt(s.daily, { n: Math.min(due.length, C.DAILY_Q) + (due.length > C.DAILY_Q ? "+" : "") })));
      rb.type = "button";
      rb.addEventListener("click", function () { C.startSession({ review: true }); });
      row.appendChild(rb);
    } else if (Object.keys(P.srs).some(function (k) { return c.byKey[k]; })) {
      row.appendChild(el("span", "review-ok", "✓ " + escapeHtml(s.dailyDone)));
    }
    hud.appendChild(row);
    if (C.isAdmin()) {
      var ab = el("div", "admin-bar", '<span class="admin-k">' + escapeHtml(s.adminK) + "</span><span>" + escapeHtml(s.adminText) + "</span>");
      var rs = el("button", "admin-btn", escapeHtml(s.adminReset));
      rs.type = "button";
      rs.addEventListener("click", function () {
        if (rs.dataset.armed !== "1") { rs.dataset.armed = "1"; rs.textContent = s.adminSure; return; }
        P.done = {}; P.mistakes = {}; P.srs = {}; P.xp = 0; P.streak = 0; P.last = null; C.save(); C.toast(s.adminDone); renderPath();
      });
      var off = el("button", "admin-btn", escapeHtml(s.adminOff));
      off.type = "button";
      off.addEventListener("click", function () { C.setAdmin(false); });
      ab.appendChild(rs); ab.appendChild(off);
      hud.appendChild(ab);
    }

    // the stops along the spiral, from the rim inwards
    var items = [], byId = {}, lastLect = 0;
    c.units.forEach(function (u, ui) {
      var color = UNIT_COLORS[ui % UNIT_COLORS.length], kicker = unitKicker(c, u, ui);
      if (u.soon) {
        items.push({ id: u.id + ":soon", unit: u, soon: true, status: "locked", color: color, icon: ICON_LOCK, badge: "",
          unitTitle: u.title, unitKicker: kicker, aria: u.title + " · " + s.soonUnit });
        return;
      }
      u.nodes.forEach(function (n, k) {
        var status = st[n.id], ln = C.lectNums(n.lect)[0], tick = null;
        if (c.lectures && ln && ln > lastLect && !n.checkpoint) { tick = "P" + ln; lastLect = ln; }
        items.push({
          id: n.id, n: n, unit: u, status: status, color: color, checkpoint: !!n.checkpoint, bonus: !!n.bonus, tick: tick,
          icon: n.checkpoint ? '<span class="qed">∎</span>' : n.icon ? window.CUSP_PATH.icon(n.icon) : n.bonus ? ICON_SPARK : ICON_STAR,
          badge: status === "done" ? '<span class="nbadge ok">' + ICON_CHECK + "</span>" : status === "locked" ? '<span class="nbadge">' + ICON_LOCK + "</span>" : "",
          unitTitle: k === 0 ? u.title : null, unitKicker: kicker,
          aria: nodeTitle(n) + (status === "done" ? " ✓" : status === "locked" ? " 🔒" : "")
        });
      });
    });
    items.forEach(function (it) { byId[it.id] = it; });

    // Everything converges to the singularity: a final test over the whole course.
    var left = core.length - doneCount, fid = C.finalId(c);
    var fstat = P.done[fid] ? "done" : (left === 0 || C.isAdmin()) ? "open" : "locked";
    var cur = items.filter(function (it) { return it.status === "current"; })[0];

    function goBtn(label, fn) { var b = el("button", "fc-go", escapeHtml(label)); b.type = "button"; b.addEventListener("click", fn); return b; }
    // the card at the bottom: what the tapped stop is, and the button to play it
    function card(id) {
      var box = el("div", "fc"), foot = el("div", "fc-row"), txt = el("div", "fc-txt");
      if (id === "sing") {
        box.classList.add("fc-sing");
        box.appendChild(el("div", "fc-k", escapeHtml(s.singK)));
        txt.appendChild(el("div", "fc-t", escapeHtml(P.done[fid] ? s.singDoneTitle : s.singTitle)));
        txt.appendChild(el("div", "fc-s", escapeHtml(fstat === "locked" ? fmt(s.singLocked, { n: left }) : fstat === "done" ? s.singDone : fmt(s.singSub, { n: C.FINAL_Q }))));
        foot.appendChild(txt);
        if (fstat !== "locked") foot.appendChild(goBtn(fstat === "done" ? s.mapAgain : s.start, function () { C.startSession({ final: true }); }));
        box.appendChild(foot);
        return box;
      }
      if (id === "bk") {                     // the backup constellation: the same backup and restore as the course picker
        box.classList.add("fc-bk");
        box.appendChild(backupBox(s));
        return box;
      }
      var it = byId[id];
      box.style.setProperty("--u", it.color);
      var lect = c.lectures && it.n && it.n.lect && !it.checkpoint ? C.lectLabel(it.n.lect) : it.unitKicker;
      box.appendChild(el("div", "fc-k", escapeHtml(it.unit.title + " · " + lect)));
      txt.appendChild(el("div", "fc-t", (it.bonus ? '<span class="bonus-k">' + escapeHtml(s.bonus) + "</span> " : "") + escapeHtml(it.soon ? s.soonUnit : nodeTitle(it.n))));
      if (it.soon) txt.appendChild(el("div", "fc-s", escapeHtml(s.soonText)));
      else if (it.status === "locked") txt.appendChild(el("div", "fc-s", escapeHtml(s.locked)));
      else if (it.status === "done") txt.appendChild(el("div", "fc-s ok", "✓ " + escapeHtml(s.mapDone)));
      foot.appendChild(txt);
      if (!it.soon && it.status !== "locked") foot.appendChild(goBtn(it.status === "done" ? s.mapAgain : s.start, function () { C.startSession({ node: it.n }); }));
      box.appendChild(foot);
      return box;
    }

    if (path.querySelector(".soon")) path.innerHTML = "";
    window.CUSP_PATH.space(path, {
      key: c.id, items: items, hud: hud, card: card, currentId: cur ? cur.id : "sing",
      sing: { status: fstat, title: P.done[fid] ? s.singDoneTitle : s.singTitle },
      backup: { label: s.bkConst, sub: lastBackupText(s), due: C.backupDue() },
      strings: { start: s.start, here: s.mapHere, fit: s.mapFit, zin: s.mapIn, zout: s.mapOut }
    });
  }

  // ---------------------------------------------------------------- course picker + progress backup
  function openSheet() {
    var s = L(), list = $("courseList"); list.innerHTML = "";
    $("sheetTitle").textContent = s.chooseCourse;
    C.visibleCourses().forEach(function (c) {
      var b = el("button", "course-opt", "<b>" + escapeHtml(c.title) + (c.hasLessons ? "" : ' <span class="pill">' + escapeHtml(s.inPrep) + "</span>") +
        (c.draft ? ' <span class="pill">' + escapeHtml(s.fDraft) + "</span>" : "") + "</b><span>" + escapeHtml(c.blurb) + "</span>");
      b.type = "button";
      b.setAttribute("aria-pressed", String(c.id === course().id));
      if (!c.hasLessons) b.disabled = true;
      b.addEventListener("click", function () { C.setCourse(c.id); closeSheet(); renderPath(); C.emit("course", c); });
      list.appendChild(b);
    });
    list.appendChild(langBox(s));
    list.appendChild(backupBox(s));
    $("courseSheet").hidden = false;
  }
  function closeSheet() { $("courseSheet").hidden = true; }

  // the interface language (each language's own name, so anyone can find theirs)
  var LANGS = [["cs", "Čeština"], ["en", "English"]];
  function langBox(s) {
    var box = el("div", "lang-box");
    box.appendChild(el("span", "lang-k", escapeHtml(s.langK)));
    var row = el("div", "lang-row");
    LANGS.forEach(function (o) {
      var b = el("button", "chip lang-opt", escapeHtml(o[1])); b.type = "button"; b.lang = o[0];
      b.setAttribute("aria-pressed", String(C.lang() === o[0]));
      b.addEventListener("click", function () { if (C.lang() !== o[0]) { C.setLang(o[0]); openSheet(); } });
      row.appendChild(b);
    });
    box.appendChild(row);
    box.appendChild(el("p", "lang-note", escapeHtml(s.langNote)));
    return box;
  }

  function lastBackupText(s) {
    var last = C.lastBackup();
    return last ? fmt(s.bkLast, { d: new Date(last + "T12:00").toLocaleDateString(C.lang()) }) : s.bkNever;
  }
  function backupBox(s) {
    var box = el("div", "backup");
    box.appendChild(el("h3", null, escapeHtml(s.bkTitle)));
    box.appendChild(el("p", null, escapeHtml(s.bkText)));
    box.appendChild(el("p", "bk-last", escapeHtml(lastBackupText(s))));
    var row = el("div", "backup-row");
    var save = el("button", "admin-btn", escapeHtml(s.bkSave)); save.type = "button";
    save.addEventListener("click", function () { exportProgress(s); });
    var file = el("input"); file.type = "file"; file.accept = ".json,application/json"; file.hidden = true;
    var load = el("button", "admin-btn", escapeHtml(s.bkLoad)); load.type = "button";
    load.addEventListener("click", function () { file.click(); });
    file.addEventListener("change", function () {
      var f = file.files && file.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () { importText(String(r.result), s); file.value = ""; };
      r.readAsText(f);
    });
    var paste = el("button", "admin-btn", escapeHtml(s.bkPaste)); paste.type = "button";
    var area = el("div", "backup-paste"); area.hidden = true;
    var ta = el("textarea"); ta.rows = 3; ta.setAttribute("aria-label", s.bkPaste);
    var go = el("button", "admin-btn", escapeHtml(s.bkPasteGo)); go.type = "button";
    go.addEventListener("click", function () { importText(ta.value, s); });
    area.appendChild(ta); area.appendChild(go);
    paste.addEventListener("click", function () { area.hidden = !area.hidden; if (!area.hidden) ta.focus(); });
    row.appendChild(save); row.appendChild(load); row.appendChild(paste); row.appendChild(file);
    box.appendChild(row); box.appendChild(area);
    return box;
  }
  function exportProgress(s) {
    var data = JSON.stringify(C.backup()), name = "cusp-" + C.today() + ".json", f = null;
    function saved() {
      C.markBackup(true);
      C.toast(s.bkSaved);
      // the date under the constellation and in the backup boxes, and the constellation stops asking for a backup
      Array.prototype.forEach.call(document.querySelectorAll(".bk-last, .sp-const .const-s"), function (n) { n.textContent = lastBackupText(s); });
      Array.prototype.forEach.call(document.querySelectorAll(".sp-const"), function (n) { n.classList.remove("due"); });
    }
    function download() {
      var a = el("a"); a.href = URL.createObjectURL(new Blob([data], { type: "application/json" })); a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      saved();
    }
    try { f = new File([data], name, { type: "application/json" }); } catch (e) { /* old browser */ }
    // Phones and tablets: the share sheet (send it to yourself, save it to Files). Computers download the file:
    // Windows also claims it can share files, but its share dialog is not where anyone looks for a backup.
    var touch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if (f && touch && navigator.canShare && navigator.canShare({ files: [f] })) {
      navigator.share({ files: [f], title: name }).then(saved)
        .catch(function (e) { if (!e || e.name !== "AbortError") download(); });     // cancelled: nothing; failed: download instead
      return;
    }
    download();
  }
  function importText(text, s) {
    var b = null; try { b = JSON.parse(text); } catch (e) { /* not JSON */ }
    if (!C.restore(b)) { C.toast(s.bkBad); return; }
    C.toast(s.bkDone); closeSheet();
  }

  $("courseBtn").addEventListener("click", openSheet);
  $("courseSheet").addEventListener("click", function (e) { if (e.target === $("courseSheet")) closeSheet(); });
  (function () {      // admin mode: tap the XP pill 7 times within 3 s
    var taps = [], pill = $("xpN").parentNode;
    pill.addEventListener("click", function () {
      var now = Date.now();
      taps = taps.filter(function (t) { return now - t < 3000; }); taps.push(now);
      if (taps.length >= 7) { taps = []; C.setAdmin(!C.isAdmin()); }
    });
  })();

  // Where a student stands in a (loaded) course, for the home page: the stop to play next (the current lesson or
  // checkpoint; null once every core lesson is done), core stops done / total, and the final test.
  function courseState(c) {
    var st = nodeStatuses(c), core = allNodes(c).filter(function (n) { return !n.bonus; });
    var next = core.filter(function (n) { return st[n.id] === "current"; })[0] || null;
    return { next: next, nextTitle: next ? nodeTitle(next) : null, done: core.filter(function (n) { return P.done[n.id]; }).length,
      total: core.length, finalDone: !!P.done[C.finalId(c)] };
  }

  C.on("progress", renderPath);
  C.on("admin", renderPath);
  C.on("lang", renderPath);
  C.courseState = courseState;
  C.openCourseSheet = openSheet;
  C.renderPath = renderPath;
  C.renderStats = renderStats;
  C.applyChrome = applyChrome;
  C.exportProgress = function () { exportProgress(L()); };
})();
