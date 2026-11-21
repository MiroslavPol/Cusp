/* The feed: one endless scroll over every course.

   What goes in (per course, nothing to configure):
     theory     posts from courses/<id>/feed.txt (def, thm, proof, cex, hist, tip)
                and the learn cards ("> Title") of courses/<id>/lessons.txt
     exercises  the questions ("? kind") of lessons.txt and feed posts of type app / exam
   Each next post is theory with probability THEORY_SHARE. Within that, FOCUS of the picks come from what
   matters now: theory of the recent lectures (or the lessons you have reached), and questions that are due
   for review or that you got wrong. Every group is a shuffle that only repeats after everything was shown.
   Multiple choice, true/false and "select all" questions are answered right in the post; the other kinds
   open in the lesson player. Both update spaced repetition. */
(function () {
  "use strict";
  var C = window.CUSP;

  var THEORY_SHARE = 0.7, FOCUS = 0.5, RECENT_LECTURES = 3, BATCH = 6;
  var EXERCISE_POSTS = { app: true, exam: true };
  var TYPE_COLOR = { tip: "var(--muted)", def: "var(--def)", thm: "var(--thm)", proof: "var(--prf)", cex: "var(--cex)", app: "var(--app)", exam: "var(--ex)", hist: "var(--hist)" };
  var CARD_COLOR = "var(--def)", QUESTION_COLOR = "var(--app)";
  var INLINE = { mc: true, multi: true, tf: true };

  var IC = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.9 4.5 7.3 4.5c2 0 3.5 1.1 4.7 2.8 1.2-1.7 2.7-2.8 4.7-2.8 3.4 0 5.7 3.3 4.5 6.7-1.7 4.7-9.2 9.3-9.2 9.3Z"/></svg>',
    saved: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12v17l-6-4.2-6 4.2v-17Z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15 3l6 6-3 1-4 4 .5 4.5L13 20l-4-4-5 5-1-1 5-5-4-4 1.5-1.5L10 10l4-4 1-3Z"/></svg>'
  };
  var $ = C.$, el = C.el, esc = C.escapeHtml;

  // ---------------------------------------------------------------- likes and saves (this browser only)
  function load(k) { try { return new Set(JSON.parse(localStorage.getItem(k) || "[]")); } catch (e) { return new Set(); } }
  function store(k, s) { try { localStorage.setItem(k, JSON.stringify(Array.from(s))); } catch (e) { /* ignore */ } }
  var LIKED = "cusp.f.liked", SAVED = "cusp.f.saved";
  var liked = load(LIKED), saved = load(SAVED);
  // ids that changed (positions → stable ids, and the former MA I profile wall) are mapped by the courses' legacy-ids.json
  function migrateSets() {
    [[liked, LIKED, "cusp.p.liked"], [saved, SAVED, "cusp.p.saved"]].forEach(function (m) {
      var set = m[0], changed = false;
      load(m[2]).forEach(function (id) { set.add(id); changed = true; });
      Array.from(set).forEach(function (id) { var n = C.newId(id); if (n) { set.delete(id); set.add(n); changed = true; } });
      if (changed) { store(m[1], set); try { localStorage.removeItem(m[2]); } catch (e) { /* ignore */ } }
    });
  }

  // ---------------------------------------------------------------- the pool
  function parsePosts(c) {
    if (!c.feedText) return [];
    return c.feedText.split(/^=== /m).filter(function (b) { return b.trim(); }).map(function (block, i) {
      var lines = block.split("\n");
      var head = lines.shift().split("|").map(function (s) { return s.trim(); });
      var parts = lines.join("\n").split(/^--- /m);
      var flags = head.slice(4);
      var p = {
        idx: i, type: TYPE_COLOR[head[0]] ? head[0] : "tip", lect: head[1], title: head[2] || "", cover: head[3] || "",
        pin: flags.indexOf("pin") >= 0,
        anchor: (flags.filter(function (f) { return f.charAt(0) === "#"; })[0]) || null,
        body: C.paras(parts.shift())
      };
      parts.forEach(function (x) { var nl = x.indexOf("\n"); p[x.slice(0, nl).trim()] = C.paras(x.slice(nl + 1)); });
      p.n = C.lectNums(p.lect)[0] || 0;
      return p;
    });
  }

  // which lessons count as "now": the recent lectures, or (without a schedule) the lessons done and the next one
  function nearTest(c) {
    if (c.lectures) {
      var now = C.currentLecture(c);
      return function (lect) { var n = C.lectNums(lect)[0] || 0; return n && n <= now && n > now - RECENT_LECTURES; };
    }
    var reached = {}, next = true;
    c.units.forEach(function (u) { u.lessons.forEach(function (l) {
      if (C.P.done[l.id]) reached[l.id] = true; else if (next && !l.bonus) { reached[l.id] = true; next = false; }
    }); });
    return function (lect, lesson) { return !!(lesson && reached[lesson.id]); };
  }

  var pool = null;   // { all: [entry], pinned: [entry], byId: {} }
  function buildPool() {
    pool = { all: [], pinned: [], byId: {} };
    function add(e) { pool.byId[e.id] = e; if (e.pinned) pool.pinned.push(e); else pool.all.push(e); }
    C.visibleCourses().forEach(function (c) {
      if (!c.units) return;
      var near = nearTest(c);
      parsePosts(c).forEach(function (p) {
        add({ id: c.id + ":post:" + C.slug(p.title || String(p.idx)), kind: "post", c: c, post: p, theory: !EXERCISE_POSTS[p.type], pinned: p.pin, near: near(p.lect, null) });
      });
      c.units.forEach(function (u) {
        if (u.soon) return;
        u.lessons.forEach(function (l) {
          var isNear = near(l.lect, l);
          l.items.forEach(function (it) {
            if (it.kind === "learn") add({ id: it.cardId, kind: "card", c: c, unit: u, lesson: l, it: it, theory: true, near: isNear });
            else if (it.key) add({ id: it.key, kind: "q", c: c, unit: u, lesson: l, it: it, theory: false });
          });
        });
      });
    });
    migrateSets();
  }

  // ---------------------------------------------------------------- state and decks
  var st = { filter: "all", decks: null };
  function matches(e) { return st.filter === "all" || e.c.id === st.filter; }
  function deck(list) { return { list: C.shuffle(list), ptr: 0 }; }
  function newDecks() {
    var mine = pool.all.filter(matches), today = C.dayNum(), P = C.P;
    function focus(e) { return !e.theory && e.kind === "q" && (P.mistakes[e.id] || (P.srs[e.id] && P.srs[e.id][1] <= today)); }
    return {
      theoryNear: deck(mine.filter(function (e) { return e.theory && e.near; })),
      theoryRest: deck(mine.filter(function (e) { return e.theory && !e.near; })),
      exFocus: deck(mine.filter(focus)),
      exRest: deck(mine.filter(function (e) { return !e.theory && !focus(e); }))
    };
  }
  function draw(d) {
    if (!d.list.length) return null;
    if (d.ptr >= d.list.length) {
      var last = d.list[d.list.length - 1];
      d.list = C.shuffle(d.list); d.ptr = 0;
      if (d.list.length > 1 && d.list[0] === last) d.list.push(d.list.shift());
    }
    return d.list[d.ptr++];
  }
  function nextEntry() {
    var D = st.decks, theory = Math.random() < THEORY_SHARE, f = Math.random() < FOCUS;
    var order = theory ? (f ? ["theoryNear", "theoryRest"] : ["theoryRest", "theoryNear"]) : (f ? ["exFocus", "exRest"] : ["exRest", "exFocus"]);
    order = order.concat(theory ? ["exRest", "exFocus"] : ["theoryRest", "theoryNear"]);
    for (var i = 0; i < order.length; i++) { var e = draw(D[order[i]]); if (e) return e; }
    return null;
  }

  // ---------------------------------------------------------------- rendering
  var feed = $("feedList"), sentinel = $("feedSentinel"), chips = $("feedChips");

  function head(e, kindLabel) {
    var c = e.c, sub;
    if (e.kind === "post") sub = c.lectures && e.post.n ? C.lectLabel(e.post.lect, true, c) + " · " + C.lectDate(e.post.n, c) : c.title;
    else sub = e.lesson.title.replace(/^Bonus:\s*/, "") + (c.lectures && e.lesson.lect ? " · " + C.lectLabel(e.lesson.lect, false, c) : "");
    return el("header", "post-head",
      '<span class="mini-av">' + esc(c.short) + '</span><span class="ph-t"><b>' + esc(c.handle) + "</b><span>" +
      esc(sub) + "</span></span>" + '<span class="ph-k">' + esc(kindLabel) + "</span>");
  }
  function iconBtn(cls, svg, label, set, key, id) {
    var b = el("button", "pa-btn " + cls, svg);
    b.type = "button";
    b.setAttribute("aria-label", label);
    b.setAttribute("aria-pressed", String(set.has(id)));
    b.addEventListener("click", function () { toggle(b, set, key, id); });
    return b;
  }
  function toggle(b, set, key, id) {
    var on = !set.has(id);
    if (on) set.add(id); else set.delete(id);
    store(key, set);
    b.setAttribute("aria-pressed", String(on));
  }
  // what a report names: the post, or the lesson item (for a generated question, the instance on screen)
  function reportInfo(e, q) {
    if (e.kind === "post") return { id: e.id, where: e.post.title, text: e.post.title + "\n" + C.plain(e.post.body) };
    return C.reportItem(q || e.it);
  }
  // like · guide · report · save
  function actions(e, anchor, q) {
    var s = C.stringsFor(e.c);
    var acts = el("div", "post-acts");
    var like = iconBtn("like", IC.heart, s.fLike, liked, LIKED, e.id);
    acts.appendChild(like);
    var sec = anchor && C.guideSection(anchor, e.c);
    if (sec) {
      var a = el("button", "pa-btn pa-guide", IC.book + '<span class="pa-l">' + esc(s.fromGuide) + "</span>");
      a.type = "button"; a.setAttribute("aria-label", s.fromGuide + ": " + sec.title);
      a.addEventListener("click", function () { C.openGuide(anchor, e.c); });
      acts.appendChild(a);
    }
    acts.appendChild(el("span", "sp"));
    var rp = el("a", "pa-btn pa-report", IC.flag);
    rp.href = C.reportUrl(e.c, reportInfo(e, q)); rp.target = "_blank"; rp.rel = "noopener";
    rp.setAttribute("aria-label", s.report); rp.title = s.report;
    acts.appendChild(rp);
    acts.appendChild(iconBtn("save", IC.saved, s.fSave, saved, SAVED, e.id));
    return { node: acts, like: like };
  }

  function renderPost(e) {
    var p = e.post, s = C.stringsFor(e.c), label = s.types[p.type];
    var card = el("article", "post");
    card.style.setProperty("--c", TYPE_COLOR[p.type]);
    card.appendChild(head(e, label));
    var cover = el("div", "post-cover", '<div class="cover-math">$$' + p.cover + '$$</div><span class="pop" aria-hidden="true">' + IC.heart + "</span>" +
      (e.pinned ? '<span class="post-pin">' + IC.pin + "</span>" : ""));
    var acts = actions(e, p.anchor || C.guideAnchor(p.lect, e.c));
    cover.addEventListener("dblclick", function () {
      if (!liked.has(e.id)) toggle(acts.like, liked, LIKED, e.id);
      cover.classList.remove("popping"); void cover.offsetWidth; cover.classList.add("popping");
    });
    if (p.cover) card.appendChild(cover);
    card.appendChild(acts.node);

    var cap = el("div", "post-cap");
    cap.appendChild(el("h3", "post-title", esc(p.title)));
    cap.appendChild(el("div", "post-body", p.body));
    var reveals = el("div", "post-reveals");
    [["hint", s.rvHint], ["proof", s.rvProof], ["solution", s.rvSolution]].forEach(function (r) {
      if (!p[r[0]]) return;
      var block = el("div", "post-reveal", '<span class="rv-k">' + esc(r[1]) + "</span>" + p[r[0]] + (r[0] === "proof" ? '<span class="qed">∎</span>' : ""));
      block.hidden = true;
      var b = el("button", "act", esc(r[1]));
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { block.hidden = !block.hidden; b.setAttribute("aria-pressed", String(!block.hidden)); });
      reveals.appendChild(b);
      cap.appendChild(block);
    });
    if (reveals.children.length) cap.insertBefore(reveals, cap.children[2] || null);
    cap.appendChild(el("div", "post-tags", (p.n ? "#P" + p.n + " " : "") + "#" + esc(label.toLowerCase().replace(/\s+/g, ""))));
    card.appendChild(cap);
    return card;
  }

  function renderCard(e) {
    var it = e.it, s = C.stringsFor(e.c);
    var card = el("article", "post post-learn");
    card.style.setProperty("--c", CARD_COLOR);
    card.appendChild(head(e, s.fNew));
    var cap = el("div", "post-cap");
    cap.appendChild(el("h3", "post-title", esc(it.title)));
    cap.appendChild(el("div", "post-body learn-text", it.html + C.figs(it.figQ)));
    card.appendChild(cap);
    card.appendChild(actions(e, e.c.lectures ? C.guideAnchor(it.lect, e.c) : null).node);
    return card;
  }

  // ---- questions: mc / tf / multi right here, everything else in the lesson player
  function optionButtons(opts, multi, onPick) {
    var isFig = opts.some(function (o) { return /^@ /.test(o.html); });
    var box = el("div", "options fq-options" + (opts.length === 2 ? " two" : "") + (isFig ? " figs" : ""));
    box.setAttribute("role", multi ? "group" : "radiogroup");
    opts.forEach(function (o) {
      var b = el("button", "opt" + (multi ? " check" : "") + (isFig ? " fig-opt" : ""), /^@ /.test(o.html) ? C.figs([o.html.slice(2)]) : o.html);
      b.type = "button"; b._opt = o;
      b.setAttribute("role", multi ? "checkbox" : "radio");
      b.setAttribute("aria-checked", "false");
      b.addEventListener("click", function () { if (!box.dataset.done) onPick(b); });
      box.appendChild(b);
    });
    return box;
  }
  function reveal(box, picked) {      // mark the right options, and a wrong pick
    box.dataset.done = "1";
    var right = [];
    Array.prototype.forEach.call(box.children, function (b) {
      b.disabled = true;
      if (b._opt.ok) { b.classList.add("right"); if (!/^@ /.test(b._opt.html)) right.push(b._opt.html); }
      else if (picked.indexOf(b) >= 0) b.classList.add("wrong");
    });
    return right;
  }
  function inlineQuestion(e, q, cap, done) {
    var s = C.stringsFor(e.c), first = true;
    function feedback(ok, answerHtml) {
      var f = el("div", "fq-fb " + (ok ? "good" : "bad"),
        "<strong>" + esc(ok ? s.fRight : s.fWrong) + "</strong>" +
        (!ok && answerHtml ? " <span>" + esc(s.fAnswerIs) + " " + answerHtml + "</span>" : "") +
        (q.explain ? "<p>" + q.explain + "</p>" : "") + C.figs(q.figA));
      cap.appendChild(f);
      C.typeset(f); C.drawFigs(f);
      if (first) { C.record(q.key, ok); first = false; done(ok); }
    }
    if (q.kind === "multi") {
      var box = optionButtons(C.shuffle(q.options), true, function (b) {
        b.setAttribute("aria-checked", String(b.getAttribute("aria-checked") !== "true"));
        go.disabled = !box.querySelector('[aria-checked="true"]');
      });
      var go = el("button", "fq-btn", esc(s.fCheck)); go.type = "button"; go.disabled = true;
      go.addEventListener("click", function () {
        var picked = Array.prototype.filter.call(box.children, function (b) { return b.getAttribute("aria-checked") === "true"; });
        var ok = Array.prototype.every.call(box.children, function (b) { return (picked.indexOf(b) >= 0) === b._opt.ok; });
        var right = reveal(box, picked); go.remove();
        feedback(ok, right.join(", "));
      });
      cap.appendChild(box); cap.appendChild(go);
      return;
    }
    var opts = q.kind === "tf" ? [{ html: esc(s.tTrue), ok: q.answer === "true" }, { html: esc(s.tFalse), ok: q.answer === "false" }] : C.shuffle(q.options);
    var box1 = optionButtons(opts, false, function (b) {
      b.setAttribute("aria-checked", "true");
      var ok = b._opt.ok, right = reveal(box1, [b]);
      if (ok && q.kind === "tf" && q.answer === "false" && q.options && q.options.length) {   // second step: which example disproves it?
        var lab = el("div", "q-label counter", esc(s.counter));
        var box2 = optionButtons(C.shuffle(q.options), false, function (b2) {
          b2.setAttribute("aria-checked", "true");
          var r2 = reveal(box2, [b2]);
          feedback(b2._opt.ok, r2.join(", "));
        });
        cap.appendChild(lab); cap.appendChild(box2);
        C.typeset(box2); C.drawFigs(box2);
        return;
      }
      feedback(ok, right.join(", "));
    });
    cap.appendChild(box1);
  }

  function renderQuestion(e) {
    var q = C.instantiate(e.it);           // generated questions get fresh numbers
    if (!q) return null;
    var s = C.stringsFor(e.c);
    var card = el("article", "post post-q");
    card.style.setProperty("--c", QUESTION_COLOR);
    card.appendChild(head(e, s.fQuestion));
    var cap = el("div", "post-cap");
    cap.appendChild(el("div", "q-label", esc(s[q.kind] || "")));
    var prompt = el("div", "post-body q-prompt", q.html.replace(/^<p>True or false:\s*/i, "<p>") + C.figs(q.figQ));
    cap.appendChild(prompt);
    var res = el("span", "fq-res"); res.hidden = true;
    function mark(ok) {
      if (ok === null) return;           // closed without answering
      res.hidden = false;
      res.className = "fq-res " + (ok ? "good" : "bad");
      res.textContent = ok ? "✓ " + s.fSolved : s.fMissed;
    }
    if (INLINE[q.kind]) {
      inlineQuestion(e, q, cap, mark);
    } else {
      var row = el("div", "fq-row");
      var go = el("button", "fq-btn", esc(s.fSolve)); go.type = "button";
      var play = function () { C.answer(q, function (ok) { mark(ok); if (ok !== null) go.textContent = s.fAgain; }); };
      go.addEventListener("click", play);
      prompt.classList.add("tappable");
      prompt.addEventListener("click", function (ev) { if (!ev.target.closest("a, button")) play(); });
      row.appendChild(go); row.appendChild(res);
      cap.appendChild(row);
    }
    card.appendChild(cap);
    card.appendChild(actions(e, null, q).node);
    return card;
  }

  function render(e) {
    var node = e.kind === "post" ? renderPost(e) : e.kind === "card" ? renderCard(e) : renderQuestion(e);
    if (!node) return null;
    node.dataset.id = e.id;
    feed.appendChild(node);
    C.typeset(node);
    C.drawFigs(node);
    fitCovers(node);
    return node;
  }
  function fitCovers(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll(".cover-math"), function (m) {
      m.style.transform = "";
      var box = m.parentNode, w = m.scrollWidth, h = m.scrollHeight;
      var bw = box.clientWidth * 0.86, bh = box.clientHeight * 0.62;
      var k = Math.min(1, bw / Math.max(w, 1), bh / Math.max(h, 1));
      if (k < 1) m.style.transform = "scale(" + k.toFixed(3) + ")";
    });
  }

  // ---------------------------------------------------------------- chips, paging
  function renderChips() {
    var s = C.L();
    chips.innerHTML = "";
    chips.setAttribute("aria-label", s.filter);
    var opts = [["all", s.fAll]];
    var withContent = C.visibleCourses().filter(function (c) { return pool.all.concat(pool.pinned).some(function (e) { return e.c === c; }); });
    if (withContent.length > 1) withContent.forEach(function (c) { opts.push([c.id, c.short]); });
    opts.push(["saved", s.fSaved]);
    opts.forEach(function (o) {
      var b = el("button", "chip", esc(o[1]));
      b.type = "button";
      b.setAttribute("aria-pressed", String(st.filter === o[0]));
      b.addEventListener("click", function () { st.filter = o[0]; renderChips(); reset(); });
      chips.appendChild(b);
    });
    $("feedShuffleLabel").textContent = s.fShuffle;
  }

  function visible() { return !$("view-feed").hidden; }
  function loadMore(n) {
    if (!st.decks) return false;
    for (var i = 0; i < n; i++) {
      var e = nextEntry();
      if (!e) return false;
      render(e);
    }
    return true;
  }
  function fill() {
    if (!visible() || !pool) return;
    var guard = 0;
    while (guard++ < 10 && sentinel.getBoundingClientRect().top < window.innerHeight + 900) {
      if (!loadMore(BATCH)) break;
    }
  }
  function reset() {
    if (!pool) return;
    feed.innerHTML = "";
    st.decks = null;
    window.scrollTo(0, 0);
    var s = C.L();
    if (st.filter === "saved") {
      var list = Array.from(saved).map(function (id) { return pool.byId[id]; }).filter(Boolean).reverse();
      if (!list.length) feed.appendChild(el("p", "empty", esc(s.fSavedEmpty)));
      list.forEach(render);
      return;
    }
    pool.pinned.filter(matches).forEach(render);
    st.decks = newDecks();
    var D = st.decks;
    if (!D.theoryNear.list.length && !D.theoryRest.list.length && !D.exFocus.list.length && !D.exRest.list.length && !feed.children.length) {
      feed.appendChild(el("p", "empty", esc(s.fEmpty)));
      return;
    }
    fill();
  }

  // the feed needs every course's data: load them all the first time it is shown
  var loading = null;
  function ensurePool() {
    if (pool) return Promise.resolve();
    if (!loading) {
      feed.innerHTML = '<p class="empty">' + esc(C.L().loading) + "</p>";
      loading = C.loadAll(C.visibleCourses()).then(function () { buildPool(); loading = null; });
    }
    return loading;
  }

  $("feedShuffle").addEventListener("click", reset);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) { if (entries[0].isIntersecting) fill(); }, { rootMargin: "900px 0px" }).observe(sentinel);
  }
  window.addEventListener("scroll", function () { if (sentinel.getBoundingClientRect().top < window.innerHeight + 400) fill(); }, { passive: true });
  window.addEventListener("resize", function () { if (visible()) fitCovers(feed); });

  function rebuild() {     // e.g. admin mode changes which courses are visible
    pool = null; feed.innerHTML = ""; st.decks = null;
    if (st.filter !== "all" && st.filter !== "saved" && !C.visibleCourses().some(function (c) { return c.id === st.filter; })) st.filter = "all";
    if (visible()) window.CUSP_FEED.show();
  }
  C.on("admin", rebuild);
  C.on("progress", function () { liked = load(LIKED); saved = load(SAVED); });

  window.CUSP_FEED = {
    show: function () {
      ensurePool().then(function () {
        renderChips();
        if (!feed.querySelector(".post")) reset();
      });
    },
    fill: fill,
    reset: rebuild
  };
})();
