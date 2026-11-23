/* The lesson player: lessons, checkpoints, today's review, the final test, and single questions from the feed.
   Question kinds: mc, multi, tf (with an optional counterexample step), input, expr, interval, set, order, build, gen. */
(function () {
  "use strict";
  var C = window.CUSP;
  var $ = C.$, el = C.el, escapeHtml = C.escapeHtml, escMath = C.escMath, figs = C.figs, drawFigs = C.drawFigs,
      typeset = C.typeset, shuffle = C.shuffle, course = C.course, L = C.L, P = C.P, save = C.save,
      srsRecord = C.srsRecord, dueKeys = C.dueKeys, bumpStreak = C.bumpStreak, liveStreak = C.liveStreak,
      lectLabel = C.lectLabel, guideAnchor = C.guideAnchor, FINAL_Q = C.FINAL_Q;
  function guideSection(a, c) { return C.guideSection(a, c); }
  function openGuide(a, c) { C.openGuide(a, c); }

  var S = null;
  var body = $("lessonBody"), foot = $("lessonFoot"), fb = $("fb"), primary = $("primary"), secondary = $("secondary");

  // ---- Question bank: each session draws from the lesson's pool; templates get fresh numbers ----
  var LESSON_Q = 7, REVIEW_Q = 2, CHECKPOINT_Q = 8;
  var HEARTS = 3;   // lives in a lesson, checkpoint or final test; losing the last one means starting it again
  var HEART = '<path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/>';
  function instantiate(it) {
    if (!it || it.kind !== "gen") return it;
    var g = window.CUSP_GEN && window.CUSP_GEN.get(it.cid, it.answer);
    if (!g) return null;
    var q;
    try { q = g(); } catch (e) { console.error("courses/" + it.cid + "/generators.js: " + it.answer + ":", e); return null; }   // skip it, keep the lesson going
    if (!q) return null;
    q.key = it.key; q.lect = it.lect; q.cid = it.cid; q.lesson = it.lesson; q.generated = true; q.gen = it.answer;
    if (q.fig) q.figA = [].concat(q.fig);
    q.html = escMath(q.html || ""); q.explain = escMath(q.explain || "");
    if (q.options) q.options.forEach(function (o) { o.html = escMath(o.html); });
    return q;
  }
  function lessonOf(c, key) { var it = c.byKey[key]; return it ? it.lesson : null; }
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
      queue = shuffle(dueKeys(c).slice(0, C.DAILY_Q)).map(function (k) { return instantiate(c.byKey[k]); });
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
      var chosen;
      if (opts.fresh) {
        // "new questions" of a finished lesson: the ones never answered first, then others to fill the lesson
        var order = shuffle(C.unseen(opts.node.lesson)).concat(shuffle(qsL.filter(function (it) { return P.srs[it.key]; })));
        var nGen = 0; chosen = [];
        order.forEach(function (it) {
          if (chosen.length >= LESSON_Q || (it.kind === "gen" && nGen >= 3)) return;
          if (it.kind === "gen") nGen++;
          chosen.push(it);
        });
        chosen = shuffle(chosen).map(instantiate);
      } else {
        var gens = qsL.filter(function (it) { return it.kind === "gen"; });
        var stat = shuffle(qsL.filter(function (it) { return it.kind !== "gen"; }));
        gens = shuffle(gens).slice(0, 3);
        chosen = shuffle(gens.concat(stat.slice(0, Math.max(0, LESSON_Q - gens.length)))).map(instantiate);
      }
      queue = learn.concat(chosen, pickReview(c, opts.node, REVIEW_Q));
    }
    queue = queue.filter(Boolean);
    if (!queue.length) return;
    S = {
      node: opts.node || null, review: !!opts.review, final: !!opts.final, queue: queue, i: 0,
      feed: !!opts.feed, onDone: opts.onDone || null, result: null,
      goal: queue.length, progress: 0, missed: {}, questions: queue.filter(function (q) { return q.key; }).length, firstTry: 0,
      opts: opts, hearts: opts.review || opts.feed ? null : HEARTS   // daily review and the feed are practice: no lives
    };
    renderHearts(false);
    $("lesson").hidden = false;
    document.body.style.overflow = "hidden";
    pushLessonState();
    renderItem();
  }

  // Back (Android's button, a swipe, the browser's arrow) closes the lesson instead of leaving the app: an open
  // lesson has its own history entry. Back while the guide is open over a lesson closes just the guide.
  function pushLessonState() {
    try { if (!(history.state && history.state.cuspLesson)) history.pushState({ cuspLesson: 1 }, ""); } catch (e) { /* ignore */ }
  }
  window.addEventListener("popstate", function () {
    if (!S) return;
    if (!$("guide").hidden) { $("guideClose").click(); pushLessonState(); return; }
    closeLesson(true);
  });

  function closeLesson(byBack) {
    var done = S && S.onDone, result = S && S.result;
    S = null;
    $("lesson").hidden = true;
    document.body.style.overflow = "";
    if (byBack !== true) { try { if (history.state && history.state.cuspLesson) history.back(); } catch (e) { /* ignore */ } }
    C.emit("progress");
    if (done) done(result);
  }
  $("lessonClose").addEventListener("click", function () { closeLesson(); });

  // the course an item belongs to: the feed plays questions from every course, whichever course is selected
  function itemCourse(it) { return (it && it.cid && C.courseById(it.cid)) || course(); }
  // a report link for an item, naming where the student met it
  function reportLink(it) {
    var from = S.feed ? "feed" : S.review ? "daily review" : S.final ? "final test" : S.node && S.node.checkpoint ? "checkpoint" :
      it.review ? "lesson (review question)" : "lesson";
    return C.reportLink(itemCourse(it), C.reportItem(it, from));
  }

  function renderHearts(lost) {
    var box = $("lessonHearts");
    box.hidden = S.hearts === null;
    if (S.hearts === null) return;
    var h = "";
    for (var i = 0; i < HEARTS; i++) {
      h += '<svg viewBox="0 0 24 24" aria-hidden="true"' + (i >= S.hearts ? ' class="lost' + (lost && i === S.hearts ? ' lose' : '') + '"' : "") + ">" + HEART + "</svg>";
    }
    box.innerHTML = h;
    box.setAttribute("aria-label", C.fmt(L().hearts, { n: S.hearts, m: HEARTS }));
  }

  function setBar() { $("lessonBar").style.width = Math.round(100 * S.progress / S.goal) + "%"; }

  function renderItem() {
    var it = S.queue[S.i], c = itemCourse(it), s = C.stringsFor(c);
    S.choice = null; S.checked = false; S.stage = 1; S.tiles = null; S.match = null; S.inputKind = null; S.spec = null; S.input = null;
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
      inner.appendChild(el("div", "report-row", reportLink(it)));
      primary.textContent = s.cont; primary.disabled = false;
      secondary.hidden = true;
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
    } else if (it.kind === "match") {
      buildMatch(inner, it, s);
    } else {
      buildInput(inner, it, s);
    }
    primary.textContent = s.check; primary.disabled = true;
    S.knowMode = canSkipAsKnown(it);
    secondary.textContent = S.knowMode ? s.knowIt : s.dontKnow;
    secondary.hidden = false;
    typeset(inner);
    drawFigs(inner);
    // a match item too wide for its half of the grid (a long formula): give every item a full-width row
    if (S.match && !S.match.rights.classList.contains("m-long") &&
        Array.prototype.some.call(S.match.rights.querySelectorAll(".m-body"), function (b) { return b.scrollWidth > b.clientWidth + 1; })) {
      S.match.rights.classList.add("m-long");
    }
  }

  // Matching pairs (a function and its graph): the left items are buttons on top, the right items (usually
  // graphs) a grid below. Tap one of each, in either order, to pair them; a pair shares a colour and the right
  // item shows its partner. Tapping a paired item again undoes the pair.
  var PAIR_COLORS = ["var(--def)", "var(--ex)", "var(--prf)", "var(--thm)", "var(--app)", "var(--hist)"];
  function buildMatch(inner, it, s) {
    var pairs = it.options.filter(function (o) { return o.ok; });
    var allFigs = it.options.every(function (o) { return /^@ /.test(o.right); });
    // graphs and short formulas: a 2-column grid; sentences (a theorem and its statement): one per row, full width
    var long = it.options.some(function (o) {             // count the words outside the formulas
      return !/^@ /.test(o.right) && C.plain(o.right).replace(/\$\$[\s\S]*?\$\$|\$[^$]*\$/g, "").trim().length > 24;
    });
    var lefts = el("div", "m-lefts"), rights = el("div", "m-rights" + (long ? " m-long" : "")), sel = null;
    shuffle(pairs).forEach(function (o, i) {
      var b = el("button", "m-left", o.left); b.type = "button"; b._opt = o;
      b.style.setProperty("--pc", PAIR_COLORS[i % PAIR_COLORS.length]);
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { pick(b); });
      lefts.appendChild(b);
    });
    shuffle(it.options).forEach(function (o, i) {
      var r = el("button", "m-right" + (/^@ /.test(o.right) ? " fig-right" : ""));
      r.type = "button"; r._opt = o; r._to = null;
      r.innerHTML = '<span class="m-tag" aria-hidden="true">' + String.fromCharCode(65 + i) + '</span>' +
        '<span class="m-body"><span class="m-in">' + (/^@ /.test(o.right) ? figs([o.right.slice(2)]) : o.right) + '</span></span><span class="m-slot"></span>';
      r.setAttribute("aria-label", s.mItem + " " + String.fromCharCode(65 + i));
      r.addEventListener("click", function () { pick(r); });
      rights.appendChild(r);
    });
    function leftOf(r) { return r._to; }
    function rightOf(l) { return Array.prototype.filter.call(rights.children, function (r) { return r._to === l; })[0] || null; }
    function pair(l, r) {
      var old = rightOf(l); if (old) old._to = null;           // l leaves its old partner
      r._to = l;                                               // r drops whoever it had
      changed();
    }
    function pick(x) {
      if (S.checked) return;
      var isLeft = x.classList.contains("m-left");
      if (!sel) {
        var partner = isLeft ? rightOf(x) : leftOf(x);
        if (partner && !isLeft) { x._to = null; changed(); return; }   // tap a paired graph: undo the pair
        sel = x; x.classList.add("m-sel"); x.setAttribute("aria-pressed", "true"); return;
      }
      if (sel === x) { clear(); return; }
      var selLeft = sel.classList.contains("m-left");
      if (selLeft === isLeft) { clear(); sel = x; x.classList.add("m-sel"); x.setAttribute("aria-pressed", "true"); return; }
      var l = isLeft ? x : sel, r = isLeft ? sel : x;
      clear();
      pair(l, r);
    }
    function clear() { if (sel) { sel.classList.remove("m-sel"); sel.setAttribute("aria-pressed", "false"); } sel = null; }
    function changed() {
      Array.prototype.forEach.call(lefts.children, function (l) { l.classList.toggle("m-used", !!rightOf(l)); });
      Array.prototype.forEach.call(rights.children, function (r) {
        var l = r._to, slot = r.querySelector(".m-slot");
        r.classList.toggle("m-paired", !!l);
        r.style.setProperty("--pc", l ? l.style.getPropertyValue("--pc") : "");
        slot.innerHTML = l ? '<span class="m-in">' + l._opt.left + "</span>" : "";
        r.setAttribute("aria-label", s.mItem + " " + r.querySelector(".m-tag").textContent + (l ? ": " + l.textContent : ""));
        if (l) typeset(slot);
      });
      primary.disabled = !Array.prototype.every.call(lefts.children, function (l) { return rightOf(l); });
    }
    inner.appendChild(lefts);
    inner.appendChild(rights);
    inner.appendChild(el("div", "in-hint", escapeHtml(allFigs ? s.mHintFig : s.mHint)));
    S.match = { lefts: lefts, rights: rights };
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

  // ? build: a statement may be assembled with its "and"/"or" parts in any order ("y ≤ x a x ≤ y ⇒ x = y" is the same
  // definition), and the two sides of "⇔" may be swapped. canonBuild writes a tile sequence in one fixed order:
  // the clauses between implication arrows (or commas) stay in place, the parts inside a clause are sorted.
  var B_AND = /^(a|and|\$\\(land|wedge)\$|∧)$/, B_OR = /^(nebo|or|\$\\(lor|vee)\$|∨)$/;
  var B_SPLIT = /^(\$\\(Rightarrow|Leftarrow|Leftrightarrow|iff|implies|impliedby)\$|⇒|⇐|⇔|,)$/, B_IFF = /Leftrightarrow|iff|⇔/;
  function canonBuild(tiles) {
    var out = [], clause = [];
    function clauseCanon() {
      var conns = clause.filter(function (k) { return B_AND.test(k) || B_OR.test(k); });
      var mixed = conns.some(function (k) { return B_AND.test(k) !== B_AND.test(conns[0]); });
      if (!conns.length || mixed) return clause.join(" ");              // "A a B nebo C": order matters, keep it
      var parts = [], cur = [];
      clause.forEach(function (k) { if (B_AND.test(k) || B_OR.test(k)) { parts.push(cur.join(" ")); cur = []; } else cur.push(k); });
      parts.push(cur.join(" "));
      return parts.sort().join(" " + conns[0] + " ");
    }
    tiles.map(function (h) { return String(h).trim(); }).forEach(function (k) {
      if (B_SPLIT.test(k)) { out.push(clauseCanon()); clause = []; out.push(k); } else clause.push(k);
    });
    out.push(clauseCanon());
    if (out.length === 3 && B_IFF.test(out[1]) && out[0] > out[2]) out = [out[2], out[1], out[0]];
    return out.join(" | ");
  }

  // Text answers: numbers, formulas, intervals, sets. Each kind gets its own keys and hint.
  var KEYS = {
    input: [["∞", "∞"], ["−∞", "-∞"], ["π", "π"], ["√", "√"]],
    expr: [["x", "x"], ["^", "^"], ["(", "("], [")", ")"], ["√", "√("], ["π", "π"], ["e", "e"], ["ln", "ln("], ["sin", "sin("], ["cos", "cos("]],
    interval: [["(", "("], [")", ")"], ["[", "["], ["]", "]"], [";", "; "], ["∞", "∞"], ["−∞", "-∞"], ["π", "π"], ["√", "√"], ["∪", " ∪ "]],
    set: [["{", "{"], ["}", "}"], [";", "; "], ["±", "±"], ["√", "√"], ["π", "π"], ["∅", "∅"]]
  };
  function buildInput(inner, it, s) {
    var kind = KEYS[it.kind] ? it.kind : "input";
    var spec = kind === "expr" ? window.CUSP_ANS.exprSpec(it) : null;
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
      try { prev.innerHTML = '<span class="pv-k">' + s.seeAs + ':</span> $' + window.CUSP_ANS.previewTeX(v, spec.vars, spec.plusC) + "$"; prev.classList.remove("bad"); typeset(prev); }
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
  // Numbers must match exactly (1209 is not 1210), except for rounding: a decimal with at least 2 places counts
  // if it is the value rounded to that many places (3.14 for π), and so does any value that rounds to an answer
  // the course itself wrote as such a decimal ("π; 3.1416" accepts 3.14159). Alternatives after ";" are the same
  // value written differently.
  function places(s) {
    var m = String(s).trim().replace(/^[a-z]\s*=\s*/i, "").replace(/\s+/g, "").match(/^[-+−–]?\d*[.,](\d+)$/);
    return m ? m[1].length : 0;
  }
  function inputCorrect(given, answer) {
    var g = toNum(given), dg = places(given);
    return answer.split(";").some(function (a) {
      var v = toNum(a), da = places(a);
      if (!isNaN(g) && !isNaN(v)) {
        if (!isFinite(g) || !isFinite(v)) return g === v;
        var tol = 1e-9 * Math.max(1, Math.abs(v));
        if (dg >= 2) tol = Math.max(tol, 0.5 * Math.pow(10, -dg));
        if (da >= 2) tol = Math.max(tol, 0.5 * Math.pow(10, -da));
        var d = Math.abs(g - v);
        return d <= tol * (1 + 1e-9) && (d <= 1e-9 * Math.max(1, Math.abs(v)) || d <= 0.02 * Math.abs(v));   // 0.00 is no rounding of 0.001
      }
      return given.trim().toLowerCase().replace(/\s+/g, "") === a.trim().toLowerCase().replace(/\s+/g, "");
    });
  }

  function answerTeX(it) {
    var A = window.CUSP_ANS;
    if (it.show) return it.show;
    if (it.kind === "expr") {
      var sp = A.exprSpec(it);
      try { return "$" + A.answerTeX(sp) + (sp.plusC ? " + C" : "") + "$"; } catch (e) { return escapeHtml(it.answer); }
    }
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

  // A question the student already knows from before (a review question, or one met before in the feed) can be
  // put away for a long time with "I know this"; any other one can be given up with "I don't know". Not in a
  // checkpoint or the final test, which are there to show what the student knows.
  function canSkipAsKnown(it) {
    if (!it.key || S.final || (S.node && S.node.checkpoint) || S.missed[it.key]) return false;
    return !!(S.review || it.review || (S.feed && P.srs[it.key]));
  }
  // "I know this": no answer, no feedback; the question moves to the last box of spaced repetition.
  function knowIt() {
    var it = S.queue[S.i];
    P.srs[it.key] = [5, C.dayNum() + 35];
    delete P.mistakes[it.key];
    S.questions--;            // not counted in the accuracy
    S.progress++;
    save();
    next();
  }

  // giveUp ("I don't know"): show the answer and explanation; it counts as a mistake (a life in a lesson, asked
  // again at the end, back to the first box of spaced repetition).
  function check(giveUp) {
    var it = S.queue[S.i], s = C.stringsFor(itemCourse(it)), ok, answerHtml = "", A = window.CUSP_ANS;
    secondary.hidden = true;
    if (giveUp && S.input && (it.kind === "input" || it.kind === "expr" || it.kind === "interval" || it.kind === "set")) {
      ok = false;
      S.input.readOnly = true;
      var er0 = S.input.parentNode.querySelector(".in-error"); if (er0) er0.remove();
      answerHtml = answerTeX(it);
    } else if (S.inputKind && (it.kind === "input" || it.kind === "expr" || it.kind === "interval" || it.kind === "set")) {
      var r;
      if (it.kind === "expr") r = A.checkExpr(S.input.value, S.spec);
      else if (it.kind === "interval") r = A.checkInterval(S.input.value, it.answer);
      else if (it.kind === "set") r = A.checkSet(S.input.value, it.answer);
      else r = { ok: inputCorrect(S.input.value, it.answer) };
      if (r.broken) { brokenQuestion(it, r.broken); return; }
      if (r.error) { secondary.hidden = false; inputError(r.error); return; }
      var er = S.input.parentNode.querySelector(".in-error"); if (er) er.remove();
      ok = r.ok;
      S.input.readOnly = true;
      S.input.classList.add(ok ? "right" : "wrong");
      answerHtml = answerTeX(it);
    } else if (S.match) {
      // right when every pair is together and no decoy got a partner; a wrong item shows what belongs there
      ok = true;
      Array.prototype.forEach.call(S.match.lefts.children, function (l) { l.disabled = true; });
      Array.prototype.forEach.call(S.match.rights.children, function (r) {
        r.disabled = true;
        var good = r._opt.ok ? !!r._to && r._to._opt === r._opt : !r._to;
        if (!good) ok = false;
        r.classList.add(good ? "right" : "wrong");
        if (!good) {
          var slot = r.querySelector(".m-slot");
          slot.innerHTML = '<span class="m-should">' + (r._opt.ok ? "→ " + r._opt.left : "✕") + "</span>";
          r.classList.remove("m-paired");
          typeset(slot);
        }
      });
    } else if (S.tiles) {
      var got = Array.prototype.map.call(S.tiles.ans.children, function (t) { return t._opt.html; });
      var want = it.options.filter(function (o) { return o.ok; }).map(function (o) { return o.html; });
      ok = got.length === want.length && got.every(function (h, i) { return h === want[i]; });
      if (!ok && it.kind === "build" && got.length === want.length) ok = canonBuild(got) === canonBuild(want);   // "B a A" for "A a B"
      Array.prototype.forEach.call(S.tiles.ans.children, function (t, i) { t.disabled = true; t.classList.add(ok || t._opt.html === want[i] ? "right" : "wrong"); });
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
      ok = !giveUp && S.choice._opt.ok;
      if (ok && it.kind === "tf" && S.stage !== 2 && it.answer === "false" && it.options && it.options.length) { secondary.hidden = false; counterStep(it); return; }
      Array.prototype.forEach.call(S.box.children, function (b) {
        b.disabled = true;
        if (b._opt.ok) { b.classList.add("right"); answerHtml = /^@ /.test(b._opt.html) ? "" : b._opt.html; }
        else if (b === S.choice) b.classList.add("wrong");
      });
    }
    if (giveUp) ok = false;
    S.checked = true;
    if (S.result === null) S.result = ok;

    if (ok) {
      if (!S.missed[it.key]) { S.firstTry++; delete P.mistakes[it.key]; srsRecord(it.key, true); }
      S.progress++;
    } else {
      if (!S.missed[it.key]) srsRecord(it.key, false);
      S.missed[it.key] = true;
      P.mistakes[it.key] = true;
      if (S.hearts !== null) { S.hearts--; renderHearts(true); if (!S.hearts) S.out = true; }
      if (!S.feed && !S.out) S.queue.push(it);   // a lesson asks a missed question again at the end
    }
    save();
    setBar();

    foot.dataset.state = ok ? "good" : "bad";
    fb.innerHTML = "<strong>" + (ok ? s.praise[Math.floor(Math.random() * s.praise.length)] : giveUp ? s.solution : s.notQuite) + "</strong>" +
      (ok || !answerHtml ? "" : (it.kind === "order" ? "<p>" + s.answer + "</p>" + answerHtml : "<p>" + s.answer + " " + answerHtml + "</p>")) +
      (it.explain ? "<p>" + it.explain + "</p>" : "") +
      figs(it.figA) +
      (ok || S.feed ? "" : '<p class="muted">' + (S.out ? s.lastLife : s.again) + "</p>") +
      reportLink(it);
    fb.hidden = false;
    typeset(fb);
    drawFigs(fb);
    primary.textContent = s.cont; primary.disabled = false;
    primary.focus({ preventScroll: true });
  }
  // The course's own answer can't be used (a typo in lessons.txt, a generator's bad output): not the student's
  // fault, so skip the question without touching spaced repetition, and offer to report it.
  function brokenQuestion(it, why) {
    var s = C.stringsFor(itemCourse(it));
    console.error("question " + (it.key || "?") + " can't be checked: " + why);
    secondary.hidden = true;
    S.input.readOnly = true;
    S.checked = true;
    S.progress++;
    setBar();
    foot.dataset.state = "";
    fb.innerHTML = "<p>" + escapeHtml(s.broken) + "</p>" + reportLink(it);
    fb.hidden = false;
    primary.textContent = s.cont; primary.disabled = false;
    primary.focus({ preventScroll: true });
  }

  function next() {
    if (S.out) { outOfHearts(); return; }
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
    if (S.final) P.done[C.finalId(course())] = true;
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
    if (C.backupDue()) inner.appendChild(backupNudge(s));
    body.appendChild(inner);
    foot.dataset.state = ""; fb.hidden = true; secondary.hidden = true;
    primary.textContent = s.cont; primary.disabled = false;
    S.finished = true;
  }

  // The last life is gone: the lesson isn't marked done and starts again from the beginning, with a fresh draw of
  // questions. Mistakes made so far stay recorded for spaced repetition.
  function outOfHearts() {
    var s = L();
    body.innerHTML = "";
    var inner = el("div", "lesson-inner done-screen out-screen");
    inner.appendChild(el("div", "done-mark out-mark", "♡"));
    inner.appendChild(el("h2", "q-title", escapeHtml(s.outT)));
    inner.appendChild(el("p", "in-hint", escapeHtml(C.fmt(s.out, { n: HEARTS }))));
    var row = el("div", "done-actions");
    var close = el("button", "admin-btn out-close", escapeHtml(s.close)); close.type = "button";
    close.addEventListener("click", closeLesson);
    row.appendChild(close);
    inner.appendChild(row);
    body.appendChild(inner);
    body.scrollTop = 0;
    foot.dataset.state = ""; fb.hidden = true; fb.innerHTML = ""; secondary.hidden = true;
    primary.textContent = s.restart; primary.disabled = false;
    primary.focus({ preventScroll: true });
    S.restart = true;
  }

  // Progress lives only in this browser: every few lessons, suggest a backup (core.js decides when).
  function backupNudge(s) {
    C.markBackup(false);            // shown: ask again in a few lessons, unless a backup is made now
    var box = el("div", "bk-nudge");
    box.appendChild(el("b", null, escapeHtml(s.bkNudgeT)));
    box.appendChild(el("p", null, escapeHtml(C.fmt(s.bkNudge, { n: C.doneCount() }))));
    var row = el("div", "backup-row");
    var go = el("button", "admin-btn bk-go", escapeHtml(s.bkSave)); go.type = "button";
    go.addEventListener("click", function () { C.exportProgress(); box.remove(); });
    var later = el("button", "admin-btn bk-later", escapeHtml(s.bkLater)); later.type = "button";
    later.addEventListener("click", function () { box.remove(); });
    row.appendChild(go); row.appendChild(later);
    box.appendChild(row);
    return box;
  }

  primary.addEventListener("click", function () {
    if (!S) return;
    if (S.finished) { closeLesson(); return; }
    if (S.restart) { startSession(S.opts); return; }
    var it = S.queue[S.i];
    if (it.kind !== "learn" && !S.checked) check(); else next();
  });
  secondary.addEventListener("click", function () {
    if (!S || S.finished || S.restart || S.checked) return;
    if (S.knowMode) knowIt(); else check(true);
  });

  C.startSession = startSession;
  C.instantiate = instantiate;
  C.inputCorrect = inputCorrect;
  C.canonBuild = canonBuild;
  C.closeLesson = closeLesson;
  C.debugItem = function () { return S && S.queue[S.i]; };
  C.debugStage = function () { return S ? S.stage : 0; };
  // play one question in the lesson player; onDone(true | false | null) runs when it closes
  C.answer = function (q, onDone) { startSession({ items: [q], feed: true, onDone: onDone }); };
})();
