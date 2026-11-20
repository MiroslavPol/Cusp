/* Shared core: courses, loading their data, progress, spaced repetition, helpers.
   Everything is on window.CUSP (C); the other modules (guide, player, map, feed, main) use it.
   Load order: strings.js, core.js, guide.js, path.js, player.js, map.js, feed.js, main.js. */
(function () {
  "use strict";
  var C = window.CUSP = window.CUSP || {};
  var STR = window.CUSP_STR;

  // ---------------------------------------------------------------- helpers
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // "<" inside $…$ would otherwise start an HTML tag and swallow text ($x<y$).
  function escMath(t) {
    return String(t).replace(/\$\$[\s\S]+?\$\$|\$[^$]+\$/g, function (m) {
      return m.replace(/&(?!amp;|lt;|gt;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    });
  }
  function paras(text) {
    text = escMath(text);
    return text.trim().split(/\n\s*\n/).filter(Boolean).map(function (c) {
      c = c.trim();
      return /^<(ol|ul|div)/.test(c) ? c : "<p>" + c + "</p>";
    }).join("");
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function slug(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48); }
  function figs(list) { return (list || []).map(function (sp) { return window.LEMMA_FIG ? window.LEMMA_FIG.html(sp) : ""; }).join(""); }
  function drawFigs(node) { if (window.LEMMA_FIG) window.LEMMA_FIG.renderAll(node); }

  // ---- math: KaTeX → MathML, then small fixes for how browsers draw MathML
  function typeset(node) {
    if (window.renderMathInElement) {
      renderMathInElement(node, {
        delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }],
        throwOnError: false, output: "mathml",
        macros: { "\\lowint": "\\underline{\\int}", "\\upint": "\\overline{\\int}" }
      });
      fixFnSpacing(node);
      fixVariants(node);
      fixPrimes(node);
    }
  }
  // Chrome's MathML ignores mathvariant (ℝ would show as R): map letters to Unicode math alphanumerics.
  var MV = {
    "double-struck": { up: 0x1D538, lo: 0x1D552, dg: 0x1D7D8, holes: { C: 0x2102, H: 0x210D, N: 0x2115, P: 0x2119, Q: 0x211A, R: 0x211D, Z: 0x2124 } },
    "script": { up: 0x1D49C, lo: 0x1D4B6, holes: { B: 0x212C, E: 0x2130, F: 0x2131, H: 0x210B, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211B, e: 0x212F, g: 0x210A, o: 0x2134 } },
    "fraktur": { up: 0x1D504, lo: 0x1D51E, holes: { C: 0x212D, H: 0x210C, I: 0x2111, R: 0x211C, Z: 0x2128 } },
    "bold": { up: 0x1D400, lo: 0x1D41A, dg: 0x1D7CE, holes: {} },
    "bold-italic": { up: 0x1D468, lo: 0x1D482, holes: {} },
    "sans-serif": { up: 0x1D5A0, lo: 0x1D5BA, dg: 0x1D7E2, holes: {} }
  };
  function mapChar(ch, t) {
    if (t.holes[ch]) return String.fromCodePoint(t.holes[ch]);
    var c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) return String.fromCodePoint(t.up + c - 65);
    if (c >= 97 && c <= 122) return String.fromCodePoint(t.lo + c - 97);
    if (c >= 48 && c <= 57 && t.dg) return String.fromCodePoint(t.dg + c - 48);
    return ch;
  }
  // Primes come out as superscripts (f with a tiny tick far above it); set them inline as in print: f′(x).
  function fixPrimes(node) {
    Array.prototype.forEach.call(node.querySelectorAll("math msup, math msubsup"), function (sup) {
      var kids = sup.children, p = kids[kids.length - 1];
      if (!p || !/^[′″‴⁗]+$/.test(p.textContent.trim())) return;
      var tag = p.tagName.toLowerCase();
      if (tag !== "mo" && !(tag === "mrow" && Array.prototype.every.call(p.children, function (k) { return k.tagName.toLowerCase() === "mo"; }))) return;
      var ns = sup.namespaceURI, base = kids[0];
      var n = Array.from(p.textContent.trim()).reduce(function (k, ch) {
        return k + ({ "′": 1, "″": 2, "‴": 3, "⁗": 4 }[ch] || 0);
      }, 0);
      var row = document.createElementNS(ns, "mrow");
      row.appendChild(base);
      for (var i = 0; i < n; i++) {
        var prime = document.createElementNS(ns, "mo");
        prime.textContent = "′";
        prime.setAttribute("lspace", i ? "0" : "0.05em");
        prime.setAttribute("rspace", "0");
        prime.setAttribute("class", "prime");
        row.appendChild(prime);
      }
      if (sup.tagName.toLowerCase() === "msubsup") {
        var sub = document.createElementNS(ns, "msub");
        sub.appendChild(row);
        sub.appendChild(kids[0]); // the subscript (base already moved)
        sup.parentNode.replaceChild(sub, sup);
      } else {
        sup.parentNode.replaceChild(row, sup);
      }
    });
  }
  function fixVariants(node) {
    Array.prototype.forEach.call(node.querySelectorAll("math [mathvariant]"), function (e) {
      var t = MV[e.getAttribute("mathvariant")];
      if (!t || e.children.length) return;
      e.textContent = Array.from(e.textContent).map(function (ch) { return mapChar(ch, t); }).join("");
      e.setAttribute("mathvariant", "normal");
    });
  }
  // Browsers' MathML gives operator names (lim sup, cos, ln…) no space after them; add TeX's thin space.
  function fixFnSpacing(node) {
    Array.prototype.forEach.call(node.querySelectorAll("mo"), function (mo) {
      if (mo.textContent !== "⁡" || mo.dataset.sp) return;
      mo.dataset.sp = "1";
      var p = mo.parentNode, unit = mo, name = mo.previousElementSibling;
      if (p && /^mrow$/i.test(p.tagName) && p.parentNode && /^(munder|msub|munderover|msubsup)$/i.test(p.parentNode.tagName) && p.parentNode.firstElementChild === p) {
        unit = p.parentNode; name = unit;
      }
      var next = unit.nextElementSibling;
      var nextText = next ? next.textContent.trim().charAt(0) : "";
      if (next && "([{|".indexOf(nextText) < 0) unit.style.marginInlineEnd = "0.17em";
      var prev = name && name.previousElementSibling;
      if (prev && !/^[(\[{|]$/.test(prev.textContent.trim())) name.style.marginInlineStart = "0.17em";
    });
  }

  // ---- events between modules: C.on("admin", fn), C.emit("admin")
  var handlers = {};
  function on(name, fn) { (handlers[name] = handlers[name] || []).push(fn); }
  function emit(name, arg) { (handlers[name] || []).forEach(function (fn) { fn(arg); }); }

  var toastTimer;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2400);
  }

  // ---------------------------------------------------------------- courses
  // The registry (courses/<id>/course.json + id) is embedded by build.py; a course's lessons, feed posts,
  // guide and legacy-id map are either embedded too (site/) or in data/<id>.json (pwa/), loaded on demand.
  // c.lectures: lecture dates "YYYY-MM-DD" (lecture n = c.lectures[n-1]) or null; c.guide: { name, title, author, url, anchors } or null
  var COURSES = (function () {
    var list = []; try { list = JSON.parse($("courses").textContent); } catch (e) { /* no courses */ }
    return list.map(function (c) {
      c.lectures = c.lectures && c.lectures.length ? c.lectures : null;
      c.guide = c.guide || null;
      c.short = c.short || c.title;
      c.handle = c.handle || c.id;
      return c;
    });
  })();
  function courseById(id) { return COURSES.filter(function (c) { return c.id === id; })[0] || null; }

  function rawData(c) {
    var node = $("data-" + c.id);
    if (node) { try { return Promise.resolve(JSON.parse(node.textContent)); } catch (e) { return Promise.reject(e); } }
    return fetch("data/" + c.id + ".json").then(function (r) { if (!r.ok) throw new Error("data/" + c.id + ".json: " + r.status); return r.json(); });
  }
  function load(c) {
    if (!c) return Promise.resolve(null);
    if (c.units) return Promise.resolve(c);
    if (!c._loading) {
      c._loading = rawData(c).then(function (d) {
        c.feedText = d.feed || "";
        c.guideData = d.guide || null;
        c.legacy = d.legacy || null;
        c.units = parseCourse(d.lessons || "", c.id);
        c.byKey = {};
        c.units.forEach(function (u) { u.lessons.forEach(function (l) { l.items.forEach(function (it) { if (it.key) c.byKey[it.key] = it; }); }); });
        migrate(c);
        emit("loaded", c);
        return c;
      }).catch(function (e) { c._loading = null; console.error("course " + c.id + ":", e); throw e; });
    }
    return c._loading;
  }
  function loadAll(list) { return Promise.all(list.map(function (c) { return load(c).catch(function () { return null; }); })); }

  // ---- lessons.txt → units / lessons / items. Units, lessons and questions carry a stable "#id"
  // (written by tools/assign_ids.py), so progress survives inserting or moving things.
  function head(s) {
    var parts = s.split("|").map(function (x) { return x.trim(); }), id = null, rest = [];
    parts.forEach(function (p, i) { if (i > 0 && /^#[A-Za-z0-9_-]+$/.test(p)) id = p.slice(1); else rest.push(p); });
    return { title: rest[0], lect: rest[1] || "", flags: rest.slice(2), id: id };
  }
  function parseCourse(text, cid) {
    var units = [], unit = null, lesson = null, item = null;
    text.split("\n").forEach(function (raw) {
      var line = raw.replace(/\s+$/, ""), m, h;
      if ((m = line.match(/^## (.*)/))) {
        h = head(m[1]);
        unit = { title: h.title, lect: h.lect, soon: h.flags.indexOf("soon") >= 0, sid: h.id, lessons: [] }; units.push(unit); item = null; return;
      }
      if ((m = line.match(/^### (.*)/))) {
        h = head(m[1]);
        lesson = { title: h.title, lect: h.lect, bonus: h.flags.indexOf("bonus") >= 0, sid: h.id, items: [] }; unit.lessons.push(lesson); item = null; return;
      }
      if ((m = line.match(/^~ (.*)/)) && lesson && !item) { lesson.icon = m[1]; return; }
      if ((m = line.match(/^> (.*)/))) { item = { kind: "learn", title: m[1].trim(), text: [] }; lesson.items.push(item); return; }
      if ((m = line.match(/^\? (\w+)(?:\s+#([A-Za-z0-9_-]+))?(?:\s*\|\s*(.*))?$/))) {
        var ans = (m[3] || "").trim(), flags = [];
        if (m[1] === "expr") { var pp = ans.split("|").map(function (x) { return x.trim(); }); ans = pp[0]; flags = pp.slice(1); }
        item = { kind: m[1], sid: m[2] || null, answer: ans, flags: flags, text: [], options: [], explain: "" }; lesson.items.push(item); return;
      }
      if (!item) return;
      if ((m = line.match(/^(@@?) (.*)/))) {
        var where = (m[1] === "@@" || item.kind === "learn") ? "figQ" : "figA";
        (item[where] = item[where] || []).push(m[2]);
        return;
      }
      if (item.kind !== "learn") {
        if ((m = line.match(/^([+-]) (.*)/))) { item.options.push({ html: escMath(m[2]), ok: m[1] === "+" }); return; }
        if ((m = line.match(/^! (.*)/))) { item.explain = escMath(m[1]); return; }
        if ((m = line.match(/^= (.*)/))) { item.show = escMath(m[1]); return; }
      }
      item.text.push(line);
    });
    units.forEach(function (u, ui) {
      u.id = u.sid ? cid + ":u:" + u.sid : cid + "-u" + (ui + 1);           // the fallback (no id) is the old positional key
      u.lessons.forEach(function (l, li) {
        l.id = l.sid ? cid + ":l:" + l.sid : u.id + "-l" + (li + 1);
        var qn = 0, firstLearn = true;
        l.items.forEach(function (it) {
          it.html = paras(it.text.join("\n"));
          it.lect = l.lect;
          it.cid = cid;
          it.lesson = l;
          if (it.kind === "learn") { it.first = firstLearn; firstLearn = false; it.cardId = l.id + ":c:" + slug(it.title); }
          else { qn++; it.key = it.sid ? cid + ":q:" + it.sid : l.id + "-q" + qn; }
        });
      });
      u.nodes = u.lessons.map(function (l) { return { id: l.id, title: l.title, lesson: l, unit: u, bonus: l.bonus, lect: l.lect, icon: l.icon }; });
      if (u.lessons.some(function (l) { return !l.bonus; })) u.nodes.push({ id: u.id + (u.sid ? ":cp" : "-cp"), title: null, checkpoint: true, unit: u, lect: u.lect });
    });
    return units;
  }
  function finalId(c) { return c.id + ":final"; }

  // ---------------------------------------------------------------- progress (kept in this browser)
  function loadJSON(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v && typeof v === "object" ? v : d; } catch (e) { return d; } }
  function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  var P = loadJSON("lemma.learn", {});          // never reassigned: the other modules keep a reference
  function normalize() {
    P.done = P.done || {}; P.mistakes = P.mistakes || {}; P.srs = P.srs || {};
    P.xp = P.xp || 0; P.streak = P.streak || 0; P.last = P.last || null;
  }
  normalize();
  function save() { saveJSON("lemma.learn", P); }

  // Old keys were positions ("calc1-u3-l2-q5"); courses/<id>/legacy-ids.json maps them to the stable ids.
  function migrate(c) {
    var map = c.legacy; if (!map) return;
    var moved = 0;
    ["done", "mistakes", "srs"].forEach(function (part) {
      var o = P[part];
      Object.keys(o).forEach(function (k) {
        var n = map[k]; if (!n) return;
        if (!(n in o)) o[n] = o[k];
        delete o[k]; moved++;
      });
    });
    if (moved) save();
    emit("migrated", c);
  }
  function newId(id) {          // for the feed's likes and saves
    for (var i = 0; i < COURSES.length; i++) { var m = COURSES[i].legacy; if (m && m[id]) return m[id]; }
    return null;
  }

  var ADMIN = (function () { try { return localStorage.getItem("lemma.admin") === "1"; } catch (e) { return false; } })();
  function isAdmin() { return ADMIN; }
  function setAdmin(on) {
    ADMIN = on;
    try { if (on) localStorage.setItem("lemma.admin", "1"); else localStorage.removeItem("lemma.admin"); } catch (e) { /* ignore */ }
    toast(on ? L().adminOnToast : L().adminOffToast);
    emit("admin", on);
  }
  // Courses with "draft": true in course.json are only listed in admin mode.
  function visibleCourses() { return COURSES.filter(function (c) { return ADMIN || !c.draft; }); }
  var courseId = (function () { try { return localStorage.getItem("lemma.course"); } catch (e) { return null; } })();
  function course() {
    var vis = visibleCourses();
    return vis.filter(function (c) { return c.id === courseId; })[0] || vis.filter(function (c) { return c["default"]; })[0] || vis[0] || COURSES[0];
  }
  function setCourse(id) { courseId = id; try { localStorage.setItem("lemma.course", id); } catch (e) { /* ignore */ } }
  function stringsFor(c) { return STR[c && c.lang] || STR.en; }
  function L() { return stringsFor(course()); }

  function dayStr(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function today() { return dayStr(new Date()); }
  function yesterday() { var d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); }
  function liveStreak() { return (P.last === today() || P.last === yesterday()) ? P.streak : 0; }
  function bumpStreak() {
    if (P.last === today()) return;
    P.streak = (P.last === yesterday()) ? P.streak + 1 : 1;
    P.last = today();
  }

  // ---- spaced repetition: P.srs[key] = [box, dueDay]. A first-try success moves the question up a box and
  // further into the future; a mistake sends it back to box 0 and tomorrow. New questions answered right start in box 2.
  var BOX_DAYS = [1, 1, 3, 7, 16, 35];
  function dayNum(d) { d = d || new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5); }
  Object.keys(P.mistakes).forEach(function (k) { if (!P.srs[k]) P.srs[k] = [0, dayNum()]; });   // old mistakes are due now
  function srsRecord(key, ok) {
    if (!key) return;
    var r = P.srs[key];
    if (ok) r = r ? [Math.min(5, r[0] + 1), 0] : [2, 0];
    else r = [0, 0];
    r[1] = dayNum() + BOX_DAYS[r[0]];
    P.srs[key] = r;
  }
  // one answer outside a lesson (the feed): spaced repetition + mistakes, saved
  function record(key, ok) {
    if (!key) return;
    srsRecord(key, ok);
    if (ok) delete P.mistakes[key]; else P.mistakes[key] = true;
    save();
  }
  function dueKeys(c) {
    var t = dayNum();
    if (!c.byKey) return [];
    return Object.keys(P.srs).filter(function (k) { return c.byKey[k] && P.srs[k][1] <= t; })
      .sort(function (a, b) { return P.srs[a][1] - P.srs[b][1] || P.srs[a][0] - P.srs[b][0]; });
  }

  // ---- lectures and the guide's anchors
  function lectNums(tag) { var m = String(tag || "").match(/\d+/g); return m ? m.map(Number) : []; }
  function lectDate(n, c) { c = c || course(); var d = c.lectures && c.lectures[n - 1]; if (!d) return ""; var p = d.split("-"); return Number(p[2]) + ". " + Number(p[1]) + "."; }
  function lectLabel(tag, long, c) {
    var ns = lectNums(tag); if (!ns.length) return "";
    var s = stringsFor(c || course());
    var range = ns.length > 1 ? ns[0] + "–" + ns[ns.length - 1] : String(ns[0]);
    if (long) return (ns.length > 1 ? s.lectures : s.lecture) + " " + range;
    return "P" + range + " · " + lectDate(ns[0], c);
  }
  // the lecture that is on now (the last one whose date has passed), 0 before the first
  function currentLecture(c) {
    if (!c.lectures) return 0;
    var t = today(), n = 0;
    c.lectures.forEach(function (d, i) { if (d <= t) n = i + 1; });
    return n;
  }
  function guideAnchor(tag, c) {
    c = c || course(); var A = c.guide && c.guide.anchors; if (!A) return null;
    var ns = lectNums(tag); return ns.length ? A[ns[ns.length - 1]] || A[ns[0]] || null : null;
  }
  function guideUrl(tag, c) { c = c || course(); var a = guideAnchor(tag, c); return a ? c.guide.url + a : null; }

  // ---------------------------------------------------------------- backup and restore
  function readSet(k) { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { return []; } }
  function backup() {
    return { app: "cusp", v: 2, date: new Date().toISOString(), learn: JSON.parse(JSON.stringify(P)),     // a copy, not the live object
      liked: readSet("lemma.f.liked"), saved: readSet("lemma.f.saved"), course: courseId };
  }
  // Restoring merges: nothing you have here is lost, the backup only adds or moves forward.
  function restore(b) {
    if (!b || b.app !== "cusp" || !b.learn || typeof b.learn !== "object") return false;
    var o = b.learn;
    Object.keys(o.done || {}).forEach(function (k) { P.done[k] = true; });
    Object.keys(o.mistakes || {}).forEach(function (k) { if (!(P.srs[k] && o.srs && o.srs[k] && P.srs[k][1] > o.srs[k][1])) P.mistakes[k] = true; });
    Object.keys(o.srs || {}).forEach(function (k) {
      var r = o.srs[k]; if (!Array.isArray(r) || r.length !== 2) return;
      if (!P.srs[k] || r[1] > P.srs[k][1]) P.srs[k] = r;
    });
    P.xp = Math.max(P.xp, +o.xp || 0);
    if (o.last && (!P.last || o.last > P.last)) { P.last = o.last; P.streak = +o.streak || 0; }
    else if (o.last === P.last) P.streak = Math.max(P.streak, +o.streak || 0);
    COURSES.forEach(function (c) { if (c.units) migrate(c); });
    save();
    [["lemma.f.liked", b.liked], ["lemma.f.saved", b.saved]].forEach(function (x) {
      if (!Array.isArray(x[1])) return;
      var s = readSet(x[0]); x[1].forEach(function (id) { if (s.indexOf(id) < 0) s.push(id); });
      try { localStorage.setItem(x[0], JSON.stringify(s)); } catch (e) { /* ignore */ }
    });
    emit("progress");
    return true;
  }

  var exports = {
    STR: STR, P: P, COURSES: COURSES, DAILY_Q: 10, FINAL_Q: 12,
    $: $, el: el, escapeHtml: escapeHtml, escMath: escMath, paras: paras, shuffle: shuffle, fmt: fmt, slug: slug,
    figs: figs, drawFigs: drawFigs, typeset: typeset, toast: toast, on: on, emit: emit,
    courseById: courseById, load: load, loadAll: loadAll, finalId: finalId, newId: newId, parseCourse: parseCourse,
    save: save, isAdmin: isAdmin, setAdmin: setAdmin, visibleCourses: visibleCourses, courses: visibleCourses,
    course: course, setCourse: setCourse, L: L, strings: L, stringsFor: stringsFor,
    today: today, yesterday: yesterday, liveStreak: liveStreak, bumpStreak: bumpStreak,
    dayNum: dayNum, srsRecord: srsRecord, record: record, dueKeys: dueKeys,
    lectNums: lectNums, lectDate: lectDate, lectLabel: lectLabel, currentLecture: currentLecture, guideAnchor: guideAnchor, guideUrl: guideUrl,
    backup: backup, restore: restore
  };
  Object.keys(exports).forEach(function (k) { C[k] = exports[k]; });
})();
