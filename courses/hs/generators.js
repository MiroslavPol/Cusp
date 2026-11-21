/* Random question generators for this course. In lessons.txt, "? gen | name" calls G.name.
   Each generator returns a fresh question object (see app/js/genkit.js for the helpers in K). */
CUSP_GEN.define("hs", function (K, G) {
  "use strict";
  var P = K.P, ans = K.ans, dec = K.dec, expr = K.expr, fr = K.fr, fs = K.fs, ft = K.ft, gcd = K.gcd, inp = K.inp, ivl = K.ivl, lin = K.lin, mc = K.mc, nz = K.nz, par = K.par, pick = K.pick, poly = K.poly, ri = K.ri, set = K.set, sgn = K.sgn, withFig = K.withFig;

  // ---- Středoškolské opakování ------------------------------------------------
  G.hs_lin = function () {
    var a = nz(-6, 6), x = ri(-9, 9), b = ri(-12, 12), c = a * x + b;
    return inp(P("Vyřešte $" + poly([[a, 1], [b, 0]]) + " = " + c + "$."), String(x),
      "Odečteme $" + b + "$: $" + poly([[a, 1]]) + " = " + (c - b) + "$, vydělíme $" + a + "$: $x = " + x + "$.");
  };
  G.hs_pow = function () {
    var a = ri(2, 5), m = ri(-3, 6), n = ri(-3, 6), k = pick([0, 1, 2]);
    if (k === 0) return inp(P("Zapište $x^{" + m + "}\\cdot x^{" + n + "}$ jako $x^k$. Kolik je $k$?"), String(m + n), "Exponenty se při násobení sčítají.");
    if (k === 1) return inp(P("Zapište $\\dfrac{x^{" + m + "}}{x^{" + n + "}}$ jako $x^k$. Kolik je $k$?"), String(m - n), "Exponenty se při dělení odečítají.");
    var e = ri(-2, 3), v = Math.pow(a, e), f = e >= 0 ? fr(v, 1) : fr(1, Math.pow(a, -e));
    return inp(P("Vypočtěte $" + a + "^{" + e + "}$."), ans(f), e < 0 ? "Záporný exponent: $" + a + "^{" + e + "} = \\frac{1}{" + a + "^{" + (-e) + "}}$." : "$" + a + "^{" + e + "} = " + v + "$.");
  };
  G.hs_quad = function () {
    var p = ri(-6, 6), q = ri(-6, 6);
    if (p === q) q = p + 1;
    var b = -(p + q), c = p * q, lo = Math.min(p, q), hi = Math.max(p, q);
    return set(P("Vyřešte $" + poly([[1, 2], [b, 1], [c, 0]]) + " = 0$."), lo + "; " + hi,
      "Hledáme čísla se součtem $" + (-b) + "$ a součinem $" + c + "$: $" + lin(lo) + lin(hi) + " = 0$.");
  };
  G.hs_ineq = function () {
    var a = nz(-4, 4), x0 = ri(-6, 6), b = ri(-9, 9), c = a * x0 + b, rel = pick(["<", ">"]);
    var right = (rel === "<") === (a > 0);       // solution x < x0 ?
    return ivl(P("Vyřešte $" + poly([[a, 1], [b, 0]]) + " " + rel + " " + c + "$. Zapište interval."), right ? "(-∞; " + x0 + ")" : "(" + x0 + "; ∞)",
      "$" + poly([[a, 1]]) + " " + rel + " " + (c - b) + "$" + (a < 0 ? "; dělení záporným číslem $" + a + "$ otočí znak" : "") + ": $x " + (right ? "<" : ">") + " " + x0 + "$.");
  };
  G.hs_fval = function () {
    var a = nz(-3, 3), b = ri(-5, 5), c = ri(-6, 6), x = ri(-3, 3), v = a * x * x + b * x + c;
    return inp(P("Je-li $f(x) = " + poly([[a, 2], [b, 1], [c, 0]]) + "$, kolik je $f(" + x + ")$?"), String(v),
      "Dosadíme: $" + a + "\\cdot" + par(x) + "^2 " + sgn(b) + "\\cdot" + par(x) + sgn(c) + " = " + v + "$.");
  };
  G.hs_line = function () {
    var x1 = ri(-4, 2), x2 = x1 + ri(1, 4), k = nz(-3, 3), q = ri(-5, 5), y1 = k * x1 + q, y2 = k * x2 + q;
    return expr(P("Napište rovnici přímky procházející body $[" + x1 + ", " + y1 + "]$ a $[" + x2 + ", " + y2 + "]$ ve tvaru $y = \\dots$"), k + "x" + sgn(q),
      "Směrnice $\\frac{" + y2 + " - " + par(y1) + "}{" + x2 + " - " + par(x1) + "} = " + k + "$, úsek dopočteme z prvního bodu.", [], "$" + poly([[k, 1], [q, 0]]) + "$");
  };
  G.hs_inverse = function () {
    var a = pick([2, 3, 4, 5]), b = nz(-6, 6);
    return expr(P("Najděte inverzní funkci k $f(x) = " + poly([[a, 1], [b, 0]]) + "$."), "(x" + sgn(-b) + ")/" + a,
      "$y = " + poly([[a, 1], [b, 0]]) + "\\Rightarrow x = \\frac{y" + sgn(-b) + "}{" + a + "}$.", [], "$\\dfrac{x" + sgn(-b) + "}{" + a + "}$");
  };
  G.hs_vertex = function () {
    var h = ri(-4, 4), k = ri(-6, 6), b = -2 * h, c = h * h + k;
    return inp(P("Jakou souřadnici $y$ má vrchol paraboly $y = " + poly([[1, 2], [b, 1], [c, 0]]) + "$?"), String(k),
      "Doplníme na čtverec: $" + lin(h) + "^2 " + sgn(k) + "$, vrchol je $[" + h + ", " + k + "]$.");
  };
  G.hs_exp = function () {
    var b = pick([2, 3, 5]), e = ri(-3, 4), v = Math.pow(b, Math.abs(e)), rhs = e >= 0 ? String(v) : "\\frac{1}{" + v + "}";
    return inp(P("Vyřešte $" + b + "^x = " + rhs + "$."), String(e), "$" + rhs + " = " + b + "^{" + e + "}$.");
  };
  G.hs_log = function () {
    var b = pick([2, 3, 5, 10]), e = ri(-2, 4), v = Math.pow(b, Math.abs(e)), arg = e >= 0 ? String(v) : "\\frac{1}{" + v + "}";
    return inp(P("Vypočtěte $\\log_{" + b + "}" + arg + "$."), String(e), "$" + b + "^{" + e + "} = " + arg + "$.");
  };
  G.hs_logrule = function () {
    var b = pick([2, 3]), m = ri(1, 3), n = ri(1, 3), p = pick([0, 1]);
    if (p === 0) { var u = Math.pow(b, m), w = Math.pow(b, n); return inp(P("Zjednodušte $\\log_{" + b + "}" + u + " + \\log_{" + b + "}" + w + "$."), String(m + n), "$\\log_{" + b + "}(" + u + "\\cdot" + w + ") = \\log_{" + b + "}" + u * w + " = " + (m + n) + "$."); }
    var big = Math.pow(b, m + n) * 3, small = 3 * Math.pow(b, n);
    return inp(P("Zjednodušte $\\log_{" + b + "}" + big + " - \\log_{" + b + "}" + small + "$."), String(m), "$\\log_{" + b + "}\\frac{" + big + "}{" + small + "} = \\log_{" + b + "}" + Math.pow(b, m) + " = " + m + "$.");
  };
  G.hs_pyth = function () {
    var t = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15]]), k = ri(1, 3), a = t[0] * k, b = t[1] * k, c = t[2] * k;
    if (Math.random() < 0.5) return inp(P("Pravoúhlý trojúhelník má odvěsny $" + a + "$ a $" + b + "$. Jak dlouhá je přepona?"), String(c), "$\\sqrt{" + a + "^2+" + b + "^2} = \\sqrt{" + c * c + "} = " + c + "$.");
    return inp(P("Pravoúhlý trojúhelník má přeponu $" + c + "$ a odvěsnu $" + a + "$. Jak dlouhá je druhá odvěsna?"), String(b), "$\\sqrt{" + c + "^2-" + a + "^2} = \\sqrt{" + b * b + "} = " + b + "$.");
  };
  G.hs_rad = function () {
    var d = pick([30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360]), f = fr(d, 180);
    var pi = f.p === 1 && f.q === 1 ? "π" : f.q === 1 ? f.p + "π" : (f.p === 1 ? "" : f.p) + "π/" + f.q;
    if (Math.random() < 0.5) return inp(P("Převeďte $" + d + "^\\circ$ na radiány."), pi + "; " + (Math.round(d * Math.PI / 180 * 10000) / 10000),
      "$" + d + "\\cdot\\frac{\\pi}{180} = " + (f.q === 1 ? (f.p === 1 ? "" : f.p) + "\\pi" : "\\frac{" + (f.p === 1 ? "" : f.p) + "\\pi}{" + f.q + "}") + "$.");
    return inp(P("Převeďte $" + (f.q === 1 ? (f.p === 1 ? "" : f.p) + "\\pi" : "\\frac{" + (f.p === 1 ? "" : f.p) + "\\pi}{" + f.q + "}") + "$ radiánů na stupně."), String(d), "Vynásobíme $\\frac{180}{\\pi}$.");
  };
  G.hs_trig = function () {
    var A = [[0, "0", "1"], [30, "1/2", "√3/2"], [45, "√2/2", "√2/2"], [60, "√3/2", "1/2"], [90, "1", "0"], [120, "√3/2", "-1/2"], [135, "√2/2", "-√2/2"], [150, "1/2", "-√3/2"], [180, "0", "-1"]];
    var r = pick(A), f = pick(["sin", "cos"]), v = f === "sin" ? r[1] : r[2];
    var num = Math.round((f === "sin" ? Math.sin : Math.cos)(r[0] * Math.PI / 180) * 10000) / 10000;
    var tex = function (a) { return a.replace(/√(\d)\/(\d)/, "\\frac{\\sqrt$1}{$2}").replace(/^(-?)(\d)\/(\d)$/, "$1\\frac{$2}{$3}"); };
    return inp(P("Kolik je $\\" + f + " " + r[0] + "^\\circ$?"), v + "; " + num,
      "Bod jednotkové kružnice v úhlu $" + r[0] + "^\\circ$ je $[" + tex(r[2]) + ", " + tex(r[1]) + "]$. Kosinus je jeho souřadnice $x$, sinus souřadnice $y$, tedy $\\" + f + " " + r[0] + "^\\circ = " + tex(v) + "$.");
  };
  // right-triangle trigonometry: only acute angles (the unit circle comes two lessons later)
  G.hs_trig_acute = function () {
    var A = [[30, "1/2", "√3/2", "√3/3"], [45, "√2/2", "√2/2", "1"], [60, "√3/2", "1/2", "√3"]];
    var r = pick(A), k = ri(0, 2), f = ["sin", "cos", "tg"][k], v = r[k + 1];
    var num = Math.round([Math.sin, Math.cos, Math.tan][k](r[0] * Math.PI / 180) * 10000) / 10000;
    var tex = function (a) { return a.replace(/√(\d)\/(\d)/, "\\frac{\\sqrt$1}{$2}").replace(/^√(\d)$/, "\\sqrt$1").replace(/^(\d)\/(\d)$/, "\\frac{$1}{$2}"); };
    var why = r[0] === 45 ? "Rovnoramenný pravoúhlý trojúhelník s odvěsnami $1$ má přeponu $\\sqrt2$."
      : "V trojúhelníku s úhly $30^\\circ$, $60^\\circ$, $90^\\circ$ a přeponou $2$ leží proti úhlu $30^\\circ$ odvěsna $1$ a proti úhlu $60^\\circ$ odvěsna $\\sqrt3$.";
    return inp(P("Kolik je $" + (f === "tg" ? "\\operatorname{tg}" : "\\" + f) + " " + r[0] + "^\\circ$?"), v + "; " + num,
      why + " Odtud $" + (f === "tg" ? "\\operatorname{tg}" : "\\" + f) + " " + r[0] + "^\\circ = " + tex(v) + "$.");
  };
});
