(function () {
  "use strict";

  // ---------- Strings ----------
  var STR = {
    en: {
      course: "Course", days: "days", learn: "Learn", feed: "Feed",
      complete: "{a} of {b} complete", review: "Review mistakes · {n}",
      unitK: "Unit {u} · {n} lessons", start: "Start", locked: "Finish the lessons before this one to unlock it.",
      soonUnit: "Coming soon", soonText: "Lessons for this part are in preparation.",
      chooseCourse: "Choose a course", inPrep: "In preparation",
      newIdea: "New idea", mc: "Choose the answer", tf: "True or false?", input: "Type your answer", multi: "Select all that apply",
      tTrue: "True", tFalse: "False", inHint: "A number or expression such as 3, -1/2, 0.5, 2π, 1/√3, ln 2, e^2 or ∞", yourAnswer: "Your answer", insert: "Insert",
      check: "Check", cont: "Continue", praise: ["Correct!", "Nice work.", "Exactly.", "Spot on.", "That's it."],
      notQuite: "Not quite", answer: "Answer:", again: "You'll see this one again at the end.",
      lessonDone: "Lesson complete", unitDone: "Unit complete", reviewDone: "Review done",
      clean: "No mistakes. Bonus XP for a clean run.", saved: "Mistakes you made are saved for review.",
      xp: "XP", acc: "Accuracy", streak: "Streak", checkpoint: "Unit checkpoint", bonus: "Bonus",
      streakToday: "Day streak: done for today", streakTodo: "Day streak: finish a lesson today to keep it",
      guide: "More in the guide", fromGuide: "From the guide", openOnline: "Open online", reviewTag: "Review", lecture: "Lecture", lectures: "Lectures", close: "Close lesson",
      singK: "lim · the end of the path", singTitle: "Singularity", singSub: "Final test: {n} questions from every unit.",
      singLocked: "Everything converges here. {n} lessons to go.", singDone: "Reached. You can fall in again any time.",
      singDoneTitle: "Singularity reached", singLockedToast: "Finish all core lessons first.",
      expr: "Type a formula", interval: "Write the interval", set: "Write the set", order: "Put the steps in order", build: "Build the statement",
      exprHint: "For example 2x cos(x^2), e^(-x), √(1-x^2) or 1/(1+x^2). You may leave out the multiplication sign.", plusC: "You don't need to write the constant C.",
      intervalHint: "For example (-1; 5), [0; ∞) or (-∞; -2) ∪ (2; ∞). Separate the endpoints with a semicolon.",
      setHint: "Separate the elements with semicolons, e.g. {-2; 2} or ±2. Empty set: ∅.",
      seeAs: "I read it as", tapHere: "Tap the tiles in the right order", counter: "Right, the statement is false. Which example disproves it?",
      daily: "Today's review · {n}", dailyDone: "Review done for today", dailyTitle: "Review",
      fAll: "All", fSaved: "Saved", fShuffle: "Shuffle", fNew: "Concept", fQuestion: "Question", fSolve: "Answer", fAgain: "Try again",
      fSolved: "Solved", fMissed: "Not this time", fFromLesson: "Lesson", fEmpty: "Nothing here yet.", fSavedEmpty: "Nothing saved yet. Tap the bookmark on any post to keep it here.",
      mapHere: "Where am I", mapFit: "Whole map", mapIn: "Zoom in", mapOut: "Zoom out", mapDone: "Done", mapAgain: "Play again",
      metric: "ds² = dr² + r² (dφ + ω(r) dr)²   ·   the space is flat, just slightly twisted",
      fLike: "Like", fSave: "Save", fRound: "You've seen everything here · fresh shuffle", fDraft: "draft"
    },
    cs: {
      course: "Kurz", days: "dní", learn: "Učit se", feed: "Feed",
      complete: "Splněno {a} z {b}", review: "Opakovat chyby · {n}",
      unitK: "{lect} · {n} lekcí", start: "Start", locked: "Lekce se odemkne po dokončení předchozích.",
      soonUnit: "Připravujeme", soonText: "Lekce k této části právě připravujeme.",
      chooseCourse: "Vyberte kurz", inPrep: "Připravujeme",
      newIdea: "Nový pojem", mc: "Vyberte odpověď", tf: "Pravda, nebo nepravda?", input: "Napište odpověď", multi: "Vyberte všechny správné",
      tTrue: "Pravda", tFalse: "Nepravda", inHint: "Číslo nebo výraz, např. 3, -1/2, 0,5, 2π, 1/√3, ln 2, e^2 nebo ∞", yourAnswer: "Vaše odpověď", insert: "Vložit",
      check: "Zkontrolovat", cont: "Pokračovat", praise: ["Správně!", "Výborně.", "Přesně tak.", "Ano!", "Super."],
      notQuite: "Tohle ne", answer: "Odpověď:", again: "Tahle otázka se na konci vrátí.",
      lessonDone: "Lekce hotová", unitDone: "Kapitola hotová", reviewDone: "Opakování hotové",
      clean: "Bez chyby. Bonusové XP za čistý průchod.", saved: "Chyby jsme uložili k opakování.",
      xp: "XP", acc: "Úspěšnost", streak: "Série", checkpoint: "Shrnutí kapitoly", bonus: "Bonus",
      streakToday: "Série dní: dnes splněno", streakTodo: "Série dní: dokončete dnes lekci, ať o ni nepřijdete",
      guide: "Více v Průvodci", fromGuide: "Z Průvodce", openOnline: "Otevřít online", reviewTag: "Opakování", lecture: "Přednáška", lectures: "Přednášky", close: "Zavřít lekci",
      singK: "lim · konec cesty", singTitle: "Singularita", singSub: "Závěrečný test: {n} otázek ze všech kapitol.",
      singLocked: "Sem všechno konverguje. Zbývá {n} lekcí.", singDone: "Dosaženo. Spadnout do ní můžete znovu kdykoli.",
      singDoneTitle: "Singularita dosažena", singLockedToast: "Nejdřív dokončete všechny povinné lekce.",
      expr: "Napište vzorec", interval: "Zapište interval", set: "Zapište množinu", order: "Seřaďte kroky", build: "Sestavte zápis",
      exprHint: "Např. 2x cos(x^2), e^(-x), √(1-x^2) nebo 1/(1+x^2). Znak násobení můžete vynechat.", plusC: "Konstantu C psát nemusíte.",
      intervalHint: "Např. (-1; 5), [0; ∞) nebo (-∞; -2) ∪ (2; ∞). Krajní body oddělte středníkem.",
      setHint: "Prvky oddělte středníkem, např. {-2; 2} nebo ±2. Prázdná množina: ∅.",
      seeAs: "Rozumím", tapHere: "Klepejte na dlaždice ve správném pořadí", counter: "Správně, tvrzení neplatí. Který příklad ho vyvrací?",
      daily: "Opakování na dnes · {n}", dailyDone: "Dnešní opakování hotové", dailyTitle: "Opakování",
      fAll: "Vše", fSaved: "Uložené", fShuffle: "Zamíchat", fNew: "Pojem", fQuestion: "Otázka", fSolve: "Odpovědět", fAgain: "Zkusit znovu",
      fSolved: "Vyřešeno", fMissed: "Tentokrát ne", fFromLesson: "Lekce", fEmpty: "Tady zatím nic není.", fSavedEmpty: "Zatím nic uloženého. Uložte si příspěvek ikonou záložky.",
      mapHere: "Kde jsem", mapFit: "Celá mapa", mapIn: "Přiblížit", mapOut: "Oddálit", mapDone: "Hotovo", mapAgain: "Projít znovu",
      metric: "ds² = dr² + r² (dφ + ω(r) dr)²   ·   prostor je plochý, jen trochu zkroucený",
      fLike: "To se mi líbí", fSave: "Uložit", fRound: "Všechno jste viděli · nové zamíchání", fDraft: "rozpracováno"
    }
  };

  // ---------- Courses (from courses/<id>/course.json, embedded by build.py) ----------
  // c.lectures: list of lecture dates "YYYY-MM-DD" (lecture n = c.lectures[n-1]), or null
  // c.guide: { name, title, author, url, anchors: { lectureNo: "#anchor" } }, or null
  var COURSES = (function () {
    var list = []; try { list = JSON.parse(document.getElementById("courses").textContent); } catch (e) { /* no courses */ }
    return list.map(function (c) {
      c.lectures = c.lectures && c.lectures.length ? c.lectures : null;
      c.guide = c.guide || null;
      c.short = c.short || c.title;
      c.handle = c.handle || c.id;
      return c;
    });
  })();
  function courseById(id) { return COURSES.filter(function (c) { return c.id === id; })[0] || null; }

  function lectNums(tag) { var m = String(tag || "").match(/\d+/g); return m ? m.map(Number) : []; }
  function lectDate(n, c) { c = c || course(); var d = c.lectures && c.lectures[n - 1]; if (!d) return ""; var p = d.split("-"); return Number(p[2]) + ". " + Number(p[1]) + "."; }
  function lectLabel(tag, long, c) {
    var ns = lectNums(tag); if (!ns.length) return "";
    var s = STR[(c || course()).lang] || STR.en;
    var range = ns.length > 1 ? ns[0] + "–" + ns[ns.length - 1] : String(ns[0]);
    if (long) return (ns.length > 1 ? s.lectures : s.lecture) + " " + range;
    return "P" + range + " · " + lectDate(ns[0], c);
  }
  function guideAnchor(tag, c) {
    c = c || course(); var A = c.guide && c.guide.anchors; if (!A) return null;
    var ns = lectNums(tag); return ns.length ? A[ns[ns.length - 1]] || A[ns[0]] || null : null;
  }
  function guideUrl(tag, c) { c = c || course(); var a = guideAnchor(tag, c); return a ? c.guide.url + a : null; }

  // ---------- In-app guide reader (courses/<id>/guide/guide.json; the link to the online version is kept) ----------
  var guideCache = {}, guideShown = null;
  function guideData(c) {
    if (!guideCache[c.id]) {
      var node = document.getElementById("guide-" + c.id);
      try { guideCache[c.id] = node ? JSON.parse(node.textContent) : { sections: {} }; } catch (e) { guideCache[c.id] = { sections: {} }; }
    }
    return guideCache[c.id];
  }
  function guideSection(anchor, c) { c = c || course(); return c.guide ? guideData(c).sections[String(anchor || "").replace(/^#/, "")] || null : null; }
  var guideScrollLock = "";
  function openGuide(anchor, c) {
    c = c || course(); var G = c.guide; if (!G) return;
    var sec = guideSection(anchor, c), s = STR[c.lang] || STR.en;
    if (!sec) { if (G.url) window.open(G.url + anchor, "_blank", "noopener"); return; }
    var g = document.getElementById("guide"), body = document.getElementById("guideBody");
    document.getElementById("guideKicker").textContent = (G.name || G.title) + " · " + sec.chapter;
    document.getElementById("guideTitle").textContent = sec.title;
    body.innerHTML = '<div class="guide-inner">' + sec.html +
      '<div class="guide-foot">' + (G.url ? '<a href="' + escapeHtml(G.url + anchor) + '" target="_blank" rel="noopener">' + escapeHtml(s.openOnline) + " ↗</a>" : "") +
      "<span>" + (G.author ? escapeHtml(G.author) + ", " : "") + "<i>" + escapeHtml(G.title || "") + "</i></span></div></div>";
    body.scrollTop = 0;
    if (g.hidden) guideScrollLock = document.body.style.overflow;
    g.hidden = false;
    document.body.style.overflow = "hidden";
    typeset(body);
    document.getElementById("guideClose").focus({ preventScroll: true });
  }
  function openGuideIndex(c) {
    c = c || course(); var G = c.guide; if (!G) return;
    var data = guideData(c), s = STR[c.lang] || STR.en;
    var g = document.getElementById("guide"), body = document.getElementById("guideBody");
    document.getElementById("guideKicker").textContent = G.author || G.name || "";
    document.getElementById("guideTitle").textContent = G.title || G.name || "";
    var html = '<div class="guide-inner"><nav class="g-toc" aria-label="Obsah">', ch = null;
    (data.order || []).forEach(function (k) {
      var sec = data.sections[k];
      if (sec.chapter !== ch) { if (ch !== null) html += "</ol>"; ch = sec.chapter; html += "<h4>" + escapeHtml(ch) + "</h4><ol>"; }
      html += '<li><button type="button" data-k="' + escapeHtml(k) + '">' + escapeHtml(sec.title) + "</button></li>";
    });
    html += "</ol></nav>" + (G.url ? '<div class="guide-foot"><a href="' + escapeHtml(G.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.openOnline) + " ↗</a></div>" : "") + "</div>";
    body.innerHTML = html;
    Array.prototype.forEach.call(body.querySelectorAll(".g-toc button"), function (bt) {
      bt.addEventListener("click", function () { var keep = guideScrollLock; openGuide("#" + bt.dataset.k, c); guideScrollLock = keep; });
    });
    body.scrollTop = 0;
    if (g.hidden) { guideScrollLock = document.body.style.overflow; }
    g.hidden = false;
    document.body.style.overflow = "hidden";
    typeset(body);
  }
  function closeGuide() {
    document.getElementById("guide").hidden = true;
    document.body.style.overflow = guideScrollLock;
  }
  document.getElementById("guideClose").addEventListener("click", closeGuide);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !document.getElementById("guide").hidden) closeGuide(); });

  var UNIT_COLORS = ["var(--def)", "var(--prf)", "var(--thm)", "var(--ex)", "var(--app)", "var(--hist)"];

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  // "<" inside $…$ would otherwise start an HTML tag and swallow text ($x<y$).
  function figs(list) { return (list || []).map(function (sp) { return window.LEMMA_FIG ? window.LEMMA_FIG.html(sp) : ""; }).join(""); }
  function drawFigs(node) { if (window.LEMMA_FIG) window.LEMMA_FIG.renderAll(node); }
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
      if (!p || !/^[\u2032\u2033\u2034\u2057]+$/.test(p.textContent.trim())) return;
      var tag = p.tagName.toLowerCase();
      if (tag !== "mo" && !(tag === "mrow" && Array.prototype.every.call(p.children, function (k) { return k.tagName.toLowerCase() === "mo"; }))) return;
      var ns = sup.namespaceURI, base = kids[0];
      var n = Array.from(p.textContent.trim()).reduce(function (k, ch) {
        return k + ({ "\u2032": 1, "\u2033": 2, "\u2034": 3, "\u2057": 4 }[ch] || 0);
      }, 0);
      var row = document.createElementNS(ns, "mrow");
      row.appendChild(base);
      for (var i = 0; i < n; i++) {
        var prime = document.createElementNS(ns, "mo");
        prime.textContent = "\u2032";
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
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---------- Parse course text ----------
  function parseCourse(text, cid) {
    var units = [], unit = null, lesson = null, item = null;
    text.split("\n").forEach(function (raw) {
      var line = raw.replace(/\s+$/, ""), m, parts;
      if ((m = line.match(/^## (.*)/))) {
        parts = m[1].split("|").map(function (s) { return s.trim(); });
        unit = { title: parts[0], lect: parts[1] || "", soon: parts[2] === "soon", lessons: [] }; units.push(unit); item = null; return;
      }
      if ((m = line.match(/^### (.*)/))) {
        parts = m[1].split("|").map(function (s) { return s.trim(); });
        lesson = { title: parts[0], lect: parts[1] || "", bonus: parts[2] === "bonus", items: [] }; unit.lessons.push(lesson); item = null; return;
      }
      if ((m = line.match(/^~ (.*)/)) && lesson && !item) { lesson.icon = m[1]; return; }
      if ((m = line.match(/^> (.*)/))) { item = { kind: "learn", title: m[1].trim(), text: [] }; lesson.items.push(item); return; }
      if ((m = line.match(/^\? (\w+)(?:\s*\|\s*(.*))?$/))) {
        var ans = (m[2] || "").trim(), flags = [];
        if (m[1] === "expr") { var pp = ans.split("|").map(function (x) { return x.trim(); }); ans = pp[0]; flags = pp.slice(1); }
        item = { kind: m[1], answer: ans, flags: flags, text: [], options: [], explain: "" }; lesson.items.push(item); return;
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
      u.id = cid + "-u" + (ui + 1);
      u.lessons.forEach(function (l, li) {
        l.id = u.id + "-l" + (li + 1);
        var qn = 0, firstLearn = true;
        l.items.forEach(function (it) {
          it.html = paras(it.text.join("\n"));
          it.lect = l.lect;
          it.cid = cid;
          if (it.kind === "learn") { it.first = firstLearn; firstLearn = false; }
          else { it.key = l.id + "-q" + (++qn); }
        });
      });
      u.nodes = u.lessons.map(function (l) { return { id: l.id, title: l.title, lesson: l, unit: u, bonus: l.bonus, lect: l.lect, icon: l.icon }; });
      if (u.lessons.some(function (l) { return !l.bonus; })) u.nodes.push({ id: u.id + "-cp", title: null, checkpoint: true, unit: u, lect: u.lect });
    });
    return units;
  }

  COURSES.forEach(function (c) {
    if ($("lessons-" + c.id)) {
      c.units = parseCourse($("lessons-" + c.id).textContent, c.id);
      c.byKey = {};
      c.units.forEach(function (u) { u.lessons.forEach(function (l) { l.items.forEach(function (it) { if (it.key) c.byKey[it.key] = it; }); }); });
    }
  });

  // ---------- Progress (kept in this browser) ----------
  function loadJSON(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v && typeof v === "object" ? v : d; } catch (e) { return d; } }
  function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  var P = loadJSON("lemma.learn", {});
  P.done = P.done || {}; P.mistakes = P.mistakes || {}; P.xp = P.xp || 0; P.streak = P.streak || 0; P.last = P.last || null;
  function save() { saveJSON("lemma.learn", P); }
  var ADMIN = (function () { try { return localStorage.getItem("lemma.admin") === "1"; } catch (e) { return false; } })();
  function setAdmin(on) {
    ADMIN = on;
    try { if (on) localStorage.setItem("lemma.admin", "1"); else localStorage.removeItem("lemma.admin"); } catch (e) { /* ignore */ }
    toast(on ? "Režim správce zapnut: všechny lekce jsou odemčené." : "Režim správce vypnut.");
    renderPath();
    if (window.LemmaFeed) window.LemmaFeed.reset();
  }
  // Courses with "draft": true in course.json are only listed in admin mode.
  function visibleCourses() { return COURSES.filter(function (c) { return ADMIN || !c.draft; }); }
  var courseId = (function () { try { return localStorage.getItem("lemma.course"); } catch (e) { return null; } })();
  function course() {
    var vis = visibleCourses();
    return vis.filter(function (c) { return c.id === courseId; })[0] || vis.filter(function (c) { return c["default"]; })[0] || vis[0] || COURSES[0];
  }
  function L() { return STR[course().lang] || STR.en; }
  function fmt(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }

  function dayStr(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function today() { return dayStr(new Date()); }
  function yesterday() { var d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); }
  // ---------- Spaced repetition: Leitner boxes per question ----------
  // P.srs[key] = [box, dueDay]. A first-try success moves the question up a box and further into the future;
  // a mistake sends it back to box 0 and tomorrow. New questions answered right start in box 2.
  var BOX_DAYS = [1, 1, 3, 7, 16, 35], DAILY_Q = 10;
  function dayNum(d) { d = d || new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5); }
  P.srs = P.srs || {};
  Object.keys(P.mistakes).forEach(function (k) { if (!P.srs[k]) P.srs[k] = [0, dayNum()]; });   // old mistakes are due now
  function srsRecord(key, ok) {
    if (!key) return;
    var r = P.srs[key];
    if (ok) r = r ? [Math.min(5, r[0] + 1), 0] : [2, 0];
    else r = [0, 0];
    r[1] = dayNum() + BOX_DAYS[r[0]];
    P.srs[key] = r;
  }
  function dueKeys(c) {
    var t = dayNum();
    return Object.keys(P.srs).filter(function (k) { return c.byKey[k] && P.srs[k][1] <= t; })
      .sort(function (a, b) { return P.srs[a][1] - P.srs[b][1] || P.srs[a][0] - P.srs[b][0]; });
  }
  function liveStreak() { return (P.last === today() || P.last === yesterday()) ? P.streak : 0; }
  function bumpStreak() {
    if (P.last === today()) return;
    P.streak = (P.last === yesterday()) ? P.streak + 1 : 1;
    P.last = today();
  }

  function applyChrome() {
    var s = L(), c = course();
    document.documentElement.lang = c.lang;
    $("courseKicker").textContent = s.course;
    $("daysLabel").textContent = s.days;
    $("tabLearnLabel").textContent = s.learn;
    $("tabFeedLabel").textContent = s.feed;
    $("lessonClose").setAttribute("aria-label", s.close);
  }

  function renderStats() {
    var s = L();
    $("streakN").textContent = liveStreak();
    $("streakStat").classList.toggle("cold", P.last !== today());
    $("streakStat").title = P.last === today() ? s.streakToday : s.streakTodo;
    $("xpN").textContent = P.xp;
  }

  var toastTimer;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2400);
  }

  // ---------- Path ----------
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  var ICON_STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8L12 3Z"/></svg>';
  var ICON_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  var ICON_FLAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>';
  var ICON_SPARK = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Zm7 12 .9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14Z"/></svg>';
  var FINAL_Q = 12;

  function allNodes(c) { var out = []; c.units.forEach(function (u) { out = out.concat(u.nodes); }); return out; }
  function mistakeKeys(c) { return Object.keys(P.mistakes).filter(function (k) { return c.byKey[k]; }); }
  function nodeTitle(n) { return n.checkpoint ? L().checkpoint : n.title.replace(/^Bonus:\s*/, ""); }

  function nodeStatuses(c) {
    var st = {}, coreOk = true, currentSet = false;
    allNodes(c).forEach(function (n) {
      if (P.done[n.id]) { st[n.id] = "done"; return; }
      if (n.bonus) { st[n.id] = (coreOk || ADMIN) ? "open" : "locked"; return; }
      if (coreOk && !currentSet) { st[n.id] = "current"; currentSet = true; coreOk = false; return; }
      coreOk = false; st[n.id] = ADMIN ? "open" : "locked";
    });
    return st;
  }

  // The path is a spiral map (app/js/path.js): it starts on the outer rim and winds into the singularity.
  function unitKicker(c, u, ui) { return c.lectures && u.lect ? u.lect : c.lang === "cs" ? "Kapitola " + (ui + 1) : "Unit " + (ui + 1); }
  function renderPath() {
    var c = course(), s = L(), path = $("path");
    $("courseName").textContent = c.title;
    $("courseName").parentNode.classList.toggle("long", c.title.length > 16);
    applyChrome();
    renderStats();
    if (!c.units) { path.innerHTML = ""; path.classList.remove("space"); path.appendChild(el("p", "soon", escapeHtml(s.soonText))); return; }
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
    var due = dueKeys(c);
    if (due.length) {
      var rb = el("button", "review-btn", fmt(s.daily, { n: Math.min(due.length, DAILY_Q) + (due.length > DAILY_Q ? "+" : "") }));
      rb.type = "button";
      rb.addEventListener("click", function () { startSession({ review: true }); });
      row.appendChild(rb);
    } else if (Object.keys(P.srs).some(function (k) { return c.byKey[k]; })) {
      row.appendChild(el("span", "review-ok", "✓ " + escapeHtml(s.dailyDone)));
    }
    hud.appendChild(row);
    if (ADMIN) {
      var ab = el("div", "admin-bar", '<span class="admin-k">Správce</span><span>Všechny lekce jsou odemčené.</span>');
      var rs = el("button", "admin-btn", "Vynulovat postup");
      rs.type = "button";
      rs.addEventListener("click", function () {
        if (rs.dataset.armed !== "1") { rs.dataset.armed = "1"; rs.textContent = "Opravdu vynulovat?"; return; }
        P.done = {}; P.mistakes = {}; P.srs = {}; P.xp = 0; P.streak = 0; P.last = null; save(); toast("Postup vynulován."); renderPath();
      });
      var off = el("button", "admin-btn", "Vypnout");
      off.type = "button";
      off.addEventListener("click", function () { setAdmin(false); });
      ab.appendChild(rs); ab.appendChild(off);
      hud.appendChild(ab);
    }

    // the stops along the spiral, from the rim inwards
    var items = [], byId = {}, lastLect = 0;
    c.units.forEach(function (u, ui) {
      var color = UNIT_COLORS[ui % UNIT_COLORS.length], kicker = unitKicker(c, u, ui);
      if (u.soon) {
        items.push({ id: u.id + "-soon", unit: u, soon: true, status: "locked", color: color, icon: ICON_LOCK, badge: "",
          unitTitle: u.title, unitKicker: kicker, aria: u.title + " · " + s.soonUnit });
        return;
      }
      u.nodes.forEach(function (n, k) {
        var status = st[n.id], ln = lectNums(n.lect)[0], tick = null;
        if (c.lectures && ln && ln > lastLect && !n.checkpoint) { tick = "P" + ln; lastLect = ln; }
        items.push({
          id: n.id, n: n, unit: u, status: status, color: color, checkpoint: !!n.checkpoint, bonus: !!n.bonus, tick: tick,
          icon: n.checkpoint ? '<span class="qed">∎</span>' : n.icon ? window.LEMMA_PATH.icon(n.icon) : n.bonus ? ICON_SPARK : ICON_STAR,
          badge: status === "done" ? '<span class="nbadge ok">' + ICON_CHECK + "</span>" : status === "locked" ? '<span class="nbadge">' + ICON_LOCK + "</span>" : "",
          unitTitle: k === 0 ? u.title : null, unitKicker: kicker,
          aria: nodeTitle(n) + (status === "done" ? " ✓" : status === "locked" ? " 🔒" : "")
        });
      });
    });
    items.forEach(function (it) { byId[it.id] = it; });

    // Everything converges to the singularity: a final test over the whole course.
    var left = core.length - doneCount, fid = c.id + "-final";
    var fstat = P.done[fid] ? "done" : (left === 0 || ADMIN) ? "open" : "locked";
    var cur = items.filter(function (it) { return it.status === "current"; })[0];

    function goBtn(label, fn) { var b = el("button", "fc-go", escapeHtml(label)); b.type = "button"; b.addEventListener("click", fn); return b; }
    // the card at the bottom: what the tapped stop is, and the button to play it
    function card(id) {
      var box = el("div", "fc"), foot = el("div", "fc-row");
      if (id === "sing") {
        box.classList.add("fc-sing");
        box.appendChild(el("div", "fc-k", escapeHtml(s.singK)));
        var st0 = el("div", "fc-txt");
        st0.appendChild(el("div", "fc-t", escapeHtml(P.done[fid] ? s.singDoneTitle : s.singTitle)));
        st0.appendChild(el("div", "fc-s", escapeHtml(fstat === "locked" ? fmt(s.singLocked, { n: left }) : fstat === "done" ? s.singDone : fmt(s.singSub, { n: FINAL_Q }))));
        foot.appendChild(st0);
        if (fstat !== "locked") foot.appendChild(goBtn(fstat === "done" ? s.mapAgain : s.start, function () { startSession({ final: true }); }));
        box.appendChild(foot);
        return box;
      }
      var it = byId[id], txt = el("div", "fc-txt");
      box.style.setProperty("--u", it.color);
      var lect = c.lectures && it.n && it.n.lect && !it.checkpoint ? lectLabel(it.n.lect) : it.unitKicker;
      box.appendChild(el("div", "fc-k", escapeHtml(it.unit.title + " · " + lect)));
      txt.appendChild(el("div", "fc-t", (it.bonus ? '<span class="bonus-k">' + escapeHtml(s.bonus) + "</span> " : "") + escapeHtml(it.soon ? s.soonUnit : nodeTitle(it.n))));
      if (it.soon) txt.appendChild(el("div", "fc-s", escapeHtml(s.soonText)));
      else if (it.status === "locked") txt.appendChild(el("div", "fc-s", escapeHtml(s.locked)));
      else if (it.status === "done") txt.appendChild(el("div", "fc-s ok", "✓ " + escapeHtml(s.mapDone)));
      foot.appendChild(txt);
      if (!it.soon && it.status !== "locked") foot.appendChild(goBtn(it.status === "done" ? s.mapAgain : s.start, function () { startSession({ node: it.n }); }));
      box.appendChild(foot);
      return box;
    }

    window.LEMMA_PATH.space(path, {
      key: c.id, items: items, hud: hud, card: card, currentId: cur ? cur.id : "sing",
      sing: { status: fstat, title: P.done[fid] ? s.singDoneTitle : s.singTitle },
      strings: { start: s.start, here: s.mapHere, fit: s.mapFit, zin: s.mapIn, zout: s.mapOut },
      metric: s.metric
    });
  }

  // ---------- Course picker ----------
  function openSheet() {
    var list = $("courseList"); list.innerHTML = "";
    $("sheetTitle").textContent = L().chooseCourse;
    visibleCourses().forEach(function (c) {
      var b = el("button", "course-opt", "<b>" + escapeHtml(c.title) + (c.units ? "" : ' <span class="pill">' + escapeHtml(L().inPrep) + "</span>") + (c.draft ? ' <span class="pill">' + escapeHtml(L().fDraft) + "</span>" : "") + "</b><span>" + escapeHtml(c.blurb) + "</span>");
      b.type = "button";
      b.setAttribute("aria-pressed", String(c.id === courseId));
      if (!c.units) b.disabled = true;
      b.addEventListener("click", function () {
        courseId = c.id;
        try { localStorage.setItem("lemma.course", c.id); } catch (e) { /* ignore */ }
        closeSheet(); renderPath();
      });
      list.appendChild(b);
    });
    $("courseSheet").hidden = false;
  }
  function closeSheet() { $("courseSheet").hidden = true; }
  $("courseBtn").addEventListener("click", openSheet);
  (function () {
    var taps = [], pill = $("xpN").parentNode;
    pill.addEventListener("click", function () {
      var now = Date.now();
      taps = taps.filter(function (t) { return now - t < 3000; }); taps.push(now);
      if (taps.length >= 7) { taps = []; setAdmin(!ADMIN); }
    });
  })();
  $("courseSheet").addEventListener("click", function (e) { if (e.target === $("courseSheet")) closeSheet(); });

  // ---------- Lesson player ----------
  var S = null;
  var body = $("lessonBody"), foot = $("lessonFoot"), fb = $("fb"), primary = $("primary");

  // ---- Question bank: each session draws from the lesson's pool; templates get fresh numbers ----
  var LESSON_Q = 7, REVIEW_Q = 2, CHECKPOINT_Q = 8;
  function instantiate(it) {
    if (!it || it.kind !== "gen") return it;
    var g = window.LEMMA_GEN && window.LEMMA_GEN.get(it.cid, it.answer);
    if (!g) return null;
    var q = g();
    q.key = it.key; q.lect = it.lect; q.cid = it.cid; q.generated = true;
    if (q.fig) q.figA = [].concat(q.fig);
    q.html = escMath(q.html || ""); q.explain = escMath(q.explain || "");
    if (q.options) q.options.forEach(function (o) { o.html = escMath(o.html); });
    return q;
  }
  function lessonOf(c, key) { var id = key.replace(/-q\d+$/, ""), found = null; c.units.forEach(function (u) { u.lessons.forEach(function (l) { if (l.id === id) found = l; }); }); return found; }
  function pickReview(c, node, n) {
    var done = [];
    c.units.forEach(function (u) { u.lessons.forEach(function (l) { if (P.done[l.id] && l !== node.lesson) done.push(l); }); });
    if (!done.length) return [];
    var keys = dueKeys(c).filter(function (k) { var l = lessonOf(c, k); return l && l !== node.lesson; });
    var pool = [];
    done.forEach(function (l) { l.items.forEach(function (it) { if (it.key && keys.indexOf(it.key) < 0) pool.push(it.key); }); });
    keys = keys.concat(shuffle(pool)).slice(0, n);
    return keys.map(function (k) { var q = instantiate(c.byKey[k]); return q ? Object.assign({}, q, { review: true }) : null; }).filter(Boolean);
  }
  function startSession(opts) {
    var c = course(), queue;
    if (opts.items) {
      queue = opts.items;      // already instantiated (the feed passes the question it shows)
    } else if (opts.keys) {
      queue = opts.keys.map(function (k) { return instantiate(c.byKey[k]); });
    } else if (opts.review) {
      queue = shuffle(dueKeys(c).slice(0, DAILY_Q)).map(function (k) { return instantiate(c.byKey[k]); });
    } else if (opts.final) {
      // round-robin over the units so every chapter is represented
      var pools = c.units.map(function (u) {
        var q = []; u.lessons.forEach(function (l) { if (!l.bonus) l.items.forEach(function (it) { if (it.key) q.push(it); }); });
        return shuffle(q);
      }).filter(function (q) { return q.length; });
      queue = [];
      for (var round = 0; queue.length < FINAL_Q && round < 50; round++) pools.forEach(function (q) { if (queue.length < FINAL_Q && q[round]) queue.push(q[round]); });
      queue = shuffle(queue).map(instantiate);
    } else if (opts.node.checkpoint) {
      var qs = [];
      opts.node.unit.lessons.forEach(function (l) { if (!l.bonus) l.items.forEach(function (it) { if (it.key) qs.push(it); }); });
      queue = shuffle(qs).slice(0, CHECKPOINT_Q).map(instantiate);
    } else {
      var items = opts.node.lesson.items;
      var learn = items.filter(function (it) { return it.kind === "learn"; });
      var qsL = items.filter(function (it) { return it.key; });
      var gens = qsL.filter(function (it) { return it.kind === "gen"; });
      var stat = shuffle(qsL.filter(function (it) { return it.kind !== "gen"; }));
      gens = shuffle(gens).slice(0, 3);
      var chosen = shuffle(gens.concat(stat.slice(0, Math.max(0, LESSON_Q - gens.length)))).map(instantiate);
      queue = learn.concat(chosen, pickReview(c, opts.node, REVIEW_Q));
    }
    queue = queue.filter(Boolean);
    if (!queue.length) return;
    S = {
      node: opts.node || null, review: !!opts.review, final: !!opts.final, queue: queue, i: 0,
      feed: !!opts.feed, onDone: opts.onDone || null, result: null,
      goal: queue.length, progress: 0, missed: {}, questions: queue.filter(function (q) { return q.key; }).length, firstTry: 0
    };
    $("lesson").hidden = false;
    document.body.style.overflow = "hidden";
    renderItem();
  }

  function closeLesson() {
    var done = S && S.onDone, result = S && S.result;
    S = null;
    $("lesson").hidden = true;
    document.body.style.overflow = "";
    renderPath();
    if (done) done(result);
  }
  $("lessonClose").addEventListener("click", closeLesson);

  function setBar() { $("lessonBar").style.width = Math.round(100 * S.progress / S.goal) + "%"; }

  function renderItem() {
    var it = S.queue[S.i], s = L(), c = course();
    S.choice = null; S.checked = false; S.stage = 1; S.tiles = null; S.inputKind = null; S.spec = null; S.input = null;
    setBar();
    foot.dataset.state = ""; fb.hidden = true; fb.innerHTML = "";
    body.innerHTML = "";
    body.scrollTop = 0;
    var inner = el("div", "lesson-inner");
    body.appendChild(inner);

    if (it.kind === "learn") {
      inner.appendChild(el("div", "q-label new", s.newIdea + (c.lectures && it.lect ? " · " + escapeHtml(lectLabel(it.lect)) : "")));
      inner.appendChild(el("h2", "q-title", escapeHtml(it.title)));
      inner.appendChild(el("div", "learn-text", it.html + figs(it.figQ)));
      var ga = c.lectures && it.first ? guideAnchor(it.lect) : null;
      if (ga && guideSection(ga)) {
        var gb = el("button", "guide-btn", '<span class="gb-k">' + escapeHtml(s.fromGuide) + '</span><span class="gb-t">' + escapeHtml(guideSection(ga).title) + "</span><span aria-hidden=\"true\">→</span>");
        gb.type = "button";
        gb.addEventListener("click", function () { openGuide(ga); });
        inner.appendChild(gb);
      }
      primary.textContent = s.cont; primary.disabled = false;
      typeset(inner);
      drawFigs(inner);
      return;
    }

    inner.appendChild(el("div", "q-label" + (it.review ? " review" : ""), (it.review ? s.reviewTag + " · " : "") + (s[it.kind] || "")));
    inner.appendChild(el("div", "q-prompt", it.html.replace(/^<p>True or false:\s*/i, "<p>") + figs(it.figQ)));

    if (it.kind === "mc" || it.kind === "tf" || it.kind === "multi") {
      var opts = it.kind === "tf"
        ? [{ html: s.tTrue, ok: it.answer === "true" }, { html: s.tFalse, ok: it.answer === "false" }]
        : shuffle(it.options);
      S.box = optionBox(opts, it.kind === "multi", it.kind === "tf");
      inner.appendChild(S.box);
    } else if (it.kind === "order" || it.kind === "build") {
      buildTiles(inner, it);
    } else {
      buildInput(inner, it, s);
    }
    primary.textContent = s.check; primary.disabled = true;
    typeset(inner);
    drawFigs(inner);
  }

  // Options (mc, tf, multi, and the counterexample step of tf). An option "@ spec" is a figure.
  function optionBox(opts, multi, two) {
    var isFig = opts.some(function (o) { return /^@ /.test(o.html); });
    var box = el("div", "options" + (two ? " two" : "") + (isFig ? " figs" : ""));
    box.setAttribute("role", multi ? "group" : "radiogroup");
    opts.forEach(function (o) {
      var b = el("button", "opt" + (multi ? " check" : "") + (isFig ? " fig-opt" : ""), /^@ /.test(o.html) ? figs([o.html.slice(2)]) : o.html);
      b.type = "button";
      b.setAttribute("role", multi ? "checkbox" : "radio");
      b.setAttribute("aria-checked", "false");
      b._opt = o;
      b.addEventListener("click", function () {
        if (S.checked) return;
        if (multi) {
          b.setAttribute("aria-checked", String(b.getAttribute("aria-checked") !== "true"));
          primary.disabled = !box.querySelector('[aria-checked="true"]');
        } else {
          Array.prototype.forEach.call(box.children, function (x) { x.setAttribute("aria-checked", "false"); });
          b.setAttribute("aria-checked", "true");
          S.choice = b; primary.disabled = false;
        }
      });
      box.appendChild(b);
    });
    return box;
  }

  // Tiles: proofs to put in order, definitions to assemble from tokens (with decoys).
  function buildTiles(inner, it) {
    var order = it.kind === "order";
    var ans = el("div", "tiles-ans" + (order ? " order" : ""));
    ans.setAttribute("data-empty", L().tapHere);
    var bank = el("div", "tiles-bank" + (order ? " order" : ""));
    var pool = order ? it.options.filter(function (o) { return o.ok; }) : it.options;
    shuffle(pool).forEach(function (o) {
      var t = el("button", "tile", '<span class="tile-t">' + o.html + "</span>");
      t.type = "button"; t._opt = o;
      t.addEventListener("click", function () {
        if (S.checked || t.classList.contains("used")) return;
        var c = t.cloneNode(true);
        c._opt = o; c._src = t;
        c.addEventListener("click", function () {
          if (S.checked) return;
          t.classList.remove("used"); c.remove(); tilesChanged();
        });
        t.classList.add("used");
        ans.appendChild(c);
        tilesChanged();
      });
      bank.appendChild(t);
    });
    function tilesChanged() {
      var n = ans.children.length;
      primary.disabled = order ? n !== pool.length : n === 0;
      ans.classList.toggle("empty", n === 0);
    }
    ans.classList.add("empty");
    inner.appendChild(ans);
    inner.appendChild(bank);
    S.tiles = { ans: ans, bank: bank };
  }

  // Text answers: numbers, formulas, intervals, sets. Each kind gets its own keys and hint.
  var KEYS = {
    input: [["∞", "∞"], ["−∞", "-∞"], ["π", "π"], ["√", "√"]],
    expr: [["x", "x"], ["^", "^"], ["(", "("], [")", ")"], ["√", "√("], ["π", "π"], ["e", "e"], ["ln", "ln("], ["sin", "sin("], ["cos", "cos("]],
    interval: [["(", "("], [")", ")"], ["[", "["], ["]", "]"], [";", "; "], ["∞", "∞"], ["−∞", "-∞"], ["∪", " ∪ "]],
    set: [["{", "{"], ["}", "}"], [";", "; "], ["±", "±"], ["√", "√"], ["π", "π"], ["∅", "∅"]]
  };
  function buildInput(inner, it, s) {
    var kind = KEYS[it.kind] ? it.kind : "input";
    var spec = kind === "expr" ? window.LEMMA_ANS.exprSpec(it) : null;
    var inp = el("input", "answer-in" + (kind === "expr" ? " formula" : ""));
    inp.id = "answerInput";
    inp.type = "text"; inp.autocomplete = "off"; inp.setAttribute("autocapitalize", "off"); inp.setAttribute("autocorrect", "off"); inp.spellcheck = false;
    inp.setAttribute("aria-label", s.yourAnswer);
    inp.placeholder = s.yourAnswer;
    var prev = kind === "expr" ? el("div", "preview") : null, timer = 0;
    function changed() {
      primary.disabled = !inp.value.trim();
      if (prev) { clearTimeout(timer); timer = setTimeout(showPreview, 120); }
    }
    function showPreview() {
      var v = inp.value.trim();
      if (!v) { prev.innerHTML = ""; return; }
      try { prev.innerHTML = '<span class="pv-k">' + s.seeAs + ':</span> $' + window.LEMMA_ANS.previewTeX(v, spec.vars, spec.plusC) + "$"; prev.classList.remove("bad"); typeset(prev); }
      catch (e) { prev.textContent = e.message; prev.classList.add("bad"); }
    }
    inp.addEventListener("input", changed);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && !primary.disabled) { e.preventDefault(); primary.click(); } });
    inner.appendChild(inp);
    if (prev) inner.appendChild(prev);
    var keys = el("div", "keys" + (KEYS[kind].length > 4 ? " many" : ""));
    KEYS[kind].forEach(function (k) {
      var label = k[0] === "x" && spec ? spec.vars[0] : k[0], ins = k[1] === "x" && spec ? spec.vars[0] : k[1];
      var kb = el("button", "key", label);
      kb.type = "button";
      kb.setAttribute("aria-label", s.insert + " " + label);
      kb.addEventListener("mousedown", function (e) { e.preventDefault(); });
      kb.addEventListener("click", function () {
        if (inp.readOnly) return;
        var a = inp.selectionStart != null ? inp.selectionStart : inp.value.length;
        var b = inp.selectionEnd != null ? inp.selectionEnd : inp.value.length;
        inp.value = inp.value.slice(0, a) + ins + inp.value.slice(b);
        var pos = a + ins.length;
        try { inp.focus({ preventScroll: true }); inp.setSelectionRange(pos, pos); } catch (e) { /* ignore */ }
        changed();
      });
      keys.appendChild(kb);
    });
    inner.appendChild(keys);
    var hint = kind === "expr" ? s.exprHint + (spec.plusC ? " " + s.plusC : "") : kind === "interval" ? s.intervalHint : kind === "set" ? s.setHint : s.inHint;
    inner.appendChild(el("div", "in-hint", escapeHtml(hint)));
    S.input = inp; S.inputKind = kind; S.spec = spec;
    setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 50);
  }

  function toNum(s) {
    s = String(s).trim().replace(/^[a-z]\s*=\s*/i, "").replace(/[−–]/g, "-").replace(/,/g, ".").replace(/\s+/g, "");
    var inf = s.toLowerCase().match(/^([+-]?)(∞|inf|infinity|nekonečno|nekonecno)$/);
    if (inf) return inf[1] === "-" ? -Infinity : Infinity;
    var m = s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/);
    if (m) return parseFloat(m[1]) / parseFloat(m[2]);
    if (/^[-+]?\d*\.?\d+$/.test(s)) return parseFloat(s);
    return evalExpr(s);
  }
  // Small, safe evaluator for answers such as 2π, π/4, 1/√3, ln2, e-1/e, π√2, e^2, e², 3·√2, ½.
  var SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };
  var VULG = { "½": "(1/2)", "⅓": "(1/3)", "⅔": "(2/3)", "¼": "(1/4)", "¾": "(3/4)", "⅕": "(1/5)", "⅙": "(1/6)", "⅛": "(1/8)" };
  function evalExpr(s) {
    var t = s.toLowerCase()
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, function (m) { return "^(" + m.split("").map(function (c) { return SUP[c]; }).join("") + ")"; })
      .replace(/[½⅓⅔¼¾⅕⅙⅛]/g, function (m) { return VULG[m]; })
      .replace(/[·×⋅]/g, "*").replace(/:/g, "/")
      .replace(/π|pi/g, "(P)")
      .replace(/sqrt|√/g, "S")
      .replace(/ln/g, "L")
      .replace(/e/g, "(E)");
    t = t.replace(/S\s*([0-9.]+|\(P\)|\(E\))/g, "S($1)").replace(/L\s*([0-9.]+|\(P\)|\(E\))/g, "L($1)");
    t = t.replace(/([0-9.)])\s*(?=[(SL])/g, "$1*");
    if (!/^[0-9+\-*\/().^SLPE]+$/.test(t)) return NaN;
    // powers: "^" -> "**"; a unary minus becomes (-1)* so that -2^2 = -4 and e^-1 work
    t = t.replace(/\^/g, "**").replace(/\*\*-(\d*\.?\d+|\([^()]*\))/g, "**(-$1)").replace(/(^|[(*\/+\-])-/g, "$1(-1)*");
    try {
      var v = Function("P", "E", "S", "L", "return (" + t + ");")(Math.PI, Math.E, Math.sqrt, Math.log);
      return typeof v === "number" ? v : NaN;
    } catch (e) { return NaN; }
  }
  function inputCorrect(given, answer) {
    var g = toNum(given);
    return answer.split(";").some(function (a) {
      var v = toNum(a);
      if (!isNaN(g) && !isNaN(v)) {
        if (!isFinite(g) || !isFinite(v)) return g === v;
        return Math.abs(g - v) <= 1e-3 * Math.max(1, Math.abs(v));
      }
      return given.trim().toLowerCase().replace(/\s+/g, "") === a.trim().toLowerCase().replace(/\s+/g, "");
    });
  }

  function answerTeX(it) {
    var A = window.LEMMA_ANS;
    if (it.show) return it.show;
    if (it.kind === "expr") { var sp = A.exprSpec(it); return "$" + A.answerTeX(sp) + (sp.plusC ? " + C" : "") + "$"; }
    if (it.kind === "interval") return "$" + A.intervalTeX(it.answer) + "$";
    if (it.kind === "set") return "$" + A.setTeX(it.answer) + "$";
    return escapeHtml(it.answer.split(";")[0].trim());
  }
  function inputError(msg) {
    var old = S.input.parentNode.querySelector(".in-error");
    if (old) old.remove();
    var e = el("div", "in-error", escapeHtml(msg));
    S.input.insertAdjacentElement("afterend", e);
    var inp = S.input;
    inp.classList.add("shake");
    setTimeout(function () { inp.classList.remove("shake"); }, 400);   // S may be gone by then
  }
  // Second step of a false true/false statement: pick the example that disproves it.
  function counterStep(it) {
    var s = L();
    Array.prototype.forEach.call(S.box.children, function (b) { b.disabled = true; if (b._opt.ok) b.classList.add("right"); });
    var q = el("div", "q-label counter", escapeHtml(s.counter));
    S.box.insertAdjacentElement("afterend", q);
    var box = optionBox(shuffle(it.options), false, false);
    q.insertAdjacentElement("afterend", box);
    S.box = box; S.choice = null; S.stage = 2;
    primary.disabled = true;
    typeset(box); drawFigs(box);
    setTimeout(function () { try { q.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) { /* ignore */ } }, 30);
  }

  function check() {
    var it = S.queue[S.i], s = L(), ok, answerHtml = "", A = window.LEMMA_ANS;
    if (S.inputKind && (it.kind === "input" || it.kind === "expr" || it.kind === "interval" || it.kind === "set")) {
      var r;
      if (it.kind === "expr") r = A.checkExpr(S.input.value, S.spec);
      else if (it.kind === "interval") r = A.checkInterval(S.input.value, it.answer);
      else if (it.kind === "set") r = A.checkSet(S.input.value, it.answer);
      else r = { ok: inputCorrect(S.input.value, it.answer) };
      if (r.error) { inputError(r.error); return; }
      var er = S.input.parentNode.querySelector(".in-error"); if (er) er.remove();
      ok = r.ok;
      S.input.readOnly = true;
      S.input.classList.add(ok ? "right" : "wrong");
      answerHtml = answerTeX(it);
    } else if (S.tiles) {
      var got = Array.prototype.map.call(S.tiles.ans.children, function (t) { return t._opt.html; });
      var want = it.options.filter(function (o) { return o.ok; }).map(function (o) { return o.html; });
      ok = got.length === want.length && got.every(function (h, i) { return h === want[i]; });
      Array.prototype.forEach.call(S.tiles.ans.children, function (t, i) { t.disabled = true; t.classList.add(t._opt.html === want[i] ? "right" : "wrong"); });
      Array.prototype.forEach.call(S.tiles.bank.children, function (t) { t.disabled = true; });
      answerHtml = it.kind === "order" ? "<ol class=\"ans-steps\"><li>" + want.join("</li><li>") + "</li></ol>" : want.join(" ");
    } else if (it.kind === "multi") {
      ok = true;
      var right = [];
      Array.prototype.forEach.call(S.box.children, function (b) {
        var sel = b.getAttribute("aria-checked") === "true";
        b.disabled = true;
        if (b._opt.ok) { b.classList.add("right"); right.push(b._opt.html); }
        else if (sel) b.classList.add("wrong");
        if (sel !== b._opt.ok) ok = false;
      });
      answerHtml = right.join(", ");
    } else {
      ok = S.choice._opt.ok;
      if (ok && it.kind === "tf" && S.stage !== 2 && it.answer === "false" && it.options && it.options.length) { counterStep(it); return; }
      Array.prototype.forEach.call(S.box.children, function (b) {
        b.disabled = true;
        if (b._opt.ok) { b.classList.add("right"); answerHtml = /^@ /.test(b._opt.html) ? "" : b._opt.html; }
        else if (b === S.choice) b.classList.add("wrong");
      });
    }
    S.checked = true;
    if (S.result === null) S.result = ok;

    if (ok) {
      if (!S.missed[it.key]) { S.firstTry++; delete P.mistakes[it.key]; srsRecord(it.key, true); }
      S.progress++;
    } else {
      if (!S.missed[it.key]) srsRecord(it.key, false);
      S.missed[it.key] = true;
      P.mistakes[it.key] = true;
      if (!S.feed) S.queue.push(it);   // a lesson asks a missed question again at the end
    }
    save();
    setBar();

    foot.dataset.state = ok ? "good" : "bad";
    fb.innerHTML = "<strong>" + (ok ? s.praise[Math.floor(Math.random() * s.praise.length)] : s.notQuite) + "</strong>" +
      (ok || !answerHtml ? "" : (it.kind === "order" ? "<p>" + s.answer + "</p>" + answerHtml : "<p>" + s.answer + " " + answerHtml + "</p>")) +
      (it.explain ? "<p>" + it.explain + "</p>" : "") +
      figs(it.figA) +
      (ok || S.feed ? "" : '<p class="muted">' + s.again + "</p>");
    fb.hidden = false;
    typeset(fb);
    drawFigs(fb);
    primary.textContent = s.cont; primary.disabled = false;
    primary.focus({ preventScroll: true });
  }

  function next() {
    var it = S.queue[S.i];
    if (it.kind === "learn") S.progress++;
    S.i++;
    if (S.i >= S.queue.length) { if (S.feed) closeLesson(); else finish(); } else renderItem();
  }

  function finish() {
    var s = L();
    var perfect = Object.keys(S.missed).length === 0;
    var xp = S.review ? Math.max(5, 2 * S.questions) : S.final ? 50 : (S.node.checkpoint ? 20 : 10);
    if (perfect && !S.review) xp += 5;
    P.xp += xp;
    if (S.node) P.done[S.node.id] = true;
    if (S.final) P.done[course().id + "-final"] = true;
    bumpStreak();
    save();
    S.progress = S.goal; setBar();

    var acc = S.questions ? Math.round(100 * S.firstTry / S.questions) : 100;
    body.innerHTML = "";
    var inner = el("div", "lesson-inner done-screen");
    inner.appendChild(el("div", "done-mark" + (S.final ? " sing-mark" : ""), S.final ? "∞" : "∎"));
    inner.appendChild(el("h2", "q-title", S.review ? s.reviewDone : S.final ? s.singDoneTitle : S.node.checkpoint ? s.unitDone : s.lessonDone));
    inner.appendChild(el("p", "in-hint", perfect ? s.clean : s.saved));
    inner.appendChild(el("div", "tiles",
      '<div class="tile"><div class="k">' + s.xp + '</div><div class="v">+' + xp + "</div></div>" +
      '<div class="tile"><div class="k">' + s.acc + '</div><div class="v">' + acc + "%</div></div>" +
      '<div class="tile"><div class="k">' + s.streak + '</div><div class="v">' + liveStreak() + "</div></div>"));
    body.appendChild(inner);
    foot.dataset.state = ""; fb.hidden = true;
    primary.textContent = s.cont; primary.disabled = false;
    S.finished = true;
  }

  primary.addEventListener("click", function () {
    if (!S) return;
    if (S.finished) { closeLesson(); return; }
    var it = S.queue[S.i];
    if (it.kind !== "learn" && !S.checked) check(); else next();
  });

  // ---------- Tabs ----------
  var scrollMemo = {}, currentView = null;
  function show(view, force) {
    if (view !== "feed") view = "learn";
    var c = course();
    function memoKey(v) { return v === "learn" ? "learn-" + c.id : v; }   // the path scroll is per course, the feed is shared
    if (currentView && !force) scrollMemo[memoKey(currentView)] = window.scrollY;
    currentView = view;
    $("view-learn").hidden = view !== "learn";
    $("view-feed").hidden = view !== "feed";
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
      if (t.dataset.view === view) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
    });
    if (view === "feed" && window.LemmaFeed) window.LemmaFeed.show();
    if (view === "learn") window.LEMMA_PATH.refresh();
    window.scrollTo(0, force ? 0 : (scrollMemo[memoKey(view)] || 0));
    if (view === "feed" && window.LemmaFeed) window.LemmaFeed.fill();
  }
  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
    t.addEventListener("click", function () {
      try { history.replaceState(null, "", "#" + t.dataset.view); } catch (e) { /* ignore */ }
      show(t.dataset.view);
    });
  });
  window.addEventListener("hashchange", function () { show(location.hash.slice(1)); });

  // Shared with the feed (app/js/feed.js)
  window.LEMMA = {
    course: course, courses: visibleCourses, strings: L, typeset: typeset, escapeHtml: escapeHtml, paras: paras, escMath: escMath,
    figs: figs, drawFigs: drawFigs, shuffle: shuffle, instantiate: instantiate,
    lectNums: lectNums, lectLabel: lectLabel, lectDate: lectDate, openGuide: openGuide, openGuideIndex: openGuideIndex,
    guideSection: guideSection, guideAnchor: guideAnchor, guideUrl: guideUrl, isAdmin: function () { return ADMIN; }, today: today,
    // play one question in the lesson player; onDone(true | false | null) runs when it closes
    answer: function (q, onDone) { startSession({ items: [q], feed: true, onDone: onDone }); },
    _answerOk: function (given, answer) { return inputCorrect(given, answer); },
    goLearn: function () { try { history.replaceState(null, "", "#learn"); } catch (e) { /* ignore */ } show("learn"); },
    debugItem: function () { return S && S.queue[S.i]; },
    debugStage: function () { return S ? S.stage : 0; },
    _playKeys: function (keys) { startSession({ keys: keys, review: true }); },
    _allKeys: function () { var c = course(), out = []; c.units.forEach(function (u) { u.lessons.forEach(function (l) { out.push(l.items.filter(function (it) { return it.key; }).map(function (it) { return it.key; })); }); }); return out; },
    _srs: function () { return P.srs; }, _due: function () { return dueKeys(course()).length; },
    countLessons: function (c) { var n = 0; (c.units || []).forEach(function (u) { u.lessons.forEach(function (l) { if (!l.bonus) n++; }); }); return n; }
  };

  renderPath();
  show(location.hash.slice(1));
})();
