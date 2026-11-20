/* Question generators: shared helpers and the registry.
   Each course registers its own generators in courses/<id>/generators.js:

     LEMMA_GEN.define("<course id>", function (K, G) {
       G.my_gen = function () { return K.inp(K.P("Kolik je $2+2$?"), "4", "Sečteme."); };
     });

   and uses them in lessons.txt as "? gen | my_gen". A generator returns a question object
   { kind: "mc" | "input" | "expr" | "interval" | "set", html, answer, options, explain, fig }.
   Generators are looked up per course, so two courses may use the same name. */
(function () {
  "use strict";
  // ---- helpers -------------------------------------------------------------
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function nz(a, b) { var v; do { v = ri(a, b); } while (v === 0); return v; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function fr(p, q) { q = q === undefined ? 1 : q; if (q < 0) { p = -p; q = -q; } var g = gcd(p, q); return { p: p / g, q: q / g }; }
  function fs(f) { return f.q === 1 ? String(f.p) : f.p + "/" + f.q; }            // answer string
  function ft(f) { return f.q === 1 ? String(f.p) : (f.p < 0 ? "-" : "") + "\\frac{" + Math.abs(f.p) + "}{" + f.q + "}"; } // TeX
  function dec(f) { return String(Math.round(f.p / f.q * 10000) / 10000); }
  function ans(f) { return f.q === 1 ? fs(f) : fs(f) + "; " + dec(f); }
  function P(s) { return "<p>" + s + "</p>"; }
  function par(n) { return n < 0 ? "(" + n + ")" : String(n); }
  // polynomial in TeX from [[coef, power], ...] (highest power first)
  function poly(terms, v) {
    v = v || "x";
    var s = "";
    terms.forEach(function (t) {
      var c = t[0], p = t[1];
      if (!c) return;
      var a = Math.abs(c);
      var body = p === 0 ? String(a) : (a === 1 ? "" : String(a)) + v + (p === 1 ? "" : "^{" + p + "}");
      s += s ? (c < 0 ? " - " : " + ") + body : (c < 0 ? "-" : "") + body;
    });
    return s || "0";
  }
  function lin(r) { return r === 0 ? "x" : "(" + poly([[1, 1], [-r, 0]]) + ")"; }
  function mc(html, correct, wrong, explain) {
    var seen = {}, opts = [];
    [correct].concat(wrong).forEach(function (h, i) { if (!seen[h]) { seen[h] = 1; opts.push({ html: h, ok: i === 0 }); } });
    return { kind: "mc", html: html, options: opts, explain: explain };
  }
  function inp(html, answer, explain) { return { kind: "input", html: html, answer: answer, explain: explain }; }

  function withFig(s, q) { q.fig = s; return q; }
  // ---- New answer kinds: formulas, intervals, sets -------------------------------
  function expr(html, answer, explain, flags, show) { return { kind: "expr", html: html, answer: answer, flags: flags || [], explain: explain, show: show }; }
  function ivl(html, answer, explain) { return { kind: "interval", html: html, answer: answer, explain: explain }; }
  function set(html, answer, explain) { return { kind: "set", html: html, answer: answer, explain: explain }; }
  function sgn(n) { return n < 0 ? " - " + (-n) : " + " + n; }

  var K = { P: P, ans: ans, dec: dec, expr: expr, fr: fr, fs: fs, ft: ft, gcd: gcd, inp: inp, ivl: ivl, lin: lin, mc: mc, nz: nz, par: par, pick: pick, poly: poly, ri: ri, set: set, sgn: sgn, withFig: withFig };
  var REG = {};
  window.LEMMA_GEN = {
    kit: K,
    define: function (courseId, fn) {
      try { fn(K, REG[courseId] = REG[courseId] || {}); }
      catch (e) { console.error("courses/" + courseId + "/generators.js:", e); }   // one broken course must not break the others
    },
    get: function (courseId, name) { return (REG[courseId] || {})[name] || null; },
    names: function (courseId) { return Object.keys(REG[courseId] || {}); }
  };
})();
