/* The feed: one endless scroll over every course.

   What goes in (per course, nothing to configure):
     theory     posts from courses/<id>/feed.txt (def, thm, proof, cex, hist, tip)
                and the learn cards ("> Title") of courses/<id>/lessons.txt
     exercises  the questions ("? kind") of lessons.txt and feed posts of type app / exam
   Each next post is theory with probability THEORY_SHARE. Within each group the order is a
   shuffle that is only repeated after everything has been shown. Pinned posts come first.
   Questions are answered in the lesson player (window.LEMMA.answer), which also updates the
   spaced-repetition boxes, exactly like in a lesson. */
(function () {
  "use strict";

  var THEORY_SHARE = 0.7;
  var BATCH = 6;
  var EXERCISE_POSTS = { app: true, exam: true };

  var TYPES = {
    tip:   { one: "Tip",          color: "var(--muted)" },
    def:   { one: "Definice",     color: "var(--def)" },
    thm:   { one: "Věta",         color: "var(--thm)" },
    proof: { one: "Důkaz",        color: "var(--prf)" },
    cex:   { one: "Protipříklad", color: "var(--cex)" },
    app:   { one: "Úloha",        color: "var(--app)" },
    exam:  { one: "Ze zkoušky",   color: "var(--ex)" },
    hist:  { one: "Historie",     color: "var(--hist)" }
  };
  var CARD_COLOR = "var(--def)", QUESTION_COLOR = "var(--app)";

  var IC = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.9 4.5 7.3 4.5c2 0 3.5 1.1 4.7 2.8 1.2-1.7 2.7-2.8 4.7-2.8 3.4 0 5.7 3.3 4.5 6.7-1.7 4.7-9.2 9.3-9.2 9.3Z"/></svg>',
    saved: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12v17l-6-4.2-6 4.2v-17Z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15 3l6 6-3 1-4 4 .5 4.5L13 20l-4-4-5 5-1-1 5-5-4-4 1.5-1.5L10 10l4-4 1-3Z"/></svg>'
  };

  function E() { return window.LEMMA; }
  function S() { return E().strings(); }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // ---------------------------------------------------------------- likes and saves (this browser only)
  function load(k) { try { return new Set(JSON.parse(localStorage.getItem(k) || "[]")); } catch (e) { return new Set(); } }
  function store(k, s) { try { localStorage.setItem(k, JSON.stringify(Array.from(s))); } catch (e) { /* ignore */ } }
  var LIKED = "lemma.f.liked", SAVED = "lemma.f.saved";
  var liked = load(LIKED), saved = load(SAVED);
  (function migrate() {   // the former MA I profile wall stored ids "p-<lecture>-<index>"
    var moved = false;
    [["lemma.p.liked", liked, LIKED], ["lemma.p.saved", saved, SAVED]].forEach(function (m) {
      load(m[0]).forEach(function (id) { var x = /^p-\d+-(\d+)$/.exec(id); if (x) { m[1].add("calc1:post:" + x[1]); moved = true; } });
      if (moved) { store(m[2], m[1]); try { localStorage.removeItem(m[0]); } catch (e) { /* ignore */ } }
    });
  })();

  // ---------------------------------------------------------------- the pool
  function parsePosts(c) {
    var node = $("feed-" + c.id);
    if (!node) return [];
    return node.textContent.split(/^=== /m).filter(function (b) { return b.trim(); }).map(function (block, i) {
      var lines = block.split("\n");
      var head = lines.shift().split("|").map(function (s) { return s.trim(); });
      var parts = lines.join("\n").split(/^--- /m);
      var flags = head.slice(4);
      var p = {
        idx: i, type: TYPES[head[0]] ? head[0] : "tip", lect: head[1], title: head[2] || "", cover: head[3] || "",
        pin: flags.indexOf("pin") >= 0,
        anchor: (flags.filter(function (f) { return f.charAt(0) === "#"; })[0]) || null,
        body: E().paras(parts.shift())
      };
      parts.forEach(function (x) { var nl = x.indexOf("\n"); p[x.slice(0, nl).trim()] = E().paras(x.slice(nl + 1)); });
      p.n = E().lectNums(p.lect)[0] || 0;
      return p;
    });
  }

  var pool = null;   // { all: [entry], pinned: [entry], byId: {} }
  function buildPool() {
    pool = { all: [], pinned: [], byId: {} };
    function add(e) { pool.byId[e.id] = e; if (e.pinned) pool.pinned.push(e); else pool.all.push(e); }
    E().courses().forEach(function (c) {
      parsePosts(c).forEach(function (p) {
        add({ id: c.id + ":post:" + p.idx, kind: "post", c: c, post: p, theory: !EXERCISE_POSTS[p.type], pinned: p.pin });
      });
      (c.units || []).forEach(function (u) {
        if (u.soon) return;
        u.lessons.forEach(function (l) {
          var k = 0;
          l.items.forEach(function (it) {
            if (it.kind === "learn") add({ id: l.id + ":card" + (++k), kind: "card", c: c, unit: u, lesson: l, it: it, theory: true });
            else if (it.key) add({ id: it.key, kind: "q", c: c, unit: u, lesson: l, it: it, theory: false });
          });
        });
      });
    });
  }

  // ---------------------------------------------------------------- state and decks
  var st = { filter: "all", decks: null };
  function matches(e) { return st.filter === "all" || e.c.id === st.filter; }
  function newDecks() {
    var mine = pool.all.filter(matches);
    return {
      theory: { list: E().shuffle(mine.filter(function (e) { return e.theory; })), ptr: 0 },
      exercise: { list: E().shuffle(mine.filter(function (e) { return !e.theory; })), ptr: 0 }
    };
  }
  function nextEntry() {
    var want = Math.random() < THEORY_SHARE ? "theory" : "exercise";
    var d = st.decks[want].list.length ? st.decks[want] : st.decks[want === "theory" ? "exercise" : "theory"];
    if (!d.list.length) return null;
    if (d.ptr >= d.list.length) {
      var last = d.list[d.list.length - 1];
      d.list = E().shuffle(d.list); d.ptr = 0;
      if (d.list.length > 1 && d.list[0] === last) d.list.push(d.list.shift());
      if (d === st.decks.theory) feed.appendChild(el("div", "divider", E().escapeHtml(S().fRound)));
    }
    return d.list[d.ptr++];
  }

  // ---------------------------------------------------------------- rendering
  var feed = $("feedList"), sentinel = $("feedSentinel"), chips = $("feedChips");

  function head(e, kindLabel) {
    var L = E(), c = e.c, sub;
    if (e.kind === "post") sub = c.lectures && e.post.n ? L.lectLabel(e.post.lect, true, c) + " · " + L.lectDate(e.post.n, c) : c.title;
    else sub = e.lesson.title.replace(/^Bonus:\s*/, "") + (c.lectures && e.lesson.lect ? " · " + L.lectLabel(e.lesson.lect, false, c) : "");
    return el("header", "post-head",
      '<span class="mini-av">' + L.escapeHtml(c.short) + '</span><span class="ph-t"><b>' + L.escapeHtml(c.handle) + "</b><span>" +
      L.escapeHtml(sub) + "</span></span>" + '<span class="ph-k">' + L.escapeHtml(kindLabel) + "</span>");
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

  // like · guide · save
  function actions(e, anchor) {
    var L = E(), s = S();
    var acts = el("div", "post-acts");
    var like = iconBtn("like", IC.heart, s.fLike, liked, LIKED, e.id);
    acts.appendChild(like);
    if (anchor && L.guideSection(anchor, e.c)) {
      var a = el("button", "pa-btn pa-guide", IC.book + '<span class="pa-l">' + L.escapeHtml(s.fromGuide) + "</span>");
      a.type = "button"; a.setAttribute("aria-label", s.fromGuide + ": " + L.guideSection(anchor, e.c).title);
      a.addEventListener("click", function () { L.openGuide(anchor, e.c); });
      acts.appendChild(a);
    }
    acts.appendChild(el("span", "sp"));
    acts.appendChild(iconBtn("save", IC.saved, s.fSave, saved, SAVED, e.id));
    return { node: acts, like: like };
  }

  function renderPost(e) {
    var L = E(), p = e.post, ty = TYPES[p.type];
    var card = el("article", "post");
    card.style.setProperty("--c", ty.color);
    card.appendChild(head(e, ty.one));
    var cover = el("div", "post-cover", '<div class="cover-math">$$' + p.cover + '$$</div><span class="pop" aria-hidden="true">' + IC.heart + "</span>" +
      (e.pinned ? '<span class="post-pin">' + IC.pin + "</span>" : ""));
    var acts = actions(e, p.anchor || L.guideAnchor(p.lect, e.c));
    cover.addEventListener("dblclick", function () {
      if (!liked.has(e.id)) toggle(acts.like, liked, LIKED, e.id);
      cover.classList.remove("popping"); void cover.offsetWidth; cover.classList.add("popping");
    });
    if (p.cover) card.appendChild(cover);
    card.appendChild(acts.node);

    var cap = el("div", "post-cap");
    cap.appendChild(el("h3", "post-title", L.escapeHtml(p.title)));
    cap.appendChild(el("div", "post-body", p.body));
    var reveals = el("div", "post-reveals");
    [["hint", "Nápověda"], ["proof", "Důkaz"], ["solution", "Řešení"]].forEach(function (r) {
      if (!p[r[0]]) return;
      var block = el("div", "post-reveal", '<span class="rv-k">' + r[1] + "</span>" + p[r[0]] + (r[0] === "proof" ? '<span class="qed">∎</span>' : ""));
      block.hidden = true;
      var b = el("button", "act", r[1]);
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { block.hidden = !block.hidden; b.setAttribute("aria-pressed", String(!block.hidden)); });
      reveals.appendChild(b);
      cap.appendChild(block);
    });
    if (reveals.children.length) cap.insertBefore(reveals, cap.children[2] || null);
    cap.appendChild(el("div", "post-tags", (p.n ? "#P" + p.n + " " : "") + "#" + ty.one.toLowerCase().replace(/\s+/g, "")));
    card.appendChild(cap);
    return card;
  }

  function renderCard(e) {
    var L = E(), it = e.it;
    var card = el("article", "post post-learn");
    card.style.setProperty("--c", CARD_COLOR);
    card.appendChild(head(e, S().fNew));
    var cap = el("div", "post-cap");
    cap.appendChild(el("h3", "post-title", L.escapeHtml(it.title)));
    cap.appendChild(el("div", "post-body learn-text", it.html + L.figs(it.figQ)));
    card.appendChild(cap);
    card.appendChild(actions(e, e.c.lectures ? L.guideAnchor(it.lect, e.c) : null).node);
    return card;
  }

  function renderQuestion(e) {
    var L = E(), s = S();
    var q = L.instantiate(e.it);           // generated questions get fresh numbers
    if (!q) return null;
    var card = el("article", "post post-q");
    card.style.setProperty("--c", QUESTION_COLOR);
    card.appendChild(head(e, s.fQuestion));
    var cap = el("div", "post-cap");
    cap.appendChild(el("div", "q-label", L.escapeHtml(s[q.kind] || "")));
    var prompt = el("div", "post-body q-prompt", q.html.replace(/^<p>True or false:\s*/i, "<p>") + L.figs(q.figQ));
    cap.appendChild(prompt);
    var row = el("div", "fq-row");
    var go = el("button", "fq-btn", L.escapeHtml(s.fSolve));
    go.type = "button";
    var res = el("span", "fq-res");
    res.hidden = true;
    function play() {
      L.answer(q, function (ok) {
        if (ok === null) return;           // closed without answering
        res.hidden = false;
        res.className = "fq-res " + (ok ? "good" : "bad");
        res.textContent = ok ? "✓ " + s.fSolved : s.fMissed;
        go.textContent = s.fAgain;
      });
    }
    go.addEventListener("click", play);
    prompt.addEventListener("click", function (ev) { if (!ev.target.closest("a, button")) play(); });
    row.appendChild(go); row.appendChild(res);
    cap.appendChild(row);
    card.appendChild(cap);
    card.appendChild(actions(e, null).node);
    return card;
  }

  function render(e) {
    var node = e.kind === "post" ? renderPost(e) : e.kind === "card" ? renderCard(e) : renderQuestion(e);
    if (!node) return null;
    node.dataset.id = e.id;
    feed.appendChild(node);
    E().typeset(node);
    E().drawFigs(node);
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
    var L = E(), s = S();
    chips.innerHTML = "";
    var opts = [["all", s.fAll]];
    var withContent = L.courses().filter(function (c) { return pool.all.concat(pool.pinned).some(function (e) { return e.c === c; }); });
    if (withContent.length > 1) withContent.forEach(function (c) { opts.push([c.id, c.short]); });
    opts.push(["saved", s.fSaved]);
    opts.forEach(function (o) {
      var b = el("button", "chip", L.escapeHtml(o[1]));
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
    if (!visible()) return;
    var guard = 0;
    while (guard++ < 10 && sentinel.getBoundingClientRect().top < window.innerHeight + 900) {
      if (!loadMore(BATCH)) break;
    }
  }

  function reset() {
    if (!pool) buildPool();
    feed.innerHTML = "";
    st.decks = null;
    window.scrollTo(0, 0);
    var s = S();
    if (st.filter === "saved") {
      var list = Array.from(saved).map(function (id) { return pool.byId[id]; }).filter(Boolean).reverse();
      if (!list.length) feed.appendChild(el("p", "empty", E().escapeHtml(s.fSavedEmpty)));
      list.forEach(render);
      return;
    }
    pool.pinned.filter(matches).forEach(render);
    st.decks = newDecks();
    if (!st.decks.theory.list.length && !st.decks.exercise.list.length && !feed.children.length) {
      feed.appendChild(el("p", "empty", E().escapeHtml(s.fEmpty)));
      return;
    }
    fill();
  }

  $("feedShuffle").addEventListener("click", reset);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) { if (entries[0].isIntersecting) fill(); }, { rootMargin: "900px 0px" }).observe(sentinel);
  }
  window.addEventListener("scroll", function () { if (sentinel.getBoundingClientRect().top < window.innerHeight + 400) fill(); }, { passive: true });
  window.addEventListener("resize", function () { if (visible()) fitCovers(feed); });

  window.LemmaFeed = {
    show: function () {
      if (!pool) buildPool();
      renderChips();
      if (!feed.children.length) reset();
    },
    fill: fill,
    // rebuild (e.g. after admin mode changes which courses are visible)
    reset: function () {
      pool = null; feed.innerHTML = ""; st.decks = null;
      if (st.filter !== "all" && st.filter !== "saved" && !E().courses().some(function (c) { return c.id === st.filter; })) st.filter = "all";
      if (visible()) { buildPool(); renderChips(); reset(); }
    }
  };
})();
