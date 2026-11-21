/* Answers that are formulas, intervals or sets.
   - parse(text, vars): safe recursive-descent parser for what students type on a phone
     ("2x cos(x^2)", "sin^2 x", "e^-x", "√(1-x²)", "1/(1+x^2)", "|x|", "ln x + 1") → AST
   - evaluate an AST, print it as TeX (live preview), compare two formulas by sampling
   - intervals "(−∞; −2) ∪ [2; ∞)" or Czech "⟨0; 1)", and finite sets "{−2; 2}", "±2"
   No eval of user text: the AST is walked by hand. */
(function () {
  "use strict";
  var FUN = {
    sin: Math.sin, cos: Math.cos, tg: Math.tan, tan: Math.tan,
    cotg: function (x) { return 1 / Math.tan(x); }, cot: function (x) { return 1 / Math.tan(x); },
    arcsin: Math.asin, arccos: Math.acos, arctg: Math.atan, arctan: Math.atan,
    arccotg: function (x) { return Math.PI / 2 - Math.atan(x); },
    sinh: Math.sinh, cosh: Math.cosh, tgh: Math.tanh, tanh: Math.tanh,
    ln: Math.log, log: function (x) { return Math.log(x) / Math.LN10; }, exp: Math.exp,
    sqrt: Math.sqrt, abs: Math.abs, sgn: Math.sign, cbrt: Math.cbrt,
    asin: Math.asin, acos: Math.acos, atan: Math.atan
  };
  var TEXF = {
    sin: "\\sin", cos: "\\cos", tg: "\\operatorname{tg}", tan: "\\operatorname{tg}", cotg: "\\operatorname{cotg}", cot: "\\operatorname{cotg}",
    asin: "\\arcsin", acos: "\\arccos", atan: "\\operatorname{arctg}",
    arcsin: "\\arcsin", arccos: "\\arccos", arctg: "\\operatorname{arctg}", arctan: "\\operatorname{arctg}", arccotg: "\\operatorname{arccotg}",
    sinh: "\\sinh", cosh: "\\cosh", tgh: "\\operatorname{tgh}", tanh: "\\operatorname{tgh}", ln: "\\ln", log: "\\log", exp: "\\exp", sgn: "\\operatorname{sgn}"
  };
  var NAMES = Object.keys(FUN).concat(["pi"]).sort(function (a, b) { return b.length - a.length; });
  var SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };

  // Messages for the student come from the open course's interface texts (app/js/strings.js, "ans"), so they
  // follow its language; {x} is the offending character or name.
  function fail(code, x) {
    var C = window.CUSP, t = C && C.L ? C.L().ans : null;
    throw new Error(String((t && t[code]) || code).replace("{x}", x == null ? "" : x));
  }

  function normalize(s) {
    return String(s).toLowerCase()
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, function (m) { return "^(" + m.split("").map(function (c) { return SUP[c]; }).join("") + ")"; })
      .replace(/½/g, "(1/2)").replace(/⅓/g, "(1/3)").replace(/¼/g, "(1/4)").replace(/¾/g, "(3/4)")
      .replace(/[−–—]/g, "-").replace(/[·×⋅∙]/g, "*").replace(/[:÷]/g, "/")
      .replace(/π/g, "pi").replace(/√/g, "sqrt").replace(/,/g, ".")
      .replace(/\*\*/g, "^");
  }

  // ---- tokenizer: numbers, operators, names split greedily into functions / constants / variables
  function tokenize(s, vars) {
    var t = [], i = 0, m;
    while (i < s.length) {
      var c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if ((m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i)))) { t.push({ k: "num", v: parseFloat(m[1]) }); i += m[1].length; continue; }
      if ("+-*/^()|".indexOf(c) >= 0) { t.push({ k: c }); i++; continue; }
      if (/[a-z]/.test(c)) {
        var word = /^[a-z]+/.exec(s.slice(i))[0], j = 0;
        while (j < word.length) {
          var rest = word.slice(j), hit = null;
          for (var n = 0; n < NAMES.length; n++) if (rest.indexOf(NAMES[n]) === 0) { hit = NAMES[n]; break; }
          if (hit) { t.push(hit === "pi" ? { k: "const", v: "pi" } : { k: "fn", v: hit }); j += hit.length; continue; }
          var ch = rest[0];
          if (ch === "e") t.push({ k: "const", v: "e" });
          else if (vars.indexOf(ch) >= 0) t.push({ k: "var", v: ch });
          else fail("letter", ch);
          j++;
        }
        i += word.length; continue;
      }
      fail("char", c);
    }
    return t;
  }

  function parse(text, vars) {
    vars = vars || ["x"];
    var src = normalize(text).trim();
    if (!src) fail("empty");
    var t = tokenize(src, vars), p = 0, absDepth = 0;
    function peek() { return t[p]; }
    function eat(k) { if (t[p] && t[p].k === k) return t[p++]; return null; }
    function startsOperand(tok) {
      if (!tok) return false;
      if (tok.k === "num" || tok.k === "var" || tok.k === "const" || tok.k === "fn" || tok.k === "(") return true;
      return tok.k === "|" && absDepth === 0;   // an opening bar only when we are not inside |…|
    }
    function expr() {
      var a = term();
      while (peek() && (peek().k === "+" || peek().k === "-")) { var op = t[p++].k; a = { t: op, a: a, b: term() }; }
      return a;
    }
    function term(stopAtFn) {
      var a = unary();
      for (;;) {
        var tok = peek();
        if (tok && (tok.k === "*" || tok.k === "/") && !stopAtFn) { p++; a = { t: tok.k, a: a, b: unary() }; continue; }
        if (startsOperand(tok) && !(stopAtFn && tok.k === "fn")) { a = { t: "*", a: a, b: unary(), imp: true }; continue; }
        return a;
      }
    }
    function unary() {
      if (eat("-")) return { t: "neg", a: unary() };
      if (eat("+")) return unary();
      return power();
    }
    function power() {
      var base = primary();
      if (eat("^")) return { t: "^", a: base, b: unary() };
      return base;
    }
    function primary() {
      var tok = t[p++];
      if (!tok) fail("end");
      if (tok.k === "num") return { t: "num", v: tok.v };
      if (tok.k === "var") return { t: "var", v: tok.v };
      if (tok.k === "const") return { t: "const", v: tok.v };
      if (tok.k === "(") { var e = expr(); if (!eat(")")) fail("paren"); return { t: "par", a: e }; }
      if (tok.k === "|") { absDepth++; var a = expr(); absDepth--; if (!eat("|")) fail("bar"); return { t: "fn", f: "abs", a: a }; }
      if (tok.k === "fn") {
        var pw = null;
        if (eat("^")) pw = unary();                    // sin^2 x
        var arg;
        if (peek() && peek().k === "(") { p++; arg = expr(); if (!eat(")")) fail("paren"); }
        else {                                         // sin 2x, ln x: the juxtaposed factors that follow (sin x/x = (sin x)/x)
          if (!startsOperand(peek())) fail("fnArg", tok.v);
          arg = term(true);
        }
        var node = { t: "fn", f: tok.v, a: arg };
        return pw ? { t: "^", a: node, b: pw, fnpow: true } : node;
      }
      fail("unexpected", tok.k);
    }
    var tree = expr();
    if (p < t.length) fail("unexpected", t[p].k === "num" ? t[p].v : t[p].v || t[p].k);
    return tree;
  }

  function evaluate(n, env) {
    switch (n.t) {
      case "num": return n.v;
      case "var": return env[n.v];
      case "const": return n.v === "pi" ? Math.PI : Math.E;
      case "par": return evaluate(n.a, env);
      case "neg": return -evaluate(n.a, env);
      case "+": return evaluate(n.a, env) + evaluate(n.b, env);
      case "-": return evaluate(n.a, env) - evaluate(n.b, env);
      case "*": return evaluate(n.a, env) * evaluate(n.b, env);
      case "/": return evaluate(n.a, env) / evaluate(n.b, env);
      case "^": {
        var b = evaluate(n.a, env), e = evaluate(n.b, env);
        if (b < 0 && Math.round(e) !== e) {            // real odd roots: (-8)^(1/3) = -2, (-8)^(2/3) = 4
          for (var d = 3; d <= 7; d += 2) {
            var q = Math.round(e * d);
            if (Math.abs(e * d - q) < 1e-9) return Math.pow(-Math.pow(-b, 1 / d), q);
          }
          return NaN;
        }
        return Math.pow(b, e);
      }
      case "fn": return FUN[n.f](evaluate(n.a, env));
    }
    return NaN;
  }

  // ---- TeX for the preview ("Rozumím: …") and for printing answers
  var PREC = { "+": 1, "-": 1, "*": 2, "/": 2, neg: 3, "^": 4 };
  function prec(n) { return n.t === "par" ? 9 : PREC[n.t] || 9; }
  function fmtNum(v) { return String(+v.toFixed(10)).replace(".", "{,}"); }
  function tex(n) {
    switch (n.t) {
      case "num": return fmtNum(n.v);
      case "var": return n.v;
      case "const": return n.v === "pi" ? "\\pi" : "e";
      case "par": return n.a.t === "/" ? tex(n.a) : "\\left(" + tex(n.a) + "\\right)";
      case "neg": return "-" + wrap(n.a, 3);
      case "+": return tex(n.a) + " + " + tex(n.b);
      case "-": return tex(n.a) + " - " + wrap(n.b, 2);
      case "/": return "\\frac{" + tex(strip(n.a)) + "}{" + tex(strip(n.b)) + "}";
      case "*": {
        var A = wrap(n.a, 2), B = wrap(n.b, 2.5);
        var sep = (/[\d}]$/.test(A) && /^[\d{]/.test(B)) || (n.b.t === "num") ? " \\cdot " : (n.b.t === "fn" ? "\\," : " ");
        return A + sep + B;
      }
      case "^": {
        if (n.fnpow) return fnName(n.a.f) + "^{" + tex(strip(n.b)) + "}" + fnArg(n.a);
        return wrap(n.a, 5) + "^{" + tex(strip(n.b)) + "}";
      }
      case "fn":
        if (n.f === "sqrt") return "\\sqrt{" + tex(strip(n.a)) + "}";
        if (n.f === "cbrt") return "\\sqrt[3]{" + tex(strip(n.a)) + "}";
        if (n.f === "abs") return "\\left|" + tex(strip(n.a)) + "\\right|";
        return fnName(n.f) + fnArg(n);
    }
    return "";
  }
  function fnName(f) { return TEXF[f] || "\\operatorname{" + f + "}"; }
  function fnArg(n) {
    var a = strip(n.a);
    var simple = a.t === "var" || a.t === "num" || a.t === "const";
    return simple ? "\\," + tex(a) : "\\left(" + tex(a) + "\\right)";
  }
  function strip(n) { return n.t === "par" ? strip(n.a) : n; }
  function wrap(n, p) { var s = tex(n); return prec(n) < p || (p >= 5 && (n.t === "neg" || n.t === "fn" || n.t === "^")) ? "\\left(" + s + "\\right)" : s; }

  // ---- formula answers: equal on a set of sample points (or equal up to a constant, for antiderivatives)
  function samples(dom) {
    var a = dom[0], b = dom[1], out = [];
    for (var i = 0; i < 9; i++) out.push(a + (b - a) * (i + 0.37) / 9.13 + 0.0123 * Math.sin(7 * i + 1));
    return out;
  }
  // The checkers return { ok }, { error } (the student's text can't be read: say why, let them retry), or
  // { broken } (the course's own answer can't be used: a mistake in lessons.txt or a generator, not the student's).
  function checkExpr(given, spec) {
    var g, e;
    try { e = parse(spec.answer, spec.vars); } catch (err) { return { broken: "answer \"" + spec.answer + "\": " + err.message }; }
    var v = spec.vars[0], diffs = [], scale = 1;
    var pts = samples(spec.dom).filter(function (x) { var env = {}; env[v] = x; return isFinite(evaluate(e, env)); });
    if (pts.length < 4) return { broken: "answer \"" + spec.answer + "\" is undefined at most sample points of dom=" + spec.dom.join("..") };
    if (spec.plusC) given = String(given).replace(/\+\s*[cC]\s*$/, "");
    try { g = parse(given, spec.vars); } catch (err) { return { error: err.message }; }
    for (var i = 0; i < pts.length; i++) {
      var env = {}; env[v] = pts[i];
      var ev = evaluate(e, env), gv = evaluate(g, env);
      if (!isFinite(gv)) return { ok: false };
      if (spec.plusC) { diffs.push(gv - ev); scale = Math.max(scale, Math.abs(ev)); }
      else if (Math.abs(gv - ev) > 1e-6 * Math.max(1, Math.abs(ev))) return { ok: false };
    }
    // "+C": the difference must be the same everywhere. The tolerance follows the size of the right answer, not of the
    // difference: a huge constant (987654) would otherwise make any change of the function look like rounding.
    if (spec.plusC) {
      for (var j = 1; j < diffs.length; j++) if (Math.abs(diffs[j] - diffs[0]) > 1e-6 * scale + 1e-12 * Math.abs(diffs[0])) return { ok: false };
    }
    return { ok: true };
  }
  function exprSpec(it) {
    var spec = { answer: it.answer, vars: ["x"], dom: [0.4, 2.6], plusC: false };
    (it.flags || []).forEach(function (f) {
      var m;
      if ((m = /^var\s*=\s*([a-z])$/.exec(f))) spec.vars = [m[1]];
      else if ((m = /^dom\s*=\s*(.+)\.\.(.+)$/.exec(f))) spec.dom = [parseFloat(m[1]), parseFloat(m[2])];
      else if (f === "+C") spec.plusC = true;
    });
    return spec;
  }
  function previewTeX(text, vars, plusC) {
    if (plusC && /\+\s*[cC]\s*$/.test(text)) return tex(parse(String(text).replace(/\+\s*[cC]\s*$/, ""), vars)) + " + C";
    return tex(parse(text, vars));
  }

  // ---- numbers inside intervals and sets
  function num(s) {
    s = String(s).trim().replace(/[−–]/g, "-");
    if (/^[+]?(∞|inf|infinity|nekonečno)$/i.test(s)) return Infinity;
    if (/^-(∞|inf|infinity|nekonečno)$/i.test(s)) return -Infinity;
    try { return evaluate(parse(s, []), {}); } catch (e) { return NaN; }
  }
  // "a; b" always works; "a, b" too, and with decimal commas "0,5, 1,5" (the separator is the comma before a space)
  function splitPair(inner) {
    if (inner.indexOf(";") >= 0) return inner.split(";");
    if (/,\s+/.test(inner)) return inner.split(/,\s+/);
    var parts = inner.split(",");
    if (parts.length === 2) return parts;
    if (parts.length === 4) return [parts[0] + "." + parts[1], parts[2] + "." + parts[3]];
    return null;
  }
  function parseInterval(text) {
    var s = String(text).trim().replace(/[⟨〈]/g, "[").replace(/[⟩〉]/g, "]").replace(/</g, "[").replace(/>/g, "]")
      .replace(/\s+u\s+|\s*∪\s*|\s+U\s+/g, "∪");
    if (/^(∅|\{\s*\}|prázdná množina)$/i.test(s)) return [];
    var pieces = s.split("∪"), out = [];
    for (var i = 0; i < pieces.length; i++) {
      var m = /^\s*([\[(])(.*)([\])])\s*$/.exec(pieces[i]);
      if (!m) fail("interval");
      var pr = splitPair(m[2]);
      if (!pr || pr.length !== 2) fail("endpoints");
      var a = num(pr[0]), b = num(pr[1]);
      if (isNaN(a) || isNaN(b)) fail("endpoint");
      out.push({ a: a, b: b, lc: m[1] === "[" && isFinite(a), rc: m[3] === "]" && isFinite(b) });
    }
    return union(out);
  }
  function close(x, y) {
    if (!isFinite(x) || !isFinite(y)) return x === y;        // otherwise |5 − ∞| ≤ 1e-6·∞ would make 5 equal ∞
    return Math.abs(x - y) <= 1e-6 * Math.max(1, Math.abs(y));
  }
  // The same set written in the simplest way: sorted, empty pieces dropped, overlapping or touching pieces
  // joined, so (0; 1] ∪ (1; 2) equals (0; 2).
  function union(list) {
    var out = [];
    list.filter(function (p) { return p.a < p.b || (close(p.a, p.b) && p.lc && p.rc); })
      .sort(function (x, y) { return x.a - y.a || (y.lc ? 1 : 0) - (x.lc ? 1 : 0); })
      .forEach(function (p) {
        var q = out[out.length - 1];
        if (q && (p.a < q.b && !close(p.a, q.b) || close(p.a, q.b) && (q.rc || p.lc))) {
          if (p.b > q.b && !close(p.b, q.b)) { q.b = p.b; q.rc = p.rc; }
          else if (close(p.b, q.b)) q.rc = q.rc || p.rc;
        } else out.push({ a: p.a, b: p.b, lc: p.lc, rc: p.rc });
      });
    return out;
  }
  function checkInterval(given, answer) {
    var g;
    var e;
    try { e = parseInterval(answer); } catch (err) { return { broken: "answer \"" + answer + "\": " + err.message }; }
    try { g = parseInterval(given); } catch (err) { return { error: err.message }; }
    if (g.length !== e.length) return { ok: false };
    for (var i = 0; i < e.length; i++) {
      if (!close(g[i].a, e[i].a) || !close(g[i].b, e[i].b) || g[i].lc !== e[i].lc || g[i].rc !== e[i].rc) return { ok: false };
    }
    return { ok: true };
  }
  function parseSet(text) {
    var s = String(text).trim().replace(/^\{|\}$/g, "").trim();
    if (!s || s === "∅") return [];
    // Elements are separated by ";" (or ", " with a space). A comma with no space is a Czech decimal comma
    // when it can be one: {0,5} is one half, not {0; 5}. Otherwise, as in {1,2,3}, it separates.
    var parts = s.indexOf(";") >= 0 ? s.split(";") : /,\s+/.test(s) ? s.split(/,\s+/)
      : /^[^,]*\d,\d[^,]*$/.test(s) ? [s] : s.split(","), out = [];
    parts.forEach(function (p) {
      p = p.trim(); if (!p) return;
      var pm = /^(±|\+-|\+\/-)(.*)$/.exec(p);
      if (pm) { var v = num(pm[2]); if (isNaN(v)) fail("element", p); out.push(v, -v); return; }
      var x = num(p);
      if (isNaN(x)) fail("element", p);
      out.push(x);
    });
    out.sort(function (a, b) { return a - b; });
    return out.filter(function (v, i) { return i === 0 || !close(v, out[i - 1]); });
  }
  function checkSet(given, answer) {
    var g;
    var e;
    try { e = parseSet(answer); } catch (err) { return { broken: "answer \"" + answer + "\": " + err.message }; }
    try { g = parseSet(given); } catch (err) { return { error: err.message }; }
    if (g.length !== e.length) return { ok: false };
    for (var i = 0; i < e.length; i++) if (!close(g[i], e[i])) return { ok: false };
    return { ok: true };
  }
  function numTeX(v) {
    if (v === Infinity) return "\\infty";
    if (v === -Infinity) return "-\\infty";
    return fmtNum(v);
  }
  // Print an answer as written in the course file, but typeset: "(-1; 5)" → "(-1;\ 5)"
  function intervalTeX(text) {
    return String(text).replace(/-?(∞|inf)/g, function (m) { return m[0] === "-" ? "-\\infty" : "\\infty"; })
      .replace(/;\s*/g, ";\\ ").replace(/∪/g, "\\cup ").replace(/π|pi/g, "\\pi").replace(/√(\w+)/g, "\\sqrt{$1}");
  }
  function setTeX(text) {
    var t = String(text).trim().replace(/^\{|\}$/g, "");
    return "\\{" + t.replace(/;\s*/g, ";\\ ").replace(/±/g, "\\pm ").replace(/π|pi/g, "\\pi").replace(/√(\w+)/g, "\\sqrt{$1}") + "\\}";
  }

  window.CUSP_ANS = {
    parse: parse, evaluate: evaluate, tex: tex, previewTeX: previewTeX,
    checkExpr: checkExpr, exprSpec: exprSpec, answerTeX: function (spec) { return tex(parse(spec.answer, spec.vars)); },
    checkInterval: checkInterval, checkSet: checkSet, parseInterval: parseInterval, parseSet: parseSet,
    intervalTeX: intervalTeX, setTeX: setTeX, numTeX: numTeX
  };
})();
