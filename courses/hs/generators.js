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

  // ---- Figures: Venn diagrams of two sets (shaded region -> spec), drawn by courses/hs figure helpers
  var VENN = {"AB": "x=-3.4..3.4; y=-2.1..2.1; aspect=equal; axes=off; fill=0,-1.062,0.05,-1.025,0.098,-0.985,0.144,-0.944,0.188,-0.9,0.23,-0.854,0.27,-0.806,0.307,-0.757,0.342,-0.705,0.374,-0.652,0.404,-0.598,0.432,-0.542,0.456,-0.485,0.478,-0.427,0.497,-0.368,0.513,-0.308,0.526,-0.247,0.537,-0.186,0.544,-0.124,0.549,-0.062,0.55,0,0.549,0.062,0.544,0.124,0.537,0.186,0.526,0.247,0.513,0.308,0.497,0.368,0.478,0.427,0.456,0.485,0.432,0.542,0.404,0.598,0.374,0.652,0.342,0.705,0.307,0.757,0.27,0.806,0.23,0.854,0.188,0.9,0.144,0.944,0.098,0.985,0.05,1.025,0,1.062,0,1.062,-0.05,1.025,-0.098,0.985,-0.144,0.944,-0.188,0.9,-0.23,0.854,-0.27,0.806,-0.307,0.757,-0.342,0.705,-0.374,0.652,-0.404,0.598,-0.432,0.542,-0.456,0.485,-0.478,0.427,-0.497,0.368,-0.513,0.308,-0.526,0.247,-0.537,0.186,-0.544,0.124,-0.549,0.062,-0.55,0,-0.549,-0.062,-0.544,-0.124,-0.537,-0.186,-0.526,-0.247,-0.513,-0.308,-0.497,-0.368,-0.478,-0.427,-0.456,-0.485,-0.432,-0.542,-0.404,-0.598,-0.374,-0.652,-0.342,-0.705,-0.307,-0.757,-0.27,-0.806,-0.23,-0.854,-0.188,-0.9,-0.144,-0.944,-0.098,-0.985,-0.05,-1.025,0,-1.062,def; circle=-0.75,0,1.3; circle=0.75,0,1.3; seg=-3.3,-2,3.3,-2,muted; seg=3.3,-2,3.3,2,muted; seg=3.3,2,-3.3,2,muted; seg=-3.3,2,-3.3,-2,muted; label=-1.725,1.235,A; label=1.725,1.235,B", "A-B": "x=-3.4..3.4; y=-2.1..2.1; aspect=equal; axes=off; fill=0,1.062,-0.12,1.137,-0.248,1.199,-0.382,1.247,-0.52,1.28,-0.661,1.297,-0.803,1.299,-0.944,1.285,-1.083,1.257,-1.218,1.213,-1.348,1.154,-1.47,1.082,-1.584,0.997,-1.688,0.9,-1.78,0.793,-1.861,0.676,-1.928,0.55,-1.981,0.419,-2.019,0.282,-2.042,0.142,-2.05,0,-2.042,-0.142,-2.019,-0.282,-1.981,-0.419,-1.928,-0.55,-1.861,-0.676,-1.78,-0.793,-1.688,-0.9,-1.584,-0.997,-1.47,-1.082,-1.348,-1.154,-1.218,-1.213,-1.083,-1.257,-0.944,-1.285,-0.803,-1.299,-0.661,-1.297,-0.52,-1.28,-0.382,-1.247,-0.248,-1.199,-0.12,-1.137,0,-1.062,0,-1.062,-0.05,-1.025,-0.098,-0.985,-0.144,-0.944,-0.188,-0.9,-0.23,-0.854,-0.27,-0.806,-0.307,-0.757,-0.342,-0.705,-0.374,-0.652,-0.404,-0.598,-0.432,-0.542,-0.456,-0.485,-0.478,-0.427,-0.497,-0.368,-0.513,-0.308,-0.526,-0.247,-0.537,-0.186,-0.544,-0.124,-0.549,-0.062,-0.55,0,-0.549,0.062,-0.544,0.124,-0.537,0.186,-0.526,0.247,-0.513,0.308,-0.497,0.368,-0.478,0.427,-0.456,0.485,-0.432,0.542,-0.404,0.598,-0.374,0.652,-0.342,0.705,-0.307,0.757,-0.27,0.806,-0.23,0.854,-0.188,0.9,-0.144,0.944,-0.098,0.985,-0.05,1.025,0,1.062,def; circle=-0.75,0,1.3; circle=0.75,0,1.3; seg=-3.3,-2,3.3,-2,muted; seg=3.3,-2,3.3,2,muted; seg=3.3,2,-3.3,2,muted; seg=-3.3,2,-3.3,-2,muted; label=-1.725,1.235,A; label=1.725,1.235,B", "B-A": "x=-3.4..3.4; y=-2.1..2.1; aspect=equal; axes=off; fill=0,-1.062,0.12,-1.137,0.248,-1.199,0.382,-1.247,0.52,-1.28,0.661,-1.297,0.803,-1.299,0.944,-1.285,1.083,-1.257,1.218,-1.213,1.348,-1.154,1.47,-1.082,1.584,-0.997,1.688,-0.9,1.78,-0.793,1.861,-0.676,1.928,-0.55,1.981,-0.419,2.019,-0.282,2.042,-0.142,2.05,0,2.042,0.142,2.019,0.282,1.981,0.419,1.928,0.55,1.861,0.676,1.78,0.793,1.688,0.9,1.584,0.997,1.47,1.082,1.348,1.154,1.218,1.213,1.083,1.257,0.944,1.285,0.803,1.299,0.661,1.297,0.52,1.28,0.382,1.247,0.248,1.199,0.12,1.137,0,1.062,0,1.062,0.05,1.025,0.098,0.985,0.144,0.944,0.188,0.9,0.23,0.854,0.27,0.806,0.307,0.757,0.342,0.705,0.374,0.652,0.404,0.598,0.432,0.542,0.456,0.485,0.478,0.427,0.497,0.368,0.513,0.308,0.526,0.247,0.537,0.186,0.544,0.124,0.549,0.062,0.55,0,0.549,-0.062,0.544,-0.124,0.537,-0.186,0.526,-0.247,0.513,-0.308,0.497,-0.368,0.478,-0.427,0.456,-0.485,0.432,-0.542,0.404,-0.598,0.374,-0.652,0.342,-0.705,0.307,-0.757,0.27,-0.806,0.23,-0.854,0.188,-0.9,0.144,-0.944,0.098,-0.985,0.05,-1.025,0,-1.062,def; circle=-0.75,0,1.3; circle=0.75,0,1.3; seg=-3.3,-2,3.3,-2,muted; seg=3.3,-2,3.3,2,muted; seg=3.3,2,-3.3,2,muted; seg=-3.3,2,-3.3,-2,muted; label=-1.725,1.235,A; label=1.725,1.235,B", "U": "x=-3.4..3.4; y=-2.1..2.1; aspect=equal; axes=off; fill=0,1.062,-0.12,1.137,-0.248,1.199,-0.382,1.247,-0.52,1.28,-0.661,1.297,-0.803,1.299,-0.944,1.285,-1.083,1.257,-1.218,1.213,-1.348,1.154,-1.47,1.082,-1.584,0.997,-1.688,0.9,-1.78,0.793,-1.861,0.676,-1.928,0.55,-1.981,0.419,-2.019,0.282,-2.042,0.142,-2.05,0,-2.042,-0.142,-2.019,-0.282,-1.981,-0.419,-1.928,-0.55,-1.861,-0.676,-1.78,-0.793,-1.688,-0.9,-1.584,-0.997,-1.47,-1.082,-1.348,-1.154,-1.218,-1.213,-1.083,-1.257,-0.944,-1.285,-0.803,-1.299,-0.661,-1.297,-0.52,-1.28,-0.382,-1.247,-0.248,-1.199,-0.12,-1.137,0,-1.062,0,-1.062,-0.05,-1.025,-0.098,-0.985,-0.144,-0.944,-0.188,-0.9,-0.23,-0.854,-0.27,-0.806,-0.307,-0.757,-0.342,-0.705,-0.374,-0.652,-0.404,-0.598,-0.432,-0.542,-0.456,-0.485,-0.478,-0.427,-0.497,-0.368,-0.513,-0.308,-0.526,-0.247,-0.537,-0.186,-0.544,-0.124,-0.549,-0.062,-0.55,0,-0.549,0.062,-0.544,0.124,-0.537,0.186,-0.526,0.247,-0.513,0.308,-0.497,0.368,-0.478,0.427,-0.456,0.485,-0.432,0.542,-0.404,0.598,-0.374,0.652,-0.342,0.705,-0.307,0.757,-0.27,0.806,-0.23,0.854,-0.188,0.9,-0.144,0.944,-0.098,0.985,-0.05,1.025,0,1.062,def; fill=0,-1.062,0.05,-1.025,0.098,-0.985,0.144,-0.944,0.188,-0.9,0.23,-0.854,0.27,-0.806,0.307,-0.757,0.342,-0.705,0.374,-0.652,0.404,-0.598,0.432,-0.542,0.456,-0.485,0.478,-0.427,0.497,-0.368,0.513,-0.308,0.526,-0.247,0.537,-0.186,0.544,-0.124,0.549,-0.062,0.55,0,0.549,0.062,0.544,0.124,0.537,0.186,0.526,0.247,0.513,0.308,0.497,0.368,0.478,0.427,0.456,0.485,0.432,0.542,0.404,0.598,0.374,0.652,0.342,0.705,0.307,0.757,0.27,0.806,0.23,0.854,0.188,0.9,0.144,0.944,0.098,0.985,0.05,1.025,0,1.062,0,1.062,-0.05,1.025,-0.098,0.985,-0.144,0.944,-0.188,0.9,-0.23,0.854,-0.27,0.806,-0.307,0.757,-0.342,0.705,-0.374,0.652,-0.404,0.598,-0.432,0.542,-0.456,0.485,-0.478,0.427,-0.497,0.368,-0.513,0.308,-0.526,0.247,-0.537,0.186,-0.544,0.124,-0.549,0.062,-0.55,0,-0.549,-0.062,-0.544,-0.124,-0.537,-0.186,-0.526,-0.247,-0.513,-0.308,-0.497,-0.368,-0.478,-0.427,-0.456,-0.485,-0.432,-0.542,-0.404,-0.598,-0.374,-0.652,-0.342,-0.705,-0.307,-0.757,-0.27,-0.806,-0.23,-0.854,-0.188,-0.9,-0.144,-0.944,-0.098,-0.985,-0.05,-1.025,0,-1.062,def; fill=0,-1.062,0.12,-1.137,0.248,-1.199,0.382,-1.247,0.52,-1.28,0.661,-1.297,0.803,-1.299,0.944,-1.285,1.083,-1.257,1.218,-1.213,1.348,-1.154,1.47,-1.082,1.584,-0.997,1.688,-0.9,1.78,-0.793,1.861,-0.676,1.928,-0.55,1.981,-0.419,2.019,-0.282,2.042,-0.142,2.05,0,2.042,0.142,2.019,0.282,1.981,0.419,1.928,0.55,1.861,0.676,1.78,0.793,1.688,0.9,1.584,0.997,1.47,1.082,1.348,1.154,1.218,1.213,1.083,1.257,0.944,1.285,0.803,1.299,0.661,1.297,0.52,1.28,0.382,1.247,0.248,1.199,0.12,1.137,0,1.062,0,1.062,0.05,1.025,0.098,0.985,0.144,0.944,0.188,0.9,0.23,0.854,0.27,0.806,0.307,0.757,0.342,0.705,0.374,0.652,0.404,0.598,0.432,0.542,0.456,0.485,0.478,0.427,0.497,0.368,0.513,0.308,0.526,0.247,0.537,0.186,0.544,0.124,0.549,0.062,0.55,0,0.549,-0.062,0.544,-0.124,0.537,-0.186,0.526,-0.247,0.513,-0.308,0.497,-0.368,0.478,-0.427,0.456,-0.485,0.432,-0.542,0.404,-0.598,0.374,-0.652,0.342,-0.705,0.307,-0.757,0.27,-0.806,0.23,-0.854,0.188,-0.9,0.144,-0.944,0.098,-0.985,0.05,-1.025,0,-1.062,def; circle=-0.75,0,1.3; circle=0.75,0,1.3; seg=-3.3,-2,3.3,-2,muted; seg=3.3,-2,3.3,2,muted; seg=3.3,2,-3.3,2,muted; seg=-3.3,2,-3.3,-2,muted; label=-1.725,1.235,A; label=1.725,1.235,B", "X": "x=-3.4..3.4; y=-2.1..2.1; aspect=equal; axes=off; fill=0,1.062,-0.12,1.137,-0.248,1.199,-0.382,1.247,-0.52,1.28,-0.661,1.297,-0.803,1.299,-0.944,1.285,-1.083,1.257,-1.218,1.213,-1.348,1.154,-1.47,1.082,-1.584,0.997,-1.688,0.9,-1.78,0.793,-1.861,0.676,-1.928,0.55,-1.981,0.419,-2.019,0.282,-2.042,0.142,-2.05,0,-2.042,-0.142,-2.019,-0.282,-1.981,-0.419,-1.928,-0.55,-1.861,-0.676,-1.78,-0.793,-1.688,-0.9,-1.584,-0.997,-1.47,-1.082,-1.348,-1.154,-1.218,-1.213,-1.083,-1.257,-0.944,-1.285,-0.803,-1.299,-0.661,-1.297,-0.52,-1.28,-0.382,-1.247,-0.248,-1.199,-0.12,-1.137,0,-1.062,0,-1.062,-0.05,-1.025,-0.098,-0.985,-0.144,-0.944,-0.188,-0.9,-0.23,-0.854,-0.27,-0.806,-0.307,-0.757,-0.342,-0.705,-0.374,-0.652,-0.404,-0.598,-0.432,-0.542,-0.456,-0.485,-0.478,-0.427,-0.497,-0.368,-0.513,-0.308,-0.526,-0.247,-0.537,-0.186,-0.544,-0.124,-0.549,-0.062,-0.55,0,-0.549,0.062,-0.544,0.124,-0.537,0.186,-0.526,0.247,-0.513,0.308,-0.497,0.368,-0.478,0.427,-0.456,0.485,-0.432,0.542,-0.404,0.598,-0.374,0.652,-0.342,0.705,-0.307,0.757,-0.27,0.806,-0.23,0.854,-0.188,0.9,-0.144,0.944,-0.098,0.985,-0.05,1.025,0,1.062,def; fill=0,-1.062,0.12,-1.137,0.248,-1.199,0.382,-1.247,0.52,-1.28,0.661,-1.297,0.803,-1.299,0.944,-1.285,1.083,-1.257,1.218,-1.213,1.348,-1.154,1.47,-1.082,1.584,-0.997,1.688,-0.9,1.78,-0.793,1.861,-0.676,1.928,-0.55,1.981,-0.419,2.019,-0.282,2.042,-0.142,2.05,0,2.042,0.142,2.019,0.282,1.981,0.419,1.928,0.55,1.861,0.676,1.78,0.793,1.688,0.9,1.584,0.997,1.47,1.082,1.348,1.154,1.218,1.213,1.083,1.257,0.944,1.285,0.803,1.299,0.661,1.297,0.52,1.28,0.382,1.247,0.248,1.199,0.12,1.137,0,1.062,0,1.062,0.05,1.025,0.098,0.985,0.144,0.944,0.188,0.9,0.23,0.854,0.27,0.806,0.307,0.757,0.342,0.705,0.374,0.652,0.404,0.598,0.432,0.542,0.456,0.485,0.478,0.427,0.497,0.368,0.513,0.308,0.526,0.247,0.537,0.186,0.544,0.124,0.549,0.062,0.55,0,0.549,-0.062,0.544,-0.124,0.537,-0.186,0.526,-0.247,0.513,-0.308,0.497,-0.368,0.478,-0.427,0.456,-0.485,0.432,-0.542,0.404,-0.598,0.374,-0.652,0.342,-0.705,0.307,-0.757,0.27,-0.806,0.23,-0.854,0.188,-0.9,0.144,-0.944,0.098,-0.985,0.05,-1.025,0,-1.062,def; circle=-0.75,0,1.3; circle=0.75,0,1.3; seg=-3.3,-2,3.3,-2,muted; seg=3.3,-2,3.3,2,muted; seg=3.3,2,-3.3,2,muted; seg=-3.3,2,-3.3,-2,muted; label=-1.725,1.235,A; label=1.725,1.235,B", "N": "x=-3.4..3.4; y=-2.1..2.1; aspect=equal; axes=off; circle=-0.75,0,1.3; circle=0.75,0,1.3; seg=-3.3,-2,3.3,-2,muted; seg=3.3,-2,3.3,2,muted; seg=3.3,2,-3.3,2,muted; seg=-3.3,2,-3.3,-2,muted; label=-1.725,1.235,A; label=1.725,1.235,B"};

  // ==== Helpers for the generators below ====================================================
  var ans0 = ans;                                     // no 4-decimal alternative for tiny values (0.0001 is not 1/7776)
  ans = function (f) { return Math.abs(f.p / f.q) < 0.01 ? fs(f) : ans0(f); };
  function cz(x) { return String(x).replace(".", "{,}"); }                       // decimal comma in TeX
  function N(x) { return String(Math.round(x * 1000) / 1000); }                   // a number in a figure spec
  function r4(x) { return String(Math.round(x * 10000) / 10000); }
  function tf(html, truth, explain) { return { kind: "tf", html: html, answer: truth ? "true" : "false", explain: explain }; }
  function figQ(spec, q) { q.figQ = [spec]; return q; }                          // a figure with the question
  function gr(x0, x1, y0, y1, items, eq) { return "x=" + N(x0) + ".." + N(x1) + "; y=" + N(y0) + ".." + N(y1) + (eq ? "; aspect=equal" : "") + "; " + items.join("; "); }
  function uniq(a) { var s = {}, o = []; a.forEach(function (v) { if (!s[v]) { s[v] = 1; o.push(v); } }); return o; }
  function setS(a) { return a.length ? uniq(a).join("; ") : "∅"; }
  function lst(a) { return a.join(", "); }
  function frTeX(p, q) { return ft(fr(p, q)); }
  function fq(p, q) { var raw = q === 1 ? String(p) : "\\frac{" + p + "}{" + q + "}", f = ft(fr(p, q)); return raw === f ? raw : raw + " = " + f; }
  function frAns(p, q) { return ans(fr(p, q)); }
  function sqf(n) {                                   // n = k^2 * m with m square-free
    var k = 1, m = n;
    for (var d = 2; d * d <= m; d++) while (m % (d * d) === 0) { m /= d * d; k *= d; }
    return { k: k, m: m };
  }
  function sqTeX(n) { var s = sqf(n); return s.m === 1 ? String(s.k) : (s.k === 1 ? "" : s.k) + "\\sqrt{" + s.m + "}"; }
  function sqAns(n) { var s = sqf(n); return s.m === 1 ? String(s.k) : (s.k === 1 ? "" : s.k) + "√" + s.m + "; " + r4(Math.sqrt(n)); }
  // sqrt(P/Q) = k*sqrt(m)/d
  function sqFrac(P, Q) { var g = gcd(P, Q); P /= g; Q /= g; var s = sqf(P * Q), h = gcd(s.k, Q); return { k: s.k / h, m: s.m, d: Q / h }; }
  function sqFracTeX(o) { var top = o.m === 1 ? String(o.k) : (o.k === 1 ? "" : o.k) + "\\sqrt{" + o.m + "}"; return o.d === 1 ? top : "\\frac{" + top + "}{" + o.d + "}"; }
  function sqFracAns(o) { var top = o.m === 1 ? String(o.k) : (o.k === 1 ? "" : o.k) + "√" + o.m; return (o.d === 1 ? top : top + "/" + o.d) + "; " + r4(o.k * Math.sqrt(o.m) / o.d); }
  function piTeX(p, q) { var f = fr(p, q); if (f.p === 0) return "0"; var a = Math.abs(f.p), top = (a === 1 ? "" : a) + "\\pi"; return (f.p < 0 ? "-" : "") + (f.q === 1 ? top : "\\frac{" + top + "}{" + f.q + "}"); }
  function piS(p, q) { var f = fr(p, q); if (f.p === 0) return "0"; var a = Math.abs(f.p); return (f.p < 0 ? "-" : "") + (a === 1 ? "" : a) + "π" + (f.q === 1 ? "" : "/" + f.q); }
  function piAns(p, q) { return p === 0 ? "0" : piS(p, q) + "; " + r4(Math.PI * p / q); }
  function iv(a, b, ca, cb) { return (a === null ? "(" : ca ? "[" : "(") + (a === null ? "-∞" : a) + "; " + (b === null ? "∞" : b) + (b === null ? ")" : cb ? "]" : ")"); }
  function ivT(a, b, ca, cb) { return (a === null ? "(" : ca ? "[" : "(") + (a === null ? "-\\infty" : a) + ", " + (b === null ? "\\infty" : b) + (b === null ? ")" : cb ? "]" : ")"); }
  function nl(lo, hi, pieces, extra) {          // a number line; pieces [a|null, b|null, a closed, b closed]
    var s = ["x=" + N(lo - 0.6) + ".." + N(hi + 0.6), "y=-1..1.1", "aspect=equal", "axes=off", "seg=" + N(lo - 0.5) + ",0," + N(hi + 0.5) + ",0,muted"];
    var step = hi - lo > 14 ? 2 : 1, y = 0.42;
    for (var t = lo; t <= hi; t += step) s.push("seg=" + t + ",-0.12," + t + ",0.12,muted", "label=" + t + ",-0.62," + t);
    (pieces || []).forEach(function (p) {
      var a = p[0] === null ? lo - 0.5 : p[0], b = p[1] === null ? hi + 0.5 : p[1], yy = p[4] || y, c = p[5] || "def";
      s.push("fill=" + [a, yy - 0.13, b, yy - 0.13, b, yy + 0.13, a, yy + 0.13].map(N).join(",") + "," + c);
      s.push(p[0] === null ? "vec=" + N(a + 0.4) + "," + N(yy) + "," + N(a) + "," + N(yy) + "," + c : (p[2] ? "pt=" : "hole=") + N(p[0]) + "," + N(yy));
      s.push(p[1] === null ? "vec=" + N(b - 0.4) + "," + N(yy) + "," + N(b) + "," + N(yy) + "," + c : (p[3] ? "pt=" : "hole=") + N(p[1]) + "," + N(yy));
    });
    return s.concat(extra || []).join("; ");
  }
  function ucirc(deg, lab) {
    var t = deg * Math.PI / 180, X = Math.cos(t), Y = Math.sin(t);
    return "x=-1.45..1.45; y=-1.3..1.3; aspect=equal; circle=0,0,1; seg=0,0," + N(X) + ",0,prf; seg=" + N(X) + ",0," + N(X) + "," + N(Y) + ",thm; vec=" + N(X) + "," + N(Y) + ",ex; pt=" + N(X) + "," + N(Y) + (lab ? "; label=" + N(X * 1.25) + "," + N(Y * 1.2 - 0.04) + "," + lab : "");
  }
  function rtri(w, h, lb, lr, lh, la) {         // right angle at [w, 0]; labels: bottom, right, hypotenuse, angle at [0, 0]
    var p = Math.max(w, h) * 0.2, m = Math.min(w, h) * 0.12;
    var s = ["x=" + N(-p) + ".." + N(w + p), "y=" + N(-p) + ".." + N(h + p), "aspect=equal", "axes=off",
      "seg=0,0," + N(w) + ",0,ink", "seg=" + N(w) + ",0," + N(w) + "," + N(h) + ",ink", "seg=0,0," + N(w) + "," + N(h) + ",ink",
      "seg=" + N(w - m) + ",0," + N(w - m) + "," + N(m) + ",thm", "seg=" + N(w - m) + "," + N(m) + "," + N(w) + "," + N(m) + ",thm"];
    if (lb) s.push("label=" + N(w / 2) + "," + N(-p * 0.55) + "," + lb);
    if (lr) s.push("label=" + N(w + p * 0.45) + "," + N(h / 2) + "," + lr);
    if (lh) s.push("label=" + N(w / 2 - p * 0.45) + "," + N(h / 2 + p * 0.35) + "," + lh);
    if (la) s.push("label=" + N(Math.min(w, h) * 0.55 + 0.25 * w) + "," + N(h * 0.08) + "," + la);
    return s.join("; ");
  }
  function dice(fav) {
    var s = ["x=-0.2..7", "y=-0.2..7", "aspect=equal", "axes=off", "seg=0.6,0.6,6.6,0.6,muted", "seg=0.6,0.6,0.6,6.6,muted"];
    for (var a = 1; a <= 6; a++) {
      s.push("label=" + a + ",0.25," + a, "label=0.3," + (a - 0.12) + "," + a);
      for (var b = 1; b <= 6; b++) {
        if (fav(a, b)) s.push("fill=" + [a - 0.4, b - 0.4, a + 0.4, b - 0.4, a + 0.4, b + 0.4, a - 0.4, b + 0.4].map(N).join(",") + ",ex");
        s.push("pt=" + a + "," + b);
      }
    }
    return s.join("; ");
  }
  function sh(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pt2(x, y) { return "[" + x + ", " + y + "]"; }
  function sgn0(n) { return n === 0 ? "" : sgn(n); }
  function genLine(a, b, c) {                    // "ax + by + c = 0" in TeX
    var s = "";
    [[a, "x"], [b, "y"], [c, ""]].forEach(function (t) {
      if (!t[0]) return;
      var v = Math.abs(t[0]), body = (v === 1 && t[1] ? "" : v) + t[1];
      s += s ? (t[0] < 0 ? " - " : " + ") + body : (t[0] < 0 ? "-" : "") + body;
    });
    return (s || "0") + " = 0";
  }

  // ==== Výroky a množiny ======================================================================
  G.hs_truth = function () {
    var A = Math.random() < 0.5, B = Math.random() < 0.5;
    var F = pick([
      ["A\\wedge B", function (a, b) { return a && b; }], ["A\\vee B", function (a, b) { return a || b; }],
      ["A\\Rightarrow B", function (a, b) { return !a || b; }], ["A\\Leftrightarrow B", function (a, b) { return a === b; }],
      ["\\neg A\\vee B", function (a, b) { return !a || b; }], ["\\neg(A\\wedge B)", function (a, b) { return !(a && b); }],
      ["A\\Rightarrow\\neg B", function (a, b) { return !a || !b; }], ["(A\\vee B)\\Rightarrow A", function (a, b) { return !(a || b) || a; }],
      ["\\neg A\\Leftrightarrow B", function (a, b) { return !a === b; }], ["B\\Rightarrow A", function (a, b) { return !b || a; }]]);
    var v = F[1](A, B), w = function (x) { return x ? "pravdivý" : "nepravdivý"; };
    return tf(P("Výrok $A$ je " + w(A) + " a výrok $B$ je " + w(B) + ". Formule $" + F[0] + "$ je pravdivá."), v,
      "Dosadíme $A = " + (A ? 1 : 0) + "$ a $B = " + (B ? 1 : 0) + "$. Formule $" + F[0] + "$ má hodnotu $" + (v ? 1 : 0) + "$, je tedy " + (v ? "pravdivá" : "nepravdivá") + ".");
  };
  G.hs_neg_count = function () {
    var n = ri(2, 9), k = ri(0, 3), S = "Počet chybějících žáků je ";
    var forms = ["aspoň $" + n + "$", "nejvýše $" + n + "$", "menší než $" + n + "$", "větší než $" + n + "$"];
    var neg = ["nejvýše $" + (n - 1) + "$", "aspoň $" + (n + 1) + "$", "aspoň $" + n + "$", "nejvýše $" + n + "$"];
    var wrong = ["nejvýše $" + n + "$", "aspoň $" + n + "$", "menší než $" + n + "$", "větší než $" + n + "$", "nejvýše $" + (n + 1) + "$", "aspoň $" + (n - 1) + "$"]
      .filter(function (s) { return s !== neg[k] && s !== forms[k]; });
    return mc(P("Která věta je negací výroku „" + S + forms[k] + ".“?"), S + neg[k] + ".", sh(wrong).slice(0, 3).map(function (s) { return S + s + "."; }),
      "Negace popírá všechny počty, které výrok připouští, a připouští všechny ostatní. Opakem „" + forms[k] + "“ je „" + neg[k] + "“.");
  };
  G.hs_setop = function () {
    var A, B, I, Ao, Bo;
    do {
      A = []; B = [];
      for (var x = 1; x <= 9; x++) { var r = Math.random(); if (r < 0.3) A.push(x); else if (r < 0.55) B.push(x); else if (r < 0.75) { A.push(x); B.push(x); } }
      I = A.filter(function (v) { return B.indexOf(v) >= 0; }); Ao = A.filter(function (v) { return B.indexOf(v) < 0; }); Bo = B.filter(function (v) { return A.indexOf(v) < 0; });
    } while (!I.length || !Ao.length || !Bo.length);
    var k = ri(0, 3), op = ["A\\cap B", "A\\cup B", "A\\setminus B", "B\\setminus A"][k];
    var res = [I, A.concat(Bo).sort(function (a, b) { return a - b; }), Ao, Bo][k], key = ["AB", "U", "A-B", "B-A"][k];
    var why = ["prvky, které leží v obou množinách", "prvky, které leží aspoň v jedné z množin", "prvky $A$, které nejsou v $B$", "prvky $B$, které nejsou v $A$"][k];
    return withFig(VENN[key] + "; label=-1.465,-0.08," + lst(Ao) + "; label=0,-0.08," + lst(I) + "; label=1.465,-0.08," + lst(Bo),
      set(P("Pro $A = \\{" + lst(A) + "\\}$ a $B = \\{" + lst(B) + "\\}$ určete $" + op + "$."), setS(res),
        "$" + op + "$ jsou " + why + ": $\\{" + lst(res) + "\\}$."));
  };
  G.hs_ivl_op = function () {
    var a = ri(-7, -2), c = ri(a + 1, 1), b = ri(c + 1, 4), d = ri(b + 1, 7), ca = pick([true, false]), cb = pick([true, false]), cc = pick([true, false]), cd = pick([true, false]);
    var cap = Math.random() < 0.6, ans_ = cap ? iv(c, b, cc, cb) : iv(a, d, ca, cd);
    var fig = nl(a - 1, d + 1, [[a, b, ca, cb], [c, d, cc, cd, 0.81, "ex"]]);
    return withFig(fig, ivl(P("Pro $A = " + ivT(a, b, ca, cb) + "$ a $B = " + ivT(c, d, cc, cd) + "$ určete $A" + (cap ? "\\cap" : "\\cup") + " B$."), ans_,
      cap ? "Společná část začíná v $" + c + "$ (krajní bod rozhoduje $B$) a končí v $" + b + "$ (rozhoduje $A$): $A\\cap B = " + ivT(c, b, cc, cb) + "$."
        : "Intervaly se překrývají, sjednocení vede od $" + a + "$ do $" + d + "$: $A\\cup B = " + ivT(a, d, ca, cd) + "$."));
  };
  G.hs_nl_read = function () {
    var k = ri(0, 3), a = ri(-4, 1), b = ri(a + 1, 4), ca = pick([true, false]), cb = pick([true, false]), pieces, an, at;
    if (k === 0) { pieces = [[a, b, ca, cb]]; an = iv(a, b, ca, cb); at = ivT(a, b, ca, cb); }
    else if (k === 1) { pieces = [[null, b, false, cb]]; an = iv(null, b, false, cb); at = ivT(null, b, false, cb); }
    else if (k === 2) { pieces = [[a, null, ca, false]]; an = iv(a, null, ca, false); at = ivT(a, null, ca, false); }
    else { pieces = [[null, a, false, ca], [b, null, cb, false]]; an = iv(null, a, false, ca) + " ∪ " + iv(b, null, cb, false); at = ivT(null, a, false, ca) + "\\cup" + ivT(b, null, cb, false); }
    return figQ(nl(-5, 5, pieces), ivl(P("Která množina je na obrázku? Zapište ji jako interval nebo sjednocení intervalů."), an,
      "Plný bod do množiny patří, prázdný ne, a šipka znamená nekonečno. Na obrázku je $" + at + "$."));
  };

  // ==== Rovnice a nerovnice ===================================================================
  G.hs_lin2 = function () {
    var x = ri(-8, 8), a = nz(-5, 5), b = nz(-6, 6), c; do { c = nz(-5, 5); } while (c === a);
    var d = a * (x + b) - c * x;
    return inp(P("Vyřešte $" + a + "(" + poly([[1, 1], [b, 0]]) + ") = " + poly([[c, 1], [d, 0]]) + "$."), String(x),
      "Roznásobíme: $" + poly([[a, 1], [a * b, 0]]) + " = " + poly([[c, 1], [d, 0]]) + "$, tedy $" + poly([[a - c, 1]]) + " = " + (d - a * b) + "$ a $x = " + x + "$.");
  };
  G.hs_lin_frac = function () {
    var p = pick([2, 3, 4, 5, 6]), q; do { q = pick([2, 3, 4, 5, 6]); } while (q === p);
    var L = p * q / gcd(p, q), x = L * nz(-3, 3), r = x / p + x / q;
    return inp(P("Vyřešte $\\dfrac x{" + p + "} + \\dfrac x{" + q + "} = " + r + "$."), String(x),
      "Vynásobíme $" + L + "$: $" + poly([[L / p, 1]]) + " + " + poly([[L / q, 1]]) + " = " + r * L + "$, tedy $" + (L / p + L / q) + "x = " + r * L + "$ a $x = " + x + "$.");
  };
  G.hs_quad_a = function () {
    var a = pick([2, 3]), p, q = ri(-5, 5);
    do { p = nz(-7, 7); } while (p % a === 0);
    var A = a, B = -(a * q + p), C = p * q, r = fr(p, a);
    return set(P("Vyřešte $" + poly([[A, 2], [B, 1], [C, 0]]) + " = 0$."), setS([fs(r), String(q)]),
      "Rozklad $(" + poly([[a, 1], [-p, 0]]) + ")" + lin(q) + " = 0$, tedy $x = " + ft(r) + "$ nebo $x = " + q + "$.");
  };
  G.hs_disc = function () {
    var k = ri(0, 2), a = pick([1, 1, 2, -1]), m = ri(-3, 3), s, B, C, cnt;
    if (k === 0) { s = ri(1, 4); B = -2 * a * m; C = a * (m * m + s); cnt = 0; }
    else if (k === 1) { B = -2 * a * m; C = a * m * m; cnt = 1; }
    else { s = ri(1, 3); B = -2 * a * m; C = a * (m * m - s * s); cnt = 2; }
    var D = B * B - 4 * a * C, top = Math.max(Math.abs(C - a * m * m), 2) + 3;
    return withFig(gr(m - 4, m + 4, Math.min(-top, C - a * m * m - 2), Math.max(top, C - a * m * m + 2), ["f=" + a + "*x^2+(" + B + ")*x+(" + C + ")"]),
      inp(P("Kolik reálných řešení má rovnice $" + poly([[a, 2], [B, 1], [C, 0]]) + " = 0$?"), String(cnt),
        "$D = " + par(B) + "^2 - 4\\cdot" + par(a) + "\\cdot" + par(C) + " = " + D + "$, " + (D > 0 ? "kladný: dvě řešení" : D === 0 ? "nulový: jedno řešení" : "záporný: žádné reálné řešení") + ". Počet řešení je $" + cnt + "$."));
  };
  G.hs_vieta = function () {
    var r1 = nz(-6, 6), r2 = nz(-6, 6), p = -(r1 + r2), q = r1 * r2;
    if (Math.random() < 0.5) return inp(P("Rovnice $x^2 + px " + sgn(q) + " = 0$ má jeden kořen $" + r1 + "$. Určete druhý kořen."), String(r2),
      "Součin kořenů je $" + q + "$, takže $" + par(r1) + "\\cdot x_2 = " + q + "$ a $x_2 = " + r2 + "$.");
    return inp(P("Rovnice $x^2 + px " + sgn(q) + " = 0$ má jeden kořen $" + r1 + "$. Určete $p$."), String(p),
      "Druhý kořen je $\\frac{" + q + "}{" + r1 + "} = " + r2 + "$ a součet kořenů je $-p = " + (r1 + r2) + "$, tedy $p = " + p + "$.");
  };
  G.hs_vieta_sym = function () {
    var s, p; do { s = ri(-6, 6); p = nz(-8, 8); } while (s * s - 4 * p <= 0);
    if (Math.random() < 0.5) return inp(P("Rovnice $" + poly([[1, 2], [-s, 1], [p, 0]]) + " = 0$ má kořeny $x_1$, $x_2$. Určete $x_1^2 + x_2^2$ bez řešení rovnice."), String(s * s - 2 * p),
      "$x_1 + x_2 = " + s + "$ a $x_1x_2 = " + p + "$, takže $x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1x_2 = " + (s * s) + sgn(-2 * p) + " = " + (s * s - 2 * p) + "$.");
    return inp(P("Rovnice $" + poly([[1, 2], [-s, 1], [p, 0]]) + " = 0$ má kořeny $x_1$, $x_2$. Určete $\\dfrac1{x_1} + \\dfrac1{x_2}$ bez řešení rovnice."), frAns(s, p),
      "$\\frac1{x_1} + \\frac1{x_2} = \\frac{x_1 + x_2}{x_1x_2} = \\frac{" + s + "}{" + p + "} = " + frTeX(s, p) + "$.");
  };
  G.hs_minval = function () {
    var b = nz(-7, 7), c = ri(-5, 8), m = fr(-b, 2), mn = fr(4 * c - b * b, 4);
    return withFig(gr(-b / 2 - 4, -b / 2 + 4, Math.min(-1, mn.p / mn.q - 1), Math.max(6, mn.p / mn.q + 8), ["f=x^2+(" + b + ")*x+(" + c + ")", "pt=" + N(-b / 2) + "," + N(mn.p / mn.q)]),
      inp(P("Určete nejmenší hodnotu trojčlenu $" + poly([[1, 2], [b, 1], [c, 0]]) + "$."), ans(mn),
        "Doplníme na čtverec: $\\left(x " + (b > 0 ? "+" : "-") + " " + ft(fr(Math.abs(b), 2)) + "\\right)^2 " + (mn.p < 0 ? "-" : "+") + " " + ft(fr(Math.abs(mn.p), mn.q)) + "$. Nejmenší hodnota, pro $x = " + ft(m) + "$, je $" + ft(mn) + "$."));
  };
  G.hs_quad_ineq = function () {
    var p = ri(-5, 3), q = ri(p + 1, 6), rel = pick(["<", ">", "\\le", "\\ge"]), inside = rel === "<" || rel === "\\le", cl = rel === "\\le" || rel === "\\ge";
    var res = inside ? iv(p, q, cl, cl) : iv(null, p, false, cl) + " ∪ " + iv(q, null, cl, false);
    return withFig(gr(p - 2, q + 2, -((q - p) * (q - p)) / 4 - 1, 6, ["f=(x-(" + p + "))*(x-(" + q + "))", "pt=" + p + ",0", "pt=" + q + ",0"]),
      ivl(P("Vyřešte $" + poly([[1, 2], [-(p + q), 1], [p * q, 0]]) + " " + rel + " 0$."), res,
        "$" + lin(p) + lin(q) + "$ je parabola otevřená nahoru s kořeny $" + p + "$ a $" + q + "$. " + (inside ? "Pod osou je mezi kořeny" : "Nad osou je vně kořenů") + (cl ? ", kořeny patří do řešení" : "") + ": $" + res.replace(/; /g, ", ").replace(/∞/g, "\\infty").replace(/∪/g, "\\cup") + "$."));
  };
  G.hs_frac_ineq = function () {
    var p, q; do { p = ri(-5, 5); q = ri(-5, 5); } while (p === q);
    var rel = pick(["<", ">", "\\le", "\\ge"]), neg = rel === "<" || rel === "\\le", cl = rel === "\\le" || rel === "\\ge";
    var lo = Math.min(p, q), hi = Math.max(p, q), clLo = cl && lo === p, clHi = cl && hi === p;
    var res = neg ? iv(lo, hi, clLo, clHi) : iv(null, lo, false, clLo) + " ∪ " + iv(hi, null, clHi, false);
    return ivl(P("Vyřešte $\\dfrac{" + poly([[1, 1], [-p, 0]]) + "}{" + poly([[1, 1], [-q, 0]]) + "} " + rel + " 0$."), res,
      "Nulové body jsou $" + p + "$ (čitatel) a $" + q + "$ (jmenovatel, ten do řešení nikdy nepatří). Podíl je záporný mezi nimi a kladný vně: $" + res.replace(/; /g, ", ").replace(/∞/g, "\\infty").replace(/∪/g, "\\cup") + "$.");
  };

  // ==== Další rovnice a soustavy ==============================================================
  G.hs_abs_eq = function () {
    var a = pick([1, 1, 2, 3]), b = ri(-6, 6), c = ri(1, 8);
    if (Math.random() < 0.1) return set(P("Vyřešte $|" + poly([[a, 1], [b, 0]]) + "| = -" + c + "$."), "∅", "Absolutní hodnota není nikdy záporná, rovnice nemá řešení.");
    var x1 = fr(c - b, a), x2 = fr(-c - b, a);
    return set(P("Vyřešte $|" + poly([[a, 1], [b, 0]]) + "| = " + c + "$."), setS([fs(x1), fs(x2)]),
      "$" + poly([[a, 1], [b, 0]]) + " = " + c + "$ nebo $" + poly([[a, 1], [b, 0]]) + " = -" + c + "$, tedy $x = " + ft(x1) + "$ nebo $x = " + ft(x2) + "$.");
  };
  G.hs_abs_ineq = function () {
    var m = ri(-4, 4), r = ri(1, 5), rel = pick(["<", "\\le", ">", "\\ge"]), inside = rel === "<" || rel === "\\le", cl = rel === "\\le" || rel === "\\ge";
    var res = inside ? iv(m - r, m + r, cl, cl) : iv(null, m - r, false, cl) + " ∪ " + iv(m + r, null, cl, false);
    var pieces = inside ? [[m - r, m + r, cl, cl]] : [[null, m - r, false, cl], [m + r, null, cl, false]];
    return withFig(nl(m - r - 2, m + r + 2, pieces), ivl(P("Vyřešte $|" + poly([[1, 1], [-m, 0]]) + "| " + rel + " " + r + "$."), res,
      "$|x " + (m < 0 ? "+ " + (-m) : "- " + m) + "|$ je vzdálenost $x$ od čísla $" + m + "$. Ta je " + (inside ? "menší" : "větší") + " než $" + r + "$ " + (inside ? "mezi" : "vně") + " body $" + (m - r) + "$ a $" + (m + r) + "$" + (cl ? " (včetně nich)" : "") + "."));
  };
  G.hs_sqrt_eq = function () {
    var b, r, s, a;
    do { b = ri(-3, 3); r = ri(Math.max(-b, 2 - b), 5 - b); s = 1 - 2 * b - r; a = b * b - r * s; } while (r === s);
    var ok = [r].concat(s + b >= 0 ? [s] : []), bad = s + b < 0;
    return set(P("Vyřešte $\\sqrt{" + poly([[1, 1], [a, 0]]) + "} = " + poly([[1, 1], [b, 0]]) + "$."), setS(ok.map(String)),
      "Po umocnění $" + poly([[1, 1], [a, 0]]) + " = (" + poly([[1, 1], [b, 0]]) + ")^2$, tedy $" + poly([[1, 2], [2 * b - 1, 1], [b * b - a, 0]]) + " = 0$ s kořeny $" + r + "$ a $" + s + "$. " +
      (bad ? "Pro $x = " + s + "$ je pravá strana záporná, zkouškou neprojde. Řešení je $x = " + r + "$." : "Oba kořeny zkouškou projdou."));
  };
  G.hs_frac_eq = function () {
    var a, b, c = pick([-3, -2, 2, 3, 4]); do { a = ri(-6, 6); b = ri(-6, 6); } while (a === b);
    var x = fr(c * b - a, 1 - c);
    return set(P("Vyřešte $\\dfrac{" + poly([[1, 1], [a, 0]]) + "}{" + poly([[1, 1], [b, 0]]) + "} = " + c + "$."), fs(x),
      "Podmínka $x\\ne" + (-b) + "$. Vynásobíme jmenovatelem: $" + poly([[1, 1], [a, 0]]) + " = " + poly([[c, 1], [c * b, 0]]) + "$, tedy $x = " + ft(x) + "$, a to podmínku splňuje.");
  };
  G.hs_sys2 = function () {
    var x = ri(-4, 4), y = ri(-4, 4), a1, b1, a2, b2;
    do { a1 = nz(-4, 4); b1 = nz(-4, 4); a2 = nz(-4, 4); b2 = nz(-4, 4); } while (a1 * b2 - a2 * b1 === 0);
    var c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y, t = function (u, v) { return "$" + pt2(u, v) + "$"; };
    var lo = Math.min(x, y, 0) - 3, hi = Math.max(x, y, 0) + 3;
    return withFig(gr(lo, hi, lo, hi, ["f=(" + c1 + "-(" + a1 + ")*x)/(" + b1 + ")", "f=(" + c2 + "-(" + a2 + ")*x)/(" + b2 + ")", "pt=" + x + "," + y], true),
      mc(P("Vyřešte soustavu $" + genLine(a1, b1, 0).replace(" = 0", "") + " = " + c1 + "$, $" + genLine(a2, b2, 0).replace(" = 0", "") + " = " + c2 + "$."), t(x, y),
        [t(y, x), t(-x, y), t(x, -y), t(x + 1, y), t(x, y - 1)].filter(function (s) { return s !== t(x, y); }).slice(0, 3),
        "Sčítací nebo dosazovací metodou vyjde $x = " + x + "$, $y = " + y + "$; dosazením do obou rovnic to ověříme. Přímky se protínají v bodě $" + pt2(x, y) + "$."));
  };
  G.hs_word_pct = function () {
    var p = 10 * ri(1, 5), q = 10 * ri(1, 5), up = Math.random() < 0.5;
    var f1 = up ? 100 + p : 100 - p, f2 = up ? 100 - q : 100 + q, res = f1 * f2 / 100 - 100;
    return inp(P("Cena zboží nejprve " + (up ? "vzrostla" : "klesla") + " o $" + (up ? p : p) + "\\,\\%$, potom " + (up ? "klesla" : "vzrostla") + " o $" + q + "\\,\\%$. O kolik procent se celkem změnila? (Pokles zapište záporně.)"), String(res),
      "$" + cz(f1 / 100) + "\\cdot" + cz(f2 / 100) + " = " + cz(f1 * f2 / 10000) + "$, cena se změnila o $" + res + "\\,\\%$.");
  };
  G.hs_word_mix = function () {
    var v1 = ri(1, 6) * 5, v2 = ri(1, 6) * 5, p1 = ri(1, 9) * 10, p2; do { p2 = ri(1, 9) * 10; } while (p2 === p1);
    var r = fr(v1 * p1 + v2 * p2, v1 + v2);
    return inp(P("Smícháme $" + v1 + "$ litrů $" + p1 + "\\%$ roztoku a $" + v2 + "$ litrů $" + p2 + "\\%$ roztoku. Kolikaprocentní roztok vznikne?"), ans(r),
      "Účinné látky je $" + cz(v1 * p1 / 100) + " + " + cz(v2 * p2 / 100) + "$ litru v $" + (v1 + v2) + "$ litrech, tedy $" + ft(r) + "\\,\\%$.");
  };
  G.hs_word_work = function () {
    var a = ri(2, 9), b; do { b = ri(2, 12); } while (b === a);
    var r = fr(a * b, a + b);
    return inp(P("Jeden dělník udělá práci sám za $" + a + "$ h, druhý za $" + b + "$ h. Za kolik hodin ji udělají spolu?"), ans(r),
      "Za hodinu udělají $\\frac1{" + a + "} + \\frac1{" + b + "} = " + frTeX(a + b, a * b) + "$ práce, celou za $" + ft(r) + "$ hodiny.");
  };
  G.hs_word_meet = function () {
    var v1 = ri(4, 12) * 5, v2 = ri(4, 12) * 5, t = fr(ri(1, 8), pick([1, 2, 4])), d = (v1 + v2) * t.p / t.q;
    if (d !== Math.round(d)) return G.hs_word_meet();
    return inp(P("Dvě místa jsou od sebe $" + d + "$ km. Proti sobě vyjedou současně auta rychlostmi $" + v1 + "$ km/h a $" + v2 + "$ km/h. Za kolik hodin se potkají?"), ans(t),
      "Vzdálenost se zmenšuje o $" + (v1 + v2) + "$ km za hodinu: $\\frac{" + d + "}{" + (v1 + v2) + "} = " + ft(t) + "$ hodiny.");
  };
  G.hs_param_lin = function () {
    var k = nz(-6, 6);
    if (Math.random() < 0.5) return expr(P("Vyřešte rovnici $x(a " + (k < 0 ? "+ " + (-k) : "- " + k) + ") = a^2 - " + (k * k) + "$ s neznámou $x$ pro $a\\ne" + k + "$. Zapište $x$ pomocí $a$."), "a" + sgn(k),
      "$a^2 - " + k * k + " = (a " + (k < 0 ? "+ " + (-k) : "- " + k) + ")(a " + (k < 0 ? "- " + (-k) : "+ " + k) + ")$ a vydělíme $a " + (k < 0 ? "+ " + (-k) : "- " + k) + "\\ne0$: $x = a" + sgn(k) + "$.", ["var=a"], "$x = a" + sgn(k) + "$");
    var m = nz(-9, 9);
    return inp(P("Pro které $a$ nemá rovnice $x(a " + (k < 0 ? "+ " + (-k) : "- " + k) + ") = " + m + "$ s neznámou $x$ řešení?"), String(k),
      "Pro $a = " + k + "$ dostaneme $0\\cdot x = " + m + "$, což neplatí pro žádné $x$. Jinak je $x = \\frac{" + m + "}{a - " + par(k) + "}$. Řešení nemá pro $a = " + k + "$.");
  };
  G.hs_param_disc = function () {
    var b = nz(-8, 8), c = fr(b * b, 4);
    if (Math.random() < 0.5) return inp(P("Pro které $c$ má rovnice $x^2 " + sgn(b) + "x + c = 0$ dvojnásobný kořen?"), ans(c),
      "Dvojnásobný kořen je pro $D = " + (b * b) + " - 4c = 0$, tedy $c = " + ft(c) + "$.");
    return ivl(P("Pro která $c$ nemá rovnice $x^2 " + sgn(b) + "x + c = 0$ žádné reálné řešení?"), iv(fs(c), null, false, false),
      "Potřebujeme $D = " + (b * b) + " - 4c < 0$, tedy $c > " + ft(c) + "$.");
  };

  // ==== Funkce ================================================================================
  G.hs_domain = function () {
    var k = ri(0, 3), p = ri(-5, 3), q = ri(p + 1, 6), a = pick([1, 2, 3, -1, -2]), b = ri(-6, 6), z = fr(-b, a);
    if (k === 0) return ivl(P("Určete definiční obor funkce $f(x) = \\sqrt{" + poly([[a, 1], [b, 0]]) + "}$."), a > 0 ? iv(fs(z), null, true, false) : iv(null, fs(z), false, true),
      "Odmocnina potřebuje $" + poly([[a, 1], [b, 0]]) + "\\ge0$, tedy $x" + (a > 0 ? "\\ge" : "\\le") + ft(z) + "$" + (a < 0 ? " (dělili jsme záporným číslem)" : "") + ".");
    if (k === 1) return ivl(P("Určete definiční obor funkce $f(x) = \\ln(" + poly([[a, 1], [b, 0]]) + ")$."), a > 0 ? iv(fs(z), null, false, false) : iv(null, fs(z), false, false),
      "Logaritmus potřebuje $" + poly([[a, 1], [b, 0]]) + " > 0$, tedy $x" + (a > 0 ? ">" : "<") + ft(z) + "$.");
    if (k === 2) return ivl(P("Určete definiční obor funkce $f(x) = \\dfrac{1}{" + lin(p) + lin(q) + "}$."), iv(null, p, false, false) + " ∪ " + iv(p, q, false, false) + " ∪ " + iv(q, null, false, false),
      "Jmenovatel je nulový pro $x = " + p + "$ a $x = " + q + "$, definiční obor je $\\mathbb R\\setminus\\{" + p + ", " + q + "\\}$.");
    return ivl(P("Určete definiční obor funkce $f(x) = \\sqrt{" + poly([[1, 2], [-(p + q), 1], [p * q, 0]]) + "}$."), iv(null, p, false, true) + " ∪ " + iv(q, null, true, false),
      "$" + poly([[1, 2], [-(p + q), 1], [p * q, 0]]) + " = " + lin(p) + lin(q) + "\\ge0$ vně kořenů a v nich: $x\\le" + p + "$ nebo $x\\ge" + q + "$.");
  };
  G.hs_parity = function () {
    var k = ri(0, 2), c = function () { return nz(-4, 4); }, f;
    if (k === 0) f = pick([poly([[c(), 4], [c(), 2], [ri(-5, 5), 0]]), poly([[c(), 2], [ri(-5, 5), 0]]), "|x| " + sgn(nz(-5, 5)), "\\cos x " + sgn(nz(-3, 3)), "x^2|x|"]);
    else if (k === 1) f = pick([poly([[c(), 3], [c(), 1]]), poly([[c(), 5], [c(), 1]]), "x|x|", "\\sin x", "\\frac{" + nz(1, 5) + "}{x}", "x^3\\cos x"]);
    else f = pick([poly([[c(), 2], [c(), 1]]), poly([[c(), 3], [nz(1, 5), 0]]), "|x " + sgn(nz(-3, 3)) + "|", "2^x", "\\sin x + \\cos x", "x^2 + x^3"]);
    var names = ["sudá", "lichá", "ani sudá, ani lichá"];
    return mc(P("Je funkce $f(x) = " + f + "$ sudá, nebo lichá?"), names[k], names.filter(function (_, i) { return i !== k; }),
      ["Dosazením $-x$ se výraz nezmění: $f(-x) = f(x)$. Funkce je sudá.", "Dosazením $-x$ změní výraz znaménko: $f(-x) = -f(x)$. Funkce je lichá.", "Pro $x = 1$ a $x = -1$ vyjdou hodnoty, které nejsou stejné ani opačné. Funkce není sudá ani lichá."][k]);
  };
  G.hs_range_quad = function () {
    var a = pick([1, 2, -1, -2, 3]), m = ri(-3, 3), n = ri(-5, 5);
    var res = a > 0 ? iv(n, null, true, false) : iv(null, n, false, true);
    return withFig(gr(m - 3, m + 3, n - 6, n + 6, ["f=" + a + "*(x-(" + m + "))^2+(" + n + ")", "pt=" + m + "," + n, "hline=" + n]),
      ivl(P("Určete obor hodnot funkce $f(x) = " + (a === 1 ? "" : a === -1 ? "-" : a) + lin(m) + "^2" + sgn0(n) + "$."), res,
        "Vrchol je $[" + m + ", " + n + "]$ a parabola je otevřená " + (a > 0 ? "nahoru, hodnoty jsou aspoň" : "dolů, hodnoty jsou nejvýše") + " $" + n + "$: $" + ivT(a > 0 ? n : null, a > 0 ? null : n, true, true) + "$."));
  };
  G.hs_parab_pick = function () {
    var a = pick([1, -1, 2, -2]), m = nz(-2, 2), n = nz(-2, 2), W = function (A, M, Nn) { return "@ " + gr(-5, 5, -5, 5, ["f=" + A + "*(x-(" + M + "))^2+(" + Nn + ")", "pt=" + M + "," + Nn]); };
    var eq = (a === 1 ? "" : a === -1 ? "-" : a) + "(x " + (m < 0 ? "+ " + (-m) : "- " + m) + ")^2 " + sgn(n);
    return mc(P("Který graf patří funkci $y = " + eq + "$?"), W(a, m, n), [W(a, -m, n), W(a, m, -n), W(-a, m, n)],
      "Vrchol je $[" + m + ", " + n + "]$ a parabola je otevřená " + (a > 0 ? "nahoru" : "dolů") + ".");
  };
  G.hs_line_pick = function () {
    var k = pick([1, 2, -1, -2, 0.5, -0.5]), q = nz(-3, 3), W = function (K, Q) { return "@ " + gr(-4, 4, -4, 4, ["f=" + K + "*x+(" + Q + ")"]); };
    var kt = k === 0.5 ? "\\frac12" : k === -0.5 ? "-\\frac12" : k === 1 ? "" : k === -1 ? "-" : String(k);
    return mc(P("Který graf patří funkci $y = " + kt + "x " + sgn(q) + "$?"), W(k, q), [W(-k, q), W(k, -q), W(-k, -q)],
      "Přímka protíná osu $y$ v bodě $" + q + "$ a je " + (k > 0 ? "rostoucí" : "klesající") + " se směrnicí $" + cz(k) + "$.");
  };
  G.hs_slope = function () {
    var x1 = ri(-5, 3), x2, y1 = ri(-5, 5), y2 = ri(-5, 5); do { x2 = ri(-5, 6); } while (x2 === x1);
    var k = fr(y2 - y1, x2 - x1);
    return withFig(gr(Math.min(x1, x2) - 2, Math.max(x1, x2) + 2, Math.min(y1, y2) - 2, Math.max(y1, y2) + 2, ["pt=" + x1 + "," + y1, "pt=" + x2 + "," + y2, "line=" + x1 + "," + y1 + "," + x2 + "," + y2 + ",def"]),
      inp(P("Určete směrnici přímky procházející body $" + pt2(x1, y1) + "$ a $" + pt2(x2, y2) + "$."), ans(k),
        "$k = \\frac{" + y2 + " - " + par(y1) + "}{" + x2 + " - " + par(x1) + "} = " + fq(y2 - y1, x2 - x1) + "$."));
  };
  G.hs_shift_expr = function () {
    var base = pick([["x^2", "x^2", function (u) { return "(" + u + ")^2"; }, function (u) { return "(" + u + ")^2"; }], ["|x|", "|x|", function (u) { return "|" + u + "|"; }, function (u) { return "|" + u + "|"; }]]);
    var a = nz(-4, 4), b = nz(-4, 4);
    var u = "x" + sgn(-a);
    return expr(P("Graf funkce $y = " + base[0] + "$ posuneme o $" + Math.abs(a) + "$ " + (a > 0 ? "doprava" : "doleva") + " a o $" + Math.abs(b) + "$ " + (b > 0 ? "nahoru" : "dolů") + ". Napište předpis nové funkce."),
      base[3](u.replace(/ /g, "")) + (b > 0 ? "+" + b : String(b)),
      "Posun " + (a > 0 ? "doprava" : "doleva") + " o $" + Math.abs(a) + "$ znamená dosadit $" + u + "$ místo $x$, posun " + (b > 0 ? "nahoru" : "dolů") + " přičíst $" + b + "$: $y = " + base[2](u) + " " + sgn(b) + "$.", [], "$y = " + base[2](u) + " " + sgn(b) + "$");
  };
  G.hs_compose = function () {
    var a = nz(-3, 3), b = ri(-4, 4), p = nz(-2, 2), q = ri(-4, 4), c = ri(-3, 3), first = Math.random() < 0.5;
    var f = function (x) { return a * x + b; }, g = function (x) { return p * x * x + q; };
    var v = first ? f(g(c)) : g(f(c));
    return inp(P("Je-li $f(x) = " + poly([[a, 1], [b, 0]]) + "$ a $g(x) = " + poly([[p, 2], [q, 0]]) + "$, kolik je $" + (first ? "f(g(" + c + "))" : "g(f(" + c + "))") + "$?"), String(v),
      first ? "$g(" + c + ") = " + g(c) + "$ a $f(" + g(c) + ") = " + v + "$." : "$f(" + c + ") = " + f(c) + "$ a $g(" + f(c) + ") = " + v + "$.");
  };
  G.hs_inv_val = function () {
    var a = nz(-5, 5), b = ri(-6, 6), t = ri(-5, 5), c = a * t + b;
    return withFig(gr(-8, 8, -8, 8, ["f=" + a + "*x+(" + b + ")", "f=(x-(" + b + "))/(" + a + ")", "line=0,0,1,1,muted"], true),
      inp(P("Je-li $f(x) = " + poly([[a, 1], [b, 0]]) + "$, kolik je $f^{-1}(" + c + ")$?"), String(t),
        "Hledáme $x$, pro které $" + poly([[a, 1], [b, 0]]) + " = " + c + "$: $x = " + t + "$."));
  };

  // ==== Mocniny a odmocniny ===================================================================
  G.hs_pow_mix = function () {
    var m = ri(2, 5), n = ri(2, 4), k = ri(1, 9), e = m * n - k;
    return inp(P("Zapište $\\dfrac{(x^{" + m + "})^{" + n + "}}{x^{" + k + "}}$ (pro $x\\ne0$) jako $x^e$. Kolik je $e$?"), String(e),
      "$(x^{" + m + "})^{" + n + "} = x^{" + m * n + "}$ a při dělení exponenty odečteme: $e = " + m * n + " - " + k + " = " + e + "$.");
  };
  G.hs_sqrt_part = function () {
    var m = pick([2, 3, 5, 6, 7, 10]), k = ri(2, 9), n = k * k * m;
    return inp(P("Částečně odmocněte $\\sqrt{" + n + "}$."), k + "√" + m + "; " + r4(Math.sqrt(n)),
      "$" + n + " = " + k * k + "\\cdot" + m + "$, tedy $\\sqrt{" + n + "} = \\sqrt{" + k * k + "}\\cdot\\sqrt{" + m + "} = " + k + "\\sqrt{" + m + "}$.");
  };
  G.hs_sqrt_sum = function () {
    var m = pick([2, 3, 5]), a = ri(1, 5), b = ri(1, 5), c = ri(1, 4), t = a + b - c;
    if (t === 0) return G.hs_sqrt_sum();
    var term = function (k) { return "\\sqrt{" + k * k * m + "}"; };
    return inp(P("Upravte $" + term(a) + " + " + term(b) + " - " + term(c) + "$."), t === 1 ? "√" + m + "; " + r4(Math.sqrt(m)) : t + "√" + m + "; " + r4(t * Math.sqrt(m)),
      "$" + term(a) + " = " + (a === 1 ? "" : a) + "\\sqrt" + m + "$, podobně ostatní: $(" + a + " + " + b + " - " + c + ")\\sqrt" + m + " = " + (t === 1 ? "" : t) + "\\sqrt" + m + "$.");
  };
  G.hs_rationalize = function () {
    var n = ri(1, 4), m; do { m = ri(n * n + 1, n * n + 9); } while (sqf(m).m !== m || m - n * n === 0);
    var k = m - n * n, minus = Math.random() < 0.5;
    var den = "\\sqrt{" + m + "} " + (minus ? "-" : "+") + " " + n, res = "\\sqrt{" + m + "} " + (minus ? "+" : "-") + " " + n;
    return mc(P("Usměrněte zlomek $\\dfrac{" + k + "}{" + den + "}$."), "$" + res + "$",
      ["$" + den + "$", "$\\dfrac{" + res + "}{" + k + "}$", "$" + k + "(" + res + ")$"],
      "Rozšíříme $" + res + "$: jmenovatel je $" + m + " - " + n * n + " = " + k + "$ a zkrátí se s čitatelem. Výsledek je $" + res + "$.");
  };
  G.hs_pow_eq = function () {
    var n = ri(2, 5), r = ri(1, 4), neg = Math.random() < 0.35, c = (neg ? -1 : 1) * Math.pow(r, n);
    var sol = n % 2 === 0 ? (neg ? [] : [String(r), String(-r)]) : [String(neg ? -r : r)];
    return set(P("Vyřešte v $\\mathbb R$ rovnici $x^{" + n + "} = " + c + "$."), setS(sol),
      n % 2 === 0 ? (neg ? "Sudá mocnina není záporná, rovnice nemá řešení." : "$" + r + "^{" + n + "} = " + c + "$ a sudá mocnina nerozliší znaménko: $x = \\pm" + r + "$.")
        : "Lichá mocnina je prostá: jediné řešení je $x = " + sol[0] + "$.");
  };
  G.hs_hyp_asym = function () {
    var a = nz(-4, 4), b = ri(-5, 5), d = ri(-4, 4); if (b === a * d) b += 1;
    var vert = Math.random() < 0.5;
    var spec = gr(-d - 7, -d + 7, a - 7, a + 7, ["f=(" + a + "*x+(" + b + "))/(x+(" + d + "))", "vline=" + (-d), "hline=" + a]);
    return withFig(spec, inp(P("Graf funkce $y = \\dfrac{" + poly([[a, 1], [b, 0]]) + "}{" + poly([[1, 1], [d, 0]]) + "}$ má " + (vert ? "svislou asymptotu $x = c$" : "vodorovnou asymptotu $y = c$") + ". Určete $c$."), String(vert ? -d : a),
      vert ? "Jmenovatel je nulový pro $x = " + (-d) + "$, asymptota je $x = " + (-d) + "$." : "Pro velká $|x|$ rozhodují členy $" + poly([[a, 1]]) + "$ a $x$: asymptota je $y = " + a + "$."));
  };
  G.hs_hyp_pick = function () {
    var k = pick([1, -1, 2, -2]), m = nz(-2, 2), n = nz(-2, 2), W = function (K, M, Nn) { return "@ " + gr(-5, 5, -5, 5, ["f=" + K + "/(x-(" + M + "))+(" + Nn + ")", "vline=" + M, "hline=" + Nn]); };
    return mc(P("Který graf patří funkci $y = \\dfrac{" + k + "}{x " + (m < 0 ? "+ " + (-m) : "- " + m) + "} " + sgn(n) + "$?"), W(k, m, n), [W(-k, m, n), W(k, -m, n), W(k, m, -n)],
      "Asymptoty jsou $x = " + m + "$ a $y = " + n + "$; pro $k " + (k > 0 ? "> 0" : "< 0") + "$ leží větve " + (k > 0 ? "vpravo nahoře a vlevo dole" : "vlevo nahoře a vpravo dole") + " od středu $[" + m + ", " + n + "]$.");
  };

  // ==== Exponenciály a logaritmy ==============================================================
  G.hs_exp_eq2 = function () {
    var b = pick([2, 3, 5]), p = nz(-3, 3), q = ri(-3, 3), r = ri(-2, 4), x = fr(r - q, p), rhs = r >= 0 ? String(Math.pow(b, r)) : "\\frac1{" + Math.pow(b, -r) + "}";
    return inp(P("Vyřešte $" + b + "^{" + poly([[p, 1], [q, 0]]) + "} = " + rhs + "$."), ans(x),
      "$" + rhs + " = " + b + "^{" + r + "}$, takže $" + poly([[p, 1], [q, 0]]) + " = " + r + "$ a $x = " + ft(x) + "$.");
  };
  G.hs_exp_sub = function () {
    var b = pick([2, 3]), m = ri(0, 3), n; do { n = ri(0, 3); } while (n === m);
    var s = Math.pow(b, m) + Math.pow(b, n), p = Math.pow(b, m + n);
    return set(P("Vyřešte $" + (b * b) + "^x - " + s + "\\cdot" + b + "^x + " + p + " = 0$."), setS([String(m), String(n)]),
      "S $t = " + b + "^x$: $t^2 - " + s + "t + " + p + " = 0$, kořeny $t = " + Math.pow(b, m) + "$ a $t = " + Math.pow(b, n) + "$. Odtud $x = " + m + "$ nebo $x = " + n + "$.");
  };
  G.hs_log_eq = function () {
    var b = pick([2, 3, 5, 10]), k = ri(0, b === 10 ? 2 : 3), a = pick([1, 1, 2, 3]), c = ri(-6, 6), x = fr(Math.pow(b, k) - c, a);
    return inp(P("Vyřešte $\\log" + (b === 10 ? "" : "_{" + b + "}") + "(" + poly([[a, 1], [c, 0]]) + ") = " + k + "$."), ans(x),
      "Podle definice $" + poly([[a, 1], [c, 0]]) + " = " + b + "^{" + k + "} = " + Math.pow(b, k) + "$, tedy $x = " + ft(x) + "$ (argument je pak kladný).");
  };
  G.hs_exp_ineq = function () {
    var base = pick([[2, "2", 1], [3, "3", 1], [0.5, "\\frac12", 0], [0.2, "\\frac15", 0]]), c = ri(-4, 4), d = ri(-3, 3), rel = pick(["<", ">", "\\le", "\\ge"]);
    var less = rel === "<" || rel === "\\le", cl = rel === "\\le" || rel === "\\ge", up = base[2] === 1, xLess = less === up, b0 = d - c;
    var res = xLess ? iv(null, b0, false, cl) : iv(b0, null, cl, false);
    var bt = base[2] === 1 ? base[1] : "\\left(" + base[1] + "\\right)";
    return ivl(P("Vyřešte $" + bt + "^{" + poly([[1, 1], [c, 0]]) + "} " + rel + " " + bt + "^{" + d + "}$."), res,
      "Funkce $" + bt + "^x$ je " + (up ? "rostoucí, nerovnost mezi exponenty zůstane" : "klesající, nerovnost mezi exponenty se otočí") + ": $" + poly([[1, 1], [c, 0]]) + (xLess ? (cl ? "\\le" : "<") : (cl ? "\\ge" : ">")) + d + "$, tedy $" + ivT(xLess ? null : b0, xLess ? b0 : null, cl, cl) + "$.");
  };
  G.hs_log_ineq = function () {
    var B = pick([[2, "2"], [3, "3"], [0.5, "\\frac12"]]), c = ri(-4, 4), k = ri(-2, 2), less = Math.random() < 0.5;
    var v = k >= 0 ? (B[0] === 0.5 ? fr(1, Math.pow(2, k)) : fr(Math.pow(B[0], k), 1)) : (B[0] === 0.5 ? fr(Math.pow(2, -k), 1) : fr(1, Math.pow(B[0], -k)));
    var e = fr(v.p + c * v.q, v.q), up = B[0] > 1, xLess = less === up;
    var res = xLess ? "(" + c + "; " + fs(e) + ")" : "(" + fs(e) + "; ∞)";
    return ivl(P("Vyřešte $\\log_{" + B[1] + "}(" + poly([[1, 1], [-c, 0]]) + ") " + (less ? "<" : ">") + " " + k + "$."), res,
      "Podmínka $x > " + c + "$. $" + k + " = \\log_{" + B[1] + "}" + ft(v) + "$ a logaritmus je " + (up ? "rostoucí" : "klesající") + ": $" + poly([[1, 1], [-c, 0]]) + (xLess ? "<" : ">") + ft(v) + "$. Dohromady $x\\in" + (xLess ? "(" + c + ", " + ft(e) + ")" : "(" + ft(e) + ", \\infty)") + "$.");
  };
  G.hs_compound = function () {
    var K = pick([10000, 20000, 50000, 100000]), p = pick([2, 4, 5, 10]), n = pick([2, 3]);
    var v = Math.round(K * Math.pow(1 + p / 100, n) * 100) / 100;
    return inp(P("Vklad $" + K + "$ Kč se úročí $" + p + "\\,\\%$ ročně a úroky se připisují. Kolik Kč bude na účtu po $" + n + "$ letech?"), String(v),
      "$" + K + "\\cdot" + cz(1 + p / 100) + "^{" + n + "} = " + cz(v) + "$ Kč.");
  };

  // ==== Goniometrie ===========================================================================
  G.hs_rt_side = function () {
    var c = 2 * ri(2, 9), ang = pick([30, 45, 60]), opp = Math.random() < 0.5;
    var val = (ang === 45) ? { k: c / 2, m: 2 } : ((ang === 30) === opp ? { k: c / 2, m: 1 } : { k: c / 2, m: 3 });
    var ansS = val.m === 1 ? String(val.k) : val.k + "√" + val.m + "; " + r4(val.k * Math.sqrt(val.m)), t = val.m === 1 ? String(val.k) : val.k + "\\sqrt" + val.m;
    var W = 4 * Math.cos(ang * Math.PI / 180), H = 4 * Math.sin(ang * Math.PI / 180);
    return withFig(rtri(W, H, opp ? null : "?", opp ? "?" : null, String(c), ang + "°"),
      inp(P("Pravoúhlý trojúhelník má přeponu $" + c + "$ a ostrý úhel $" + ang + "^\\circ$. Jak dlouhá je odvěsna " + (opp ? "protilehlá" : "přilehlá") + " tomuto úhlu?"), ansS,
        "Odvěsna je $" + c + "\\cdot\\" + (opp ? "sin" : "cos") + " " + ang + "^\\circ = " + t + "$."));
  };
  G.hs_period = function () {
    var f = pick(["sin", "cos", "tg"]), b = pick([2, 3, 4, 1 / 2, 1 / 3]), bp = b < 1 ? 1 : b, bq = b < 1 ? Math.round(1 / b) : 1;
    var base = f === "tg" ? 1 : 2;     // period = base*π/b
    var arg = b < 1 ? "\\frac{x}{" + bq + "}" : b + "x";
    return inp(P("Určete periodu funkce $y = " + (f === "tg" ? "\\operatorname{tg}" : "\\" + f) + " " + arg + "$."), piAns(base * bq, bp),
      "$" + (f === "tg" ? "\\operatorname{tg}" : "\\" + f) + "$ má periodu $" + (f === "tg" ? "\\pi" : "2\\pi") + "$, s argumentem $" + arg + "$ je perioda " + (b < 1 ? bq + "krát delší" : b + "krát kratší") + ": $" + piTeX(base * bq, bp) + "$.");
  };
  G.hs_trig_range = function () {
    var a = nz(-4, 4), d = ri(-3, 3), f = pick(["sin", "cos"]);
    return withFig(gr(-0.2, 6.5, d - Math.abs(a) - 1, d + Math.abs(a) + 1, ["f=" + a + "*" + f + "(x)+(" + d + ")", "hline=" + (d + Math.abs(a)), "hline=" + (d - Math.abs(a))]),
      ivl(P("Určete obor hodnot funkce $y = " + (a === 1 ? "" : a === -1 ? "-" : a) + "\\" + f + " x" + sgn0(d) + "$."), iv(d - Math.abs(a), d + Math.abs(a), true, true),
        "$\\" + f + " x\\in[-1, 1]$, po vynásobení $" + a + "$ dostaneme $[" + (-Math.abs(a)) + ", " + Math.abs(a) + "]$ a po posunu $[" + (d - Math.abs(a)) + ", " + (d + Math.abs(a)) + "]$."));
  };
  G.hs_trig_eq = function () {
    var T = [["0", 0, [0, 180]], ["\\frac12", 0.5, [30, 150]], ["\\frac{\\sqrt2}2", 0.7071, [45, 135]], ["\\frac{\\sqrt3}2", 0.866, [60, 120]], ["1", 1, [90]],
      ["-\\frac12", -0.5, [210, 330]], ["-\\frac{\\sqrt2}2", -0.7071, [225, 315]], ["-\\frac{\\sqrt3}2", -0.866, [240, 300]], ["-1", -1, [270]]];
    var r = pick(T), cosine = Math.random() < 0.5;
    var sols = r[2].map(function (d) { return cosine ? (90 - d + 360) % 360 : d; }).sort(function (a, b) { return a - b; });
    var names = sols.map(function (d) { return piS(d, 180); });
    var spec = "x=-1.45..1.45; y=-1.3..1.3; aspect=equal; circle=0,0,1; " + (cosine ? "vline=" : "hline=") + r[1] + "; " + sols.map(function (d) { var t = d * Math.PI / 180; return "vec=" + N(Math.cos(t)) + "," + N(Math.sin(t)) + ",ex"; }).join("; ");
    return withFig(spec, set(P("Vyřešte $\\" + (cosine ? "cos" : "sin") + " x = " + r[0] + "$ v intervalu $[0, 2\\pi)$."), names.join("; "),
      "Hledáme body jednotkové kružnice se souřadnicí $" + (cosine ? "x" : "y") + " = " + r[0] + "$: úhly $" + sols.map(function (d) { return piTeX(d, 180); }).join("$ a $") + "$."));
  };
  G.hs_cos_rule = function () {
    var a = ri(2, 9), b = ri(2, 9), g = pick([60, 90, 120]), c2 = a * a + b * b - (g === 60 ? a * b : g === 120 ? -a * b : 0);
    var t = g * Math.PI / 180, Bx = a * Math.cos(t), By = a * Math.sin(t), lo = Math.min(0, Bx) - 1.5, hi = Math.max(b, Bx) + 1.5;
    var spec = gr(lo, hi, -1.5, By + 1.5, ["axes=off", "seg=0,0," + b + ",0,ink", "seg=0,0," + N(Bx) + "," + N(By) + ",ink", "seg=" + b + ",0," + N(Bx) + "," + N(By) + ",ink",
      "label=" + N(b / 2) + ",-0.7,b = " + b, "label=" + N(Bx / 2 - 0.7) + "," + N(By / 2) + ",a = " + a, "label=" + N((b + Bx) / 2 + 0.6) + "," + N(By / 2 + 0.3) + ",c", "label=0.9,0.5," + g + "°"], true);
    return withFig(spec, inp(P("Trojúhelník má strany $a = " + a + "$, $b = " + b + "$ a úhel $\\gamma = " + g + "^\\circ$ mezi nimi. Určete stranu $c$."), sqAns(c2),
      "$c^2 = " + a * a + " + " + b * b + " - 2\\cdot" + a + "\\cdot" + b + "\\cdot\\cos" + g + "^\\circ = " + c2 + "$, tedy $c = " + sqTeX(c2) + "$."));
  };
  G.hs_tri_area = function () {
    var a = ri(2, 9), b = ri(2, 9), g = pick([30, 45, 60, 90, 120, 135, 150]);
    var S = { 30: [1, 4, 1], 150: [1, 4, 1], 90: [1, 2, 1], 45: [1, 4, 2], 135: [1, 4, 2], 60: [1, 4, 3], 120: [1, 4, 3] }[g];   // sin = S0/2*√S2 ... area = ab*S0/S1*√S2
    var f = fr(a * b * S[0], S[1]), m = S[2];
    var t = m === 1 ? ft(f) : (f.q === 1 ? (f.p === 1 ? "" : f.p) + "\\sqrt" + m : "\\frac{" + (f.p === 1 ? "" : f.p) + "\\sqrt" + m + "}{" + f.q + "}");
    var A = m === 1 ? ans(f) : (f.p === 1 ? "" : f.p) + "√" + m + (f.q === 1 ? "" : "/" + f.q) + "; " + r4(f.p * Math.sqrt(m) / f.q);
    return inp(P("Určete obsah trojúhelníku se stranami $" + a + "$ a $" + b + "$, které svírají úhel $" + g + "^\\circ$."), A,
      "$S = \\frac12ab\\sin\\gamma = \\frac12\\cdot" + a + "\\cdot" + b + "\\cdot\\sin" + g + "^\\circ = " + t + "$.");
  };
  G.hs_sine_rule = function () {
    var SIN2 = { 30: [1, 4], 45: [1, 2], 60: [3, 4], 90: [1, 1], 120: [3, 4], 135: [1, 2] }, angs = [30, 45, 60, 90, 120, 135], al, be;
    do { al = pick(angs); be = pick(angs); } while (al === be || al + be >= 180);
    var a = ri(2, 9), s1 = SIN2[al], s2 = SIN2[be];        // b^2 = a^2 * sin^2(β)/sin^2(α)
    var o = sqFrac(a * a * s2[0] * s1[1], s2[1] * s1[0]);
    return inp(P("V trojúhelníku je $a = " + a + "$, $\\alpha = " + al + "^\\circ$ a $\\beta = " + be + "^\\circ$. Určete stranu $b$."), sqFracAns(o),
      "Podle sinové věty $b = a\\cdot\\frac{\\sin\\beta}{\\sin\\alpha} = " + a + "\\cdot\\frac{\\sin" + be + "^\\circ}{\\sin" + al + "^\\circ} = " + sqFracTeX(o) + "$.");
  };

  // ==== Posloupnosti a řady ===================================================================
  G.hs_seq_term = function () {
    var k = ri(2, 8);
    if (Math.random() < 0.5) { var a = nz(-3, 3), b = ri(-5, 5), c = ri(-6, 6), v = a * k * k + b * k + c;
      return inp(P("Posloupnost je dána vzorcem $a_n = " + poly([[a, 2], [b, 1], [c, 0]], "n") + "$. Určete $a_{" + k + "}$."), String(v), "Dosadíme $n = " + k + "$: $a_{" + k + "} = " + v + "$."); }
    var p = nz(-3, 3), q = ri(-4, 4), r = ri(1, 3), s = ri(0, 4), f = fr(p * k + q, r * k + s);
    return inp(P("Posloupnost je dána vzorcem $a_n = \\dfrac{" + poly([[p, 1], [q, 0]], "n") + "}{" + poly([[r, 1], [s, 0]], "n") + "}$. Určete $a_{" + k + "}$."), ans(f),
      "Dosadíme $n = " + k + "$: $a_{" + k + "} = " + fq(p * k + q, r * k + s) + "$.");
  };
  G.hs_ap_term = function () {
    var a1 = ri(-10, 10), d = nz(-5, 5), n = ri(5, 30), an = a1 + (n - 1) * d;
    return withFig(gr(0, 9.5, Math.min(a1, a1 + 8 * d) - 3, Math.max(a1, a1 + 8 * d) + 3, ["seq=" + a1 + "+(n-1)*(" + d + ")"]),
      inp(P("Aritmetická posloupnost má $a_1 = " + a1 + "$ a diferenci $d = " + d + "$. Určete $a_{" + n + "}$."), String(an),
        "$a_{" + n + "} = a_1 + " + (n - 1) + "d = " + a1 + " + " + (n - 1) + "\\cdot" + par(d) + " = " + an + "$."));
  };
  G.hs_ap_sum = function () {
    var a1 = ri(-5, 10), d = nz(-3, 5), n = ri(5, 20), an = a1 + (n - 1) * d, s = n * (a1 + an) / 2;
    return inp(P("Určete součet prvních $" + n + "$ členů aritmetické posloupnosti s $a_1 = " + a1 + "$ a $d = " + d + "$."), String(s),
      "$a_{" + n + "} = " + an + "$ a $s_{" + n + "} = \\frac{" + n + "(" + a1 + " + " + par(an) + ")}{2} = " + s + "$.");
  };
  G.hs_ap_find = function () {
    var a1 = ri(-8, 8), d = nz(-4, 4), k = ri(2, 5), m = ri(k + 2, 12), ak = a1 + (k - 1) * d, am = a1 + (m - 1) * d;
    return inp(P("V aritmetické posloupnosti je $a_{" + k + "} = " + ak + "$ a $a_{" + m + "} = " + am + "$. Určete $a_1$."), String(a1),
      "Mezi $a_{" + k + "}$ a $a_{" + m + "}$ je $" + (m - k) + "$ " + (m - k <= 4 ? "kroky" : "kroků") + ": $" + (m - k) + "d = " + (am - ak) + "$, tedy $d = " + d + "$. Pak $a_1 = a_{" + k + "} - " + (k - 1) + "d = " + a1 + "$.");
  };
  G.hs_gp_term = function () {
    var a1 = pick([1, 2, 3, 5, -2, 64, 81]), q = pick([2, 3, -2, 0.5, -0.5, 1 / 3]), n = ri(3, 7), qq = q === 0.5 ? fr(1, 2) : q === -0.5 ? fr(-1, 2) : q === 1 / 3 ? fr(1, 3) : fr(q, 1);
    var v = fr(a1 * Math.pow(qq.p, n - 1), Math.pow(qq.q, n - 1));
    return inp(P("Geometrická posloupnost má $a_1 = " + a1 + "$ a kvocient $q = " + ft(qq) + "$. Určete $a_{" + n + "}$."), ans(v),
      "$a_{" + n + "} = a_1q^{" + (n - 1) + "} = " + a1 + "\\cdot\\left(" + ft(qq) + "\\right)^{" + (n - 1) + "} = " + ft(v) + "$.");
  };
  G.hs_gp_sum = function () {
    var a1 = ri(1, 5), q = pick([2, 3, -2]), n = ri(3, 7), s = a1 * (Math.pow(q, n) - 1) / (q - 1);
    return inp(P("Určete součet prvních $" + n + "$ členů geometrické posloupnosti s $a_1 = " + a1 + "$ a $q = " + q + "$."), String(s),
      "$s_{" + n + "} = a_1\\frac{q^{" + n + "} - 1}{q - 1} = " + a1 + "\\cdot\\frac{" + Math.pow(q, n) + " - 1}{" + (q - 1) + "} = " + s + "$.");
  };
  G.hs_inf_series = function () {
    var a1 = nz(-6, 9), k = ri(2, 5), neg = Math.random() < 0.4, q = fr(neg ? -1 : 1, k), s = fr(a1 * k, k - (neg ? -1 : 1));
    var t2 = fr(a1 * q.p, q.q), t3 = fr(a1 * q.p * q.p, q.q * q.q);
    return inp(P("Určete součet řady $" + a1 + " " + (t2.p < 0 ? "-" : "+") + " " + ft(fr(Math.abs(t2.p), t2.q)) + " " + (t3.p < 0 ? "-" : "+") + " " + ft(fr(Math.abs(t3.p), t3.q)) + " " + (a1 * (neg ? -1 : 1) < 0 ? "-" : "+") + " \\dots$"), ans(s),
      "Je to geometrická řada s $a_1 = " + a1 + "$ a $q = " + ft(q) + "$, $|q| < 1$: $s = \\frac{a_1}{1 - q} = " + ft(s) + "$.");
  };
  G.hs_periodic = function () {
    var k = ri(0, 2), f, t;
    if (k === 0) { var a = ri(1, 8); f = fr(a, 9); t = "0{,}\\overline{" + a + "}"; }
    else if (k === 1) { var ab = ri(10, 98); if (ab % 11 === 0) ab++; f = fr(ab, 99); t = "0{,}\\overline{" + ab + "}"; }
    else { var c = ri(1, 9), d; do { d = ri(1, 9); } while (d === c); f = fr(9 * c + d, 90); t = "0{,}" + c + "\\overline{" + d + "}"; }
    return inp(P("Zapište číslo $" + t + "$ zlomkem v základním tvaru."), fs(f) + "; " + r4(f.p / f.q),
      (k === 0 ? "Řada $\\frac{a}{10} + \\frac{a}{100} + \\dots$ má součet $\\frac{a/10}{1 - 1/10} = \\frac a9$" : k === 1 ? "Perioda dvou cifer: $\\frac{ab/100}{1 - 1/100} = \\frac{ab}{99}$" : "Předperioda a perioda: $\\frac{c}{10} + \\frac{d}{90} = \\frac{9c + d}{90}$") + ", tedy $" + t + " = " + ft(f) + "$.");
  };
  G.hs_seq_lim = function () {
    var a = nz(-5, 6), b = ri(-5, 5), c = ri(-5, 5), d = nz(1, 6), e = ri(-5, 5), low = Math.random() < 0.25;
    var num = low ? poly([[a, 1], [b, 0]], "n") : poly([[a, 2], [b, 1], [c, 0]], "n"), L = low ? fr(0, 1) : fr(a, d);
    return inp(P("Určete limitu posloupnosti $a_n = \\dfrac{" + num + "}{" + poly([[d, 2], [e, 1], [ri(1, 5), 0]], "n") + "}$."), ans(L),
      low ? "Jmenovatel má vyšší stupeň než čitatel, limita je $0$." : "Vydělíme $n^2$; rozhodují vedoucí koeficienty: $" + fq(a, d) + "$.");
  };

  // ==== Planimetrie ===========================================================================
  G.hs_tri_angle = function () {
    var a = ri(25, 95), b = ri(20, 150 - a), g = 180 - a - b;
    var t = Math.PI / 180, Ax = 0, Bx = 5, Cx = 5 * Math.sin(b * t) * Math.cos(a * t) / Math.sin(g * t), Cy = 5 * Math.sin(b * t) * Math.sin(a * t) / Math.sin(g * t);
    var spec = gr(Math.min(0, Cx) - 0.8, Math.max(5, Cx) + 0.8, -0.8, Cy + 0.8, ["axes=off", "seg=0,0,5,0,ink", "seg=0,0," + N(Cx) + "," + N(Cy) + ",ink", "seg=5,0," + N(Cx) + "," + N(Cy) + ",ink",
      "label=0.75,0.2," + a + "°", "label=4.3,0.2," + b + "°", "label=" + N(Cx) + "," + N(Cy - 0.65) + ",?"], true);
    if (Math.random() < 0.5) return withFig(spec, inp(P("Trojúhelník má úhly $" + a + "^\\circ$ a $" + b + "^\\circ$. Jak velký je třetí úhel (ve stupních)?"), String(g),
      "Součet vnitřních úhlů je $180^\\circ$: $180 - " + a + " - " + b + " = " + g + "$."));
    return inp(P("V trojúhelníku je $\\alpha = " + a + "^\\circ$ a $\\beta = " + b + "^\\circ$. Jak velký je vnější úhel u vrcholu $C$ (ve stupních)?"), String(a + b),
      "Vnější úhel je vedlejší k $\\gamma = " + g + "^\\circ$: $180 - " + g + " = " + (a + b) + "$, což je součet $\\alpha + \\beta$.");
  };
  G.hs_polygon = function () {
    var n = pick([5, 6, 8, 9, 10, 12, 15, 18, 20]);
    if (Math.random() < 0.5) return inp(P("Jaký je součet vnitřních úhlů konvexního " + n + "-úhelníku (ve stupních)?"), String((n - 2) * 180),
      "Úhlopříčky z jednoho vrcholu ho rozdělí na $" + (n - 2) + "$ trojúhelníků: $" + (n - 2) + "\\cdot180^\\circ = " + (n - 2) * 180 + "^\\circ$.");
    return inp(P("Jak velký je vnitřní úhel pravidelného " + n + "-úhelníku (ve stupních)?"), String((n - 2) * 180 / n),
      "Součet úhlů $" + (n - 2) * 180 + "^\\circ$ rozdělíme na $" + n + "$ stejných dílů: $" + (n - 2) * 180 / n + "^\\circ$.");
  };
  G.hs_tri_ineq = function () {
    var a = ri(2, 12), b = ri(2, 12);
    return ivl(P("Trojúhelník má strany $a = " + a + "$ a $b = " + b + "$. Jaké délky může mít strana $c$?"), "(" + Math.abs(a - b) + "; " + (a + b) + ")",
      "Podle trojúhelníkové nerovnosti $|a - b| < c < a + b$: $c\\in(" + Math.abs(a - b) + ", " + (a + b) + ")$.");
  };
  G.hs_euclid = function () {
    var v = ri(2, 12), divs = []; for (var d = 1; d < v; d++) if ((v * v) % d === 0) divs.push(d);
    var ca = pick(divs), cb = v * v / ca, c = ca + cb, w = ca * 8 / c, hgt = v * 8 / c, ask = ri(0, 1);
    var spec = gr(-0.6, 8.6, -1.1, hgt + 0.8, ["axes=off", "seg=0,0,8,0,ink", "seg=0,0," + N(cb * 8 / c) + "," + N(hgt) + ",ink", "seg=8,0," + N(cb * 8 / c) + "," + N(hgt) + ",ink",
      "seg=" + N(cb * 8 / c) + ",0," + N(cb * 8 / c) + "," + N(hgt) + ",ex", "label=" + N(cb * 4 / c) + ",-0.6," + cb, "label=" + N(8 - w / 2) + ",-0.6," + ca, "label=" + N(cb * 8 / c + 0.4) + "," + N(hgt / 2) + ",v"], true);
    if (ask === 0) return withFig(spec, inp(P("Výška na přeponu pravoúhlého trojúhelníku dělí přeponu na úseky $" + cb + "$ a $" + ca + "$. Jak dlouhá je výška?"), String(v),
      "Euklidova věta o výšce: $v^2 = " + cb + "\\cdot" + ca + " = " + v * v + "$, tedy $v = " + v + "$."));
    return withFig(spec, inp(P("Výška na přeponu pravoúhlého trojúhelníku dělí přeponu na úseky $" + cb + "$ a $" + ca + "$. Jak dlouhá je odvěsna přilehlá k úseku $" + ca + "$?"), sqAns(c * ca),
      "Euklidova věta o odvěsně: $a^2 = c\\cdot c_a = " + c + "\\cdot" + ca + " = " + c * ca + "$, tedy $a = " + sqTeX(c * ca) + "$."));
  };
  G.hs_shadow = function () {
    var h1 = ri(1, 3), s1 = ri(2, 5), s2 = ri(6, 30), h2 = fr(h1 * s2, s1);
    return inp(P("Tyč vysoká $" + h1 + "$ m vrhá stín dlouhý $" + s1 + "$ m. Jak vysoký je strom, jehož stín měří ve stejnou chvíli $" + s2 + "$ m?"), ans(h2),
      "Trojúhelníky tyč–stín a strom–stín jsou podobné: $v = " + h1 + "\\cdot\\frac{" + s2 + "}{" + s1 + "} = " + ft(h2) + "$ m.");
  };
  G.hs_inscribed = function () {
    var k = ri(0, 2), x = ri(10, 85);
    if (k === 0) return inp(P("Obvodový úhel nad obloukem má $" + x + "^\\circ$. Jak velký je středový úhel nad týmž obloukem (ve stupních)?"), String(2 * x), "Středový úhel je dvojnásobkem obvodového: $" + 2 * x + "^\\circ$.");
    if (k === 1) { var y = 2 * ri(10, 85); return inp(P("Středový úhel nad obloukem má $" + y + "^\\circ$. Jak velký je obvodový úhel nad týmž obloukem (ve stupních)?"), String(y / 2), "Obvodový úhel je polovinou středového: $" + y / 2 + "^\\circ$."); }
    var t = x * Math.PI / 180, Cx = Math.cos(2 * t), Cy = Math.sin(2 * t);
    return withFig("x=-1.4..1.4; y=-1.3..1.3; aspect=equal; axes=off; circle=0,0,1; seg=-1,0,1,0,ink; seg=-1,0," + N(Cx) + "," + N(Cy) + ",ink; seg=1,0," + N(Cx) + "," + N(Cy) + ",ink; label=-1.15,-0.12,A; label=1.15,-0.12,B; label=" + N(Cx * 1.15) + "," + N(Cy * 1.15) + ",C",
      inp(P("Trojúhelník $ABC$ je vepsaný do kružnice, strana $AB$ je její průměr a úhel při vrcholu $A$ má $" + x + "^\\circ$. Jak velký je úhel při vrcholu $B$ (ve stupních)?"), String(90 - x),
        "Podle Thaletovy věty je úhel při $C$ pravý, takže $\\beta = 90^\\circ - " + x + "^\\circ = " + (90 - x) + "^\\circ$."));
  };
  G.hs_tangent_len = function () {
    var r = ri(2, 9), t = ri(2, 12), d2 = r * r + t * t, ask = Math.random() < 0.5;
    if (ask) return inp(P("Kružnice má poloměr $" + r + "$ cm. Bod $M$ je od jejího středu vzdálen $" + sqTeX(d2) + "$ cm. Jak dlouhý je úsek tečny z bodu $M$ k bodu dotyku (cm)?"), String(t),
      "Poloměr je kolmý na tečnu: $t = \\sqrt{d^2 - r^2} = \\sqrt{" + d2 + " - " + r * r + "} = " + t + "$ cm.");
    var e = ri(1, 8), R = ri(e + 1, 12), h2 = R * R - e * e;
    return inp(P("Kružnice má poloměr $" + R + "$ cm. Tětiva je od středu vzdálena $" + e + "$ cm. Jak dlouhá je tětiva (cm)?"), sqAns(4 * h2),
      "Kolmice ze středu tětivu rozpůlí: polovina je $\\sqrt{" + R * R + " - " + e * e + "} = " + sqTeX(h2) + "$, celá tětiva $" + sqTeX(4 * h2) + "$ cm.");
  };
  G.hs_reflect = function () {
    var x = nz(-5, 5), y = nz(-5, 5), k = ri(0, 3), sx = ri(-2, 2), sy = ri(-2, 2), r, how;
    if (k === 0) { r = [x, -y]; how = "v osové souměrnosti podle osy $x$"; }
    else if (k === 1) { r = [-x, y]; how = "v osové souměrnosti podle osy $y$"; }
    else if (k === 2) { r = [-x, -y]; how = "ve středové souměrnosti se středem v počátku"; }
    else { r = [2 * sx - x, 2 * sy - y]; how = "ve středové souměrnosti se středem $S = " + pt2(sx, sy) + "$"; }
    var t = function (p) { return "$" + pt2(p[0], p[1]) + "$"; };
    return mc(P("Bod $A = " + pt2(x, y) + "$ zobrazíme " + how + ". Jaký je jeho obraz?"), t(r), [t([x, -y]), t([-x, y]), t([-x, -y]), t([y, x]), t([r[0] + 1, r[1]])].filter(function (s) { return s !== t(r); }).slice(0, 3),
      k === 3 ? "$S$ je středem úsečky $AA'$, tedy $A' = 2S - A = " + pt2(r[0], r[1]) + "$." : "Obraz bodu $" + pt2(x, y) + "$ je $" + pt2(r[0], r[1]) + "$.");
  };

  // ==== Stereometrie ==========================================================================
  G.hs_cube = function () {
    var a = ri(2, 9), k = ri(0, 3);
    var Q = [["délku stěnové úhlopříčky", 2 * a * a, "a\\sqrt2"], ["délku tělesové úhlopříčky", 3 * a * a, "a\\sqrt3"], ["povrch", 0, "6a^2"], ["objem", 0, "a^3"]][k];
    var A = k === 0 || k === 1 ? sqAns(Q[1]) : String(k === 2 ? 6 * a * a : a * a * a), T = k === 0 || k === 1 ? sqTeX(Q[1]) : A;
    return inp(P("Krychle má hranu $" + a + "$ cm. Určete " + Q[0] + "."), A, "Pro krychli o hraně $a$ je to $" + Q[2] + "$, tedy $" + T + "$.");
  };
  G.hs_solid = function () {
    var r = ri(1, 6), v = ri(1, 9), k = ri(0, 4), t, p, q, why;
    if (k === 0) { t = "objem válce s poloměrem podstavy $" + r + "$ a výškou $" + v + "$"; p = r * r * v; q = 1; why = "V = \\pi r^2v"; }
    else if (k === 1) { t = "objem rotačního kužele s poloměrem podstavy $" + r + "$ a výškou $" + v + "$"; p = r * r * v; q = 3; why = "V = \\frac13\\pi r^2v"; }
    else if (k === 2) { t = "objem koule o poloměru $" + r + "$"; p = 4 * r * r * r; q = 3; why = "V = \\frac43\\pi r^3"; }
    else if (k === 3) { t = "povrch koule o poloměru $" + r + "$"; p = 4 * r * r; q = 1; why = "S = 4\\pi r^2"; }
    else { t = "povrch válce s poloměrem podstavy $" + r + "$ a výškou $" + v + "$"; p = 2 * r * r + 2 * r * v; q = 1; why = "S = 2\\pi r^2 + 2\\pi rv"; }
    return inp(P("Určete " + t + "."), piAns(p, q), "$" + why + " = " + piTeX(p, q) + "$.");
  };
  G.hs_box = function () {
    var a = ri(1, 8), b = ri(1, 8), c = ri(1, 8), k = ri(0, 2);
    if (k === 0) return inp(P("Kvádr má hrany $" + a + "$, $" + b + "$ a $" + c + "$ cm. Určete jeho objem (cm³)."), String(a * b * c), "$V = abc = " + a * b * c + "$ cm³.");
    if (k === 1) return inp(P("Kvádr má hrany $" + a + "$, $" + b + "$ a $" + c + "$ cm. Určete jeho povrch (cm²)."), String(2 * (a * b + a * c + b * c)), "$S = 2(ab + ac + bc) = " + 2 * (a * b + a * c + b * c) + "$ cm².");
    return inp(P("Kvádr má hrany $" + a + "$, $" + b + "$ a $" + c + "$ cm. Jak dlouhá je jeho tělesová úhlopříčka (cm)?"), sqAns(a * a + b * b + c * c),
      "$u = \\sqrt{a^2 + b^2 + c^2} = \\sqrt{" + (a * a + b * b + c * c) + "} = " + sqTeX(a * a + b * b + c * c) + "$ cm.");
  };
  G.hs_pyramid = function () {
    var a = ri(2, 10), v = ri(2, 12), V = fr(a * a * v, 3);
    return inp(P("Pravidelný čtyřboký jehlan má podstavnou hranu $" + a + "$ cm a výšku $" + v + "$ cm. Určete jeho objem (cm³)."), ans(V),
      "$V = \\frac13a^2v = \\frac13\\cdot" + a * a + "\\cdot" + v + " = " + ft(V) + "$ cm³.");
  };
  G.hs_scale = function () {
    var k = ri(2, 5), vol = Math.random() < 0.5;
    return inp(P("Všechny rozměry tělesa zvětšíme $" + k + "$krát. Kolikrát se zvětší jeho " + (vol ? "objem" : "povrch") + "?"), String(vol ? k * k * k : k * k),
      (vol ? "Objem roste s třetí mocninou" : "Povrch roste s druhou mocninou") + " poměru: $" + k + "^" + (vol ? 3 : 2) + " = " + (vol ? k * k * k : k * k) + "$.");
  };

  // ==== Vektory a analytická geometrie ========================================================
  G.hs_vec_len = function () {
    var x1 = ri(-5, 5), y1 = ri(-5, 5), T = pick([[3, 4], [6, 8], [5, 12], [1, 2], [2, 3], [1, 1], [4, 4]]), sx = pick([-1, 1]), sy = pick([-1, 1]);
    var dx = sx * T[0], dy = sy * T[1], x2 = x1 + dx, y2 = y1 + dy;
    return withFig(gr(Math.min(x1, x2) - 1.5, Math.max(x1, x2) + 1.5, Math.min(y1, y2) - 1.5, Math.max(y1, y2) + 1.5, ["vec=" + x1 + "," + y1 + "," + x2 + "," + y2 + ",ex", "seg=" + x1 + "," + y1 + "," + x2 + "," + y1 + ",muted", "seg=" + x2 + "," + y1 + "," + x2 + "," + y2 + ",muted"], true),
      inp(P("Jaká je vzdálenost bodů $A = " + pt2(x1, y1) + "$ a $B = " + pt2(x2, y2) + "$?"), sqAns(dx * dx + dy * dy),
        "$\\vec{AB} = (" + dx + ", " + dy + ")$ a $|AB| = \\sqrt{" + dx * dx + " + " + dy * dy + "} = " + sqTeX(dx * dx + dy * dy) + "$."));
  };
  G.hs_dot = function () {
    var three = Math.random() < 0.4, u = [ri(-5, 5), ri(-5, 5), ri(-4, 4)], v = [ri(-5, 5), ri(-5, 5), ri(-4, 4)], n = three ? 3 : 2;
    var d = 0, terms = []; for (var i = 0; i < n; i++) { d += u[i] * v[i]; terms.push(par(u[i]) + "\\cdot" + par(v[i])); }
    var vt = function (w) { return "(" + w.slice(0, n).join(", ") + ")"; };
    return inp(P("Vypočtěte skalární součin $" + vt(u) + "\\cdot" + vt(v) + "$."), String(d), "$" + terms.join(" + ") + " = " + d + "$.");
  };
  G.hs_perp = function () {
    var a = nz(-6, 6), b = nz(-6, 6), c = nz(-5, 5), m = fr(-b * c, a);
    return inp(P("Určete $m$ tak, aby vektory $(" + a + ", " + b + ")$ a $(m, " + c + ")$ byly kolmé."), ans(m),
      "Kolmé vektory mají nulový skalární součin: $" + a + "m " + sgn(b * c) + " = 0$, tedy $m = " + ft(m) + "$.");
  };
  G.hs_vec_angle = function () {
    var D = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]], i = ri(0, 7), j; do { j = ri(0, 7); } while (j === i);
    var k1 = ri(1, 3), k2 = ri(1, 3), u = [D[i][0] * k1, D[i][1] * k1], v = [D[j][0] * k2, D[j][1] * k2], ang = Math.min((j - i + 8) % 8, (i - j + 8) % 8) * 45;
    var dot = u[0] * v[0] + u[1] * v[1];
    return withFig(gr(-4, 4, -4, 4, ["vec=" + u[0] + "," + u[1] + ",def", "vec=" + v[0] + "," + v[1] + ",ex"], true),
      inp(P("Jaký úhel svírají vektory $(" + u.join(", ") + ")$ a $(" + v.join(", ") + ")$ (ve stupních)?"), String(ang),
        "$\\cos\\varphi = \\frac{\\vec u\\cdot\\vec v}{|\\vec u||\\vec v|} = \\frac{" + dot + "}{" + sqTeX(u[0] * u[0] + u[1] * u[1]) + "\\cdot" + sqTeX(v[0] * v[0] + v[1] * v[1]) + "}$, tedy $\\varphi = " + ang + "^\\circ$."));
  };
  G.hs_line_eq = function () {
    var x1 = ri(-4, 4), y1 = ri(-4, 4), x2, y2; do { x2 = ri(-4, 4); y2 = ri(-4, 4); } while (x2 === x1 && y2 === y1);
    var a = y2 - y1, b = x1 - x2, g = gcd(a, b); a /= g; b /= g; if (a < 0 || (a === 0 && b < 0)) { a = -a; b = -b; }
    var c = -(a * x1 + b * y1), T = function (p, q, r) { return "$" + genLine(p, q, r) + "$"; };
    return mc(P("Která rovnice popisuje přímku procházející body $" + pt2(x1, y1) + "$ a $" + pt2(x2, y2) + "$?"), T(a, b, c),
      [T(b, a, c), T(a, -b, c), T(a, b, -c), T(a, b, c + 1)].filter(function (s) { return s !== T(a, b, c); }).slice(0, 3),
      "Směrový vektor je $(" + (x2 - x1) + ", " + (y2 - y1) + ")$, normálový $(" + a + ", " + b + ")$. Konstantu dopočítáme z bodu $" + pt2(x1, y1) + "$: $" + genLine(a, b, c) + "$.");
  };
  G.hs_pt_line = function () {
    var n = pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [1, 0, 1], [0, 1, 1]]), sa = pick([1, -1]), a = sa * n[0], b = n[1], L = n[2];
    var x0 = ri(-5, 5), y0 = ri(-5, 5), d = ri(0, 6), c = pick([1, -1]) * d * L - a * x0 - b * y0;
    return inp(P("Jaká je vzdálenost bodu $" + pt2(x0, y0) + "$ od přímky $" + genLine(a, b, c) + "$?"), String(d),
      "$\\frac{|" + par(a) + "\\cdot" + par(x0) + " + " + par(b) + "\\cdot" + par(y0) + " " + sgn(c) + "|}{\\sqrt{" + a * a + " + " + b * b + "}} = \\frac{" + d * L + "}{" + L + "} = " + d + "$.");
  };
  G.hs_line_int = function () {
    var x = ri(-4, 4), y = ri(-4, 4), a1, b1, a2, b2;
    do { a1 = nz(-4, 4); b1 = nz(-4, 4); a2 = nz(-4, 4); b2 = nz(-4, 4); } while (a1 * b2 - a2 * b1 === 0);
    var t = function (p) { return "$" + pt2(p[0], p[1]) + "$"; };
    return mc(P("Ve kterém bodě se protínají přímky $" + genLine(a1, b1, -(a1 * x + b1 * y)) + "$ a $" + genLine(a2, b2, -(a2 * x + b2 * y)) + "$?"), t([x, y]),
      [t([y, x]), t([-x, y]), t([x, -y]), t([-x, -y]), t([x + 1, y])].filter(function (s) { return s !== t([x, y]); }).slice(0, 3),
      "Soustavu vyřešíme sčítací metodou: $x = " + x + "$, $y = " + y + "$. Průsečík je $" + pt2(x, y) + "$.");
  };
  G.hs_plane_dist = function () {
    var n = pick([[1, 2, 2, 3], [2, 1, 2, 3], [2, 2, 1, 3], [1, 4, 8, 9], [2, 3, 6, 7], [0, 3, 4, 5]]), s = pick([1, -1]), a = s * n[0], b = n[1], c = n[2], L = n[3];
    var p = [ri(-4, 4), ri(-4, 4), ri(-4, 4)], d = ri(0, 4), e = pick([1, -1]) * d * L - a * p[0] - b * p[1] - c * p[2];
    var pl = ""; [[a, "x"], [b, "y"], [c, "z"], [e, ""]].forEach(function (t) { if (!t[0]) return; var v = Math.abs(t[0]), body = (v === 1 && t[1] ? "" : v) + t[1]; pl += pl ? (t[0] < 0 ? " - " : " + ") + body : (t[0] < 0 ? "-" : "") + body; });
    return inp(P("Jaká je vzdálenost bodu $[" + p.join(", ") + "]$ od roviny $" + pl + " = 0$?"), String(d),
      "Dosadíme do $\\frac{|ax_0 + by_0 + cz_0 + d|}{\\sqrt{a^2 + b^2 + c^2}}$: čitatel je $" + d * L + "$, jmenovatel $\\sqrt{" + (a * a + b * b + c * c) + "} = " + L + "$. Vzdálenost je $" + d + "$.");
  };

  // ==== Kuželosečky ===========================================================================
  G.hs_circle_ce = function () {
    var m = nz(-5, 5), n = ri(-5, 5), r = ri(1, 6), c = m * m + n * n - r * r;
    var eq = "x^2 + y^2" + sgn0(-2 * m) + (m ? "x" : "") + sgn0(-2 * n) + (n ? "y" : "") + sgn0(c) + " = 0";
    var T = function (a, b, R) { return "$S = " + pt2(a, b) + "$, $r = " + R + "$"; };
    return withFig(gr(m - r - 1, m + r + 1, n - r - 1, n + r + 1, ["circle=" + m + "," + n + "," + r, "pt=" + m + "," + n], true),
      mc(P("Jaký střed a poloměr má kružnice $" + eq.replace(/ \+ 0x| \+ 0y/g, "") + "$?"), T(m, n, r), [T(-m, -n, r), T(m, n, r * r), T(2 * m, 2 * n, r), T(n, m, r)].filter(function (s) { return s !== T(m, n, r); }).slice(0, 3),
        "Doplníme na čtverce: $(x " + (m < 0 ? "+ " + (-m) : "- " + m) + ")^2 + (y " + (n < 0 ? "+ " + (-n) : "- " + n) + ")^2 = " + r * r + "$. Střed je $" + pt2(m, n) + "$, poloměr $" + r + "$."));
  };
  G.hs_circle_pt = function () {
    var m = ri(-4, 4), n = ri(-4, 4), T = pick([[3, 4], [5, 12], [6, 8], [1, 2], [2, 2], [0, 3]]), x = m + pick([1, -1]) * T[0], y = n + pick([1, -1]) * T[1], r2 = T[0] * T[0] + T[1] * T[1];
    return inp(P("Kružnice má střed $" + pt2(m, n) + "$ a prochází bodem $" + pt2(x, y) + "$. Jaký má poloměr?"), sqAns(r2),
      "Poloměr je vzdálenost středu od bodu: $\\sqrt{" + T[0] * T[0] + " + " + T[1] * T[1] + "} = " + sqTeX(r2) + "$.");
  };
  G.hs_ellipse = function () {
    var a = ri(2, 6), b = ri(1, a - 1), e2 = a * a - b * b, k = ri(0, 2);
    var eq = (b * b === 1 ? "" : b * b) + "x^2 + " + (a * a) + "y^2 = " + a * a * b * b;
    var spec = gr(-a - 1, a + 1, -b - 1, b + 1, ["param=" + a + "*cos(t)," + b + "*sin(t),0,6.2832", "pt=" + N(-Math.sqrt(e2)) + ",0", "pt=" + N(Math.sqrt(e2)) + ",0"], true);
    if (k === 0) return withFig(spec, inp(P("Jak dlouhá je hlavní poloosa elipsy $" + eq + "$?"), String(a),
      "Vydělíme $" + a * a * b * b + "$: $\\frac{x^2}{" + a * a + "} + \\frac{y^2}{" + b * b + "} = 1$. Hlavní poloosa je $" + a + "$."));
    if (k === 1) return withFig(spec, inp(P("Jaká je excentricita (vzdálenost ohniska od středu) elipsy $" + eq + "$?"), sqAns(e2),
      "$\\frac{x^2}{" + a * a + "} + \\frac{y^2}{" + b * b + "} = 1$: $e = \\sqrt{" + a * a + " - " + b * b + "} = " + sqTeX(e2) + "$."));
    return withFig(spec, inp(P("Bod $X$ leží na elipse $" + eq + "$. Kolik je součet jeho vzdáleností od ohnisek?"), String(2 * a),
      "$\\frac{x^2}{" + a * a + "} + \\frac{y^2}{" + b * b + "} = 1$ a součet vzdáleností od ohnisek je $2a = " + 2 * a + "$."));
  };
  G.hs_parab_f = function () {
    var p = nz(-6, 6), vert = Math.random() < 0.5, F = fr(p, 2);
    var spec = vert ? gr(-5, 5, -5, 5, ["f=x^2/(" + 2 * p + ")", "pt=0," + N(p / 2), "hline=" + N(-p / 2)], true) : gr(-5, 5, -5, 5, ["param=t^2/(" + 2 * p + "),t,-5,5", "pt=" + N(p / 2) + ",0", "vline=" + N(-p / 2)], true);
    return withFig(spec, inp(P("Kde leží ohnisko paraboly $" + (vert ? "x^2 = " + (2 * p) + "y" : "y^2 = " + (2 * p) + "x") + "$? Zadejte jeho nenulovou souřadnici."), ans(F),
      "$2p = " + 2 * p + "$, tedy $p = " + p + "$ a ohnisko je $" + (vert ? "\\left[0, \\frac p2\\right] = \\left[0, " + ft(F) + "\\right]" : "\\left[\\frac p2, 0\\right] = \\left[" + ft(F) + ", 0\\right]") + "$."));
  };
  G.hs_hyper_asym = function () {
    var a = ri(1, 6), b = ri(1, 6), k = fr(b, a);
    return withFig(gr(-7, 7, -7, 7, ["param=" + a + "*cosh(t)," + b + "*sinh(t),-2.5,2.5", "param=-" + a + "*cosh(t)," + b + "*sinh(t),-2.5,2.5", "line=0,0," + a + "," + b + ",muted", "line=0,0," + a + ",-" + b + ",muted"], true),
      inp(P("Hyperbola $\\dfrac{x^2}{" + a * a + "} - \\dfrac{y^2}{" + b * b + "} = 1$ má asymptoty $y = \\pm kx$. Určete $k > 0$."), ans(k),
        "$a = " + a + "$, $b = " + b + "$ a asymptoty jsou $y = \\pm\\frac bax$, tedy $k = " + ft(k) + "$."));
  };
  G.hs_line_circle = function () {
    var r = ri(1, 5), n = pick([[3, 4, 5], [4, 3, 5], [1, 0, 1], [0, 1, 1]]), d = pick([r - 1, r, r + 1, Math.max(0, r - 2), r + 2]), c = pick([1, -1]) * d * n[2], cnt = d < r ? 2 : d === r ? 1 : 0;
    var spec = gr(-r - 3, r + 3, -r - 3, r + 3, ["circle=0,0," + r, n[1] ? "f=(" + (-c) + "-(" + n[0] + ")*x)/(" + n[1] + ")" : "vline=" + (-c / n[0])], true);
    return withFig(spec, inp(P("Kolik společných bodů má kružnice $x^2 + y^2 = " + r * r + "$ s přímkou $" + genLine(n[0], n[1], c) + "$?"), String(cnt),
      "Vzdálenost středu od přímky je $\\frac{" + Math.abs(c) + "}{" + n[2] + "} = " + d + "$ a poloměr je $" + r + "$. " + (cnt === 2 ? "Vzdálenost je menší, přímka je sečna: dva body." : cnt === 1 ? "Jsou stejné, přímka je tečna: jeden bod." : "Vzdálenost je větší, přímka je vnější: žádný bod.")));
  };

  // ==== Komplexní čísla =======================================================================
  function cT(a, b) {                               // a + bi in TeX
    if (b === 0) return String(a);
    var bi = (Math.abs(b) === 1 ? "" : Math.abs(b)) + "i";
    return a === 0 ? (b < 0 ? "-" : "") + bi : a + (b < 0 ? " - " : " + ") + bi;
  }
  G.hs_cmul = function () {
    var a = nz(-5, 5), b = nz(-5, 5), c = nz(-5, 5), d = nz(-5, 5), re = a * c - b * d, im = a * d + b * c;
    var o = function (x, y) { return "$" + cT(x, y) + "$"; };
    return mc(P("Vypočtěte $(" + cT(a, b) + ")(" + cT(c, d) + ")$."), o(re, im), [o(a * c + b * d, im), o(re, -im), o(a * c, b * d), o(re, a * d - b * c)].filter(function (s) { return s !== o(re, im); }).slice(0, 3),
      "Roznásobíme a $i^2 = -1$: $" + (a * c) + " " + sgn(a * d).trim() + "i " + sgn(b * c).trim() + "i " + sgn(-b * d).trim() + " = " + cT(re, im) + "$.");
  };
  G.hs_ipow = function () {
    var n = ri(5, 199), r = n % 4, V = ["1", "i", "-1", "-i"];
    return mc(P("Vypočtěte $i^{" + n + "}$."), "$" + V[r] + "$", V.filter(function (_, k) { return k !== r; }).map(function (v) { return "$" + v + "$"; }),
      "Mocniny $i$ se opakují po čtyřech a $" + n + " = 4\\cdot" + Math.floor(n / 4) + " + " + r + "$, takže $i^{" + n + "} = i^{" + r + "} = " + V[r] + "$.");
  };
  G.hs_cabs = function () {
    var T = pick([[3, 4], [5, 12], [6, 8], [8, 15], [1, 1], [1, 2], [2, 3], [1, 3]]), a = pick([1, -1]) * T[0], b = pick([1, -1]) * T[1];
    return withFig(gr(Math.min(a, 0) - 1.5, Math.max(a, 0) + 1.5, Math.min(b, 0) - 1.5, Math.max(b, 0) + 1.5, ["vec=" + a + "," + b + ",ex", "seg=" + a + ",0," + a + "," + b + ",muted"], true),
      inp(P("Vypočtěte $|" + cT(a, b) + "|$."), sqAns(a * a + b * b), "$|z| = \\sqrt{" + a * a + " + " + b * b + "} = " + sqTeX(a * a + b * b) + "$: vzdálenost bodu $" + pt2(a, b) + "$ od počátku."));
  };
  G.hs_cdiv = function () {
    var e = nz(-4, 4), f = nz(-4, 4), c = nz(-3, 3), d = nz(-3, 3), a = e * c - f * d, b = e * d + f * c, o = function (x, y) { return "$" + cT(x, y) + "$"; };
    return mc(P("Vypočtěte $\\dfrac{" + cT(a, b) + "}{" + cT(c, d) + "}$."), o(e, f), [o(e, -f), o(-e, f), o(f, e), o(-e, -f)].filter(function (s) { return s !== o(e, f); }).slice(0, 3),
      "Rozšíříme číslem $" + cT(c, -d) + "$: jmenovatel bude $" + (c * c + d * d) + "$ a podíl $" + cT(e, f) + "$. Zkouška: $(" + cT(e, f) + ")(" + cT(c, d) + ") = " + cT(a, b) + "$.");
  };
  G.hs_cquad = function () {
    var m = ri(-4, 4), n = ri(1, 4), p = -2 * m, q = m * m + n * n, o = function (x, y) { return "$x = " + (x === 0 ? "" : x + " ") + "\\pm " + (y === 1 ? "" : y) + "i$"; };
    return withFig(gr(m - 3, m + 3, -n - 1.5, n + 1.5, ["pt=" + m + "," + n, "pt=" + m + ",-" + n], true),
      mc(P("Vyřešte v $\\mathbb C$ rovnici $" + poly([[1, 2], [p, 1], [q, 0]]) + " = 0$."), o(m, n), [o(-m, n), o(m, 2 * n), o(m, n + 1), o(-m, n + 1)].filter(function (s) { return s !== o(m, n); }).slice(0, 3),
        "$D = " + (p * p) + " - " + 4 * q + " = " + (p * p - 4 * q) + "$, $\\sqrt D = " + 2 * n + "i$ a $x = \\frac{" + (-p) + "\\pm" + 2 * n + "i}{2} = " + (m === 0 ? "" : m) + "\\pm" + (n === 1 ? "" : n) + "i$."));
  };
  G.hs_carg = function () {
    var R = { 0: ["2", "0"], 30: ["\\sqrt3", "1"], 45: ["\\sqrt2", "\\sqrt2"], 60: ["1", "\\sqrt3"], 90: ["0", "2"] }, d = pick([0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]);
    var q = Math.floor(d / 90) % 4, base = d % 90, re, im;
    var c0 = R[base][0], s0 = R[base][1];
    if (q === 0) { re = c0; im = s0; } else if (q === 1) { re = "-" + s0; im = c0; } else if (q === 2) { re = "-" + c0; im = "-" + s0; } else { re = s0; im = "-" + c0; }
    var clean = function (v) { return v === "-0" ? "0" : v; };
    re = clean(re); im = clean(im);
    var neg = im.charAt(0) === "-", ab = neg ? im.slice(1) : im, ip = (ab === "1" ? "" : ab) + (ab.indexOf("sqrt") >= 0 ? "\\,i" : "i"), z;
    if (im === "0") z = re;
    else if (re === "0") z = (neg ? "-" : "") + ip;
    else z = re + (neg ? " - " : " + ") + ip;
    var t = d * Math.PI / 180;
    return withFig(gr(-2.6, 2.6, -2.6, 2.6, ["circle=0,0,2", "vec=" + N(2 * Math.cos(t)) + "," + N(2 * Math.sin(t)) + ",ex"], true),
      inp(P("Jaký argument v intervalu $[0, 2\\pi)$ má komplexní číslo $z = " + z + "$?"), piAns(d, 180),
        "$|z| = 2$ a bod $[" + re + ", " + im + "]$ svírá s kladnou reálnou poloosou úhel $" + piTeX(d, 180) + "$."));
  };

  // ==== Kombinatorika =========================================================================
  function C(n, k) { if (k < 0 || k > n) return 0; var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }
  function fact(n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }
  G.hs_binom = function () {
    var n = ri(4, 14), k = ri(1, n - 1);
    return inp(P("Vypočtěte $\\dbinom{" + n + "}{" + k + "}$."), String(C(n, k)),
      "$\\binom{" + n + "}{" + k + "} = \\frac{" + n + "!}{" + k + "!\\," + (n - k) + "!} = " + C(n, k) + "$.");
  };
  G.hs_count = function () {
    var k = ri(0, 4), n = ri(5, 12), m = ri(2, Math.min(4, n - 1));
    if (k === 0) { var v = fact(n) / fact(n - m); return inp(P("Na trati běží $" + n + "$ závodníků. Kolika způsoby se může rozdělit prvních $" + m + "$ míst?"), String(v), "Záleží na pořadí: variace $" + m + "$ z $" + n + "$, $\\frac{" + n + "!}{" + (n - m) + "!} = " + v + "$."); }
    if (k === 1) return inp(P("Ze třídy o $" + (n + 10) + "$ žácích vybíráme $" + m + "$ člennou delegaci. Kolik je možností?"), String(C(n + 10, m)), "Na pořadí nezáleží: $\\binom{" + (n + 10) + "}{" + m + "} = " + C(n + 10, m) + "$.");
    if (k === 2) return inp(P("Kolik přímek určuje $" + n + "$ bodů v rovině, z nichž žádné tři neleží na přímce?"), String(C(n, 2)), "Každá dvojice bodů určuje jednu přímku: $\\binom{" + n + "}{2} = " + C(n, 2) + "$.");
    if (k === 3) return inp(P("Kolik úhlopříček má konvexní " + n + "-úhelník?"), String(n * (n - 3) / 2), "Spojnic vrcholů je $\\binom{" + n + "}2 = " + C(n, 2) + "$, z toho $" + n + "$ jsou strany: $" + n * (n - 3) / 2 + "$ úhlopříček.");
    var d = ri(4, 7); return inp(P("Kolika způsoby lze postavit do řady $" + d + "$ různých knih?"), String(fact(d)), "Permutace: $" + d + "! = " + fact(d) + "$.");
  };
  G.hs_binom_coef = function () {
    var n = ri(3, 6), a = pick([1, 2, 3, -1, -2]), b = pick([1, 2, -1, -2, 3]), k = ri(1, n - 1), c = C(n, k) * Math.pow(a, k) * Math.pow(b, n - k);
    return inp(P("Jaký koeficient má $x^{" + k + "}$ v rozvoji $(" + poly([[a, 1], [b, 0]]) + ")^{" + n + "}$?"), String(c),
      "Člen s $x^{" + k + "}$ je $\\binom{" + n + "}{" + k + "}(" + poly([[a, 1]]) + ")^{" + k + "}\\cdot" + par(b) + "^{" + (n - k) + "}$, koeficient $" + C(n, k) + "\\cdot" + par(Math.pow(a, k)) + "\\cdot" + par(Math.pow(b, n - k)) + " = " + c + "$.");
  };
  G.hs_word_perm = function () {
    var w = pick(["ANNA", "MAMA", "OKNO", "KOLO", "BABKA", "LOPATA", "ANANAS", "KAKAO", "SESTRA", "MATEMATIKA", "PAPOUŠEK"]), cnt = {}, den = 1, parts = [];
    w.split("").forEach(function (ch) { cnt[ch] = (cnt[ch] || 0) + 1; });
    Object.keys(cnt).forEach(function (ch) { if (cnt[ch] > 1) { den *= fact(cnt[ch]); parts.push(ch + "\\ " + cnt[ch] + "\\times"); } });
    var v = fact(w.length) / den;
    return inp(P("Kolik různých „slov“ (i nesmyslných) vznikne přeházením všech písmen slova " + w + "?"), String(v),
      "Permutace s opakováním: $\\frac{" + w.length + "!}{" + Object.keys(cnt).filter(function (c) { return cnt[c] > 1; }).map(function (c) { return cnt[c] + "!"; }).join("\\cdot") + "} = " + v + "$, protože se opakují písmena " + Object.keys(cnt).filter(function (c) { return cnt[c] > 1; }).join(", ") + ".");
  };

  // ==== Pravděpodobnost a statistika ==========================================================
  G.hs_dice = function () {
    var k = ri(0, 3), s = ri(3, 11), d = ri(1, 4), fav, t;
    if (k === 0) { fav = function (a, b) { return a + b === s; }; t = "součet bude $" + s + "$"; }
    else if (k === 1) { fav = function (a, b) { return a + b >= s; }; t = "součet bude aspoň $" + s + "$"; }
    else if (k === 2) { fav = function (a, b) { return Math.abs(a - b) === d; }; t = "čísla na kostkách se budou lišit o $" + d + "$"; }
    else { fav = function (a, b) { return a === b; }; t = "na obou kostkách padne stejné číslo"; }
    var m = 0; for (var a = 1; a <= 6; a++) for (var b = 1; b <= 6; b++) if (fav(a, b)) m++;
    return withFig(dice(fav), inp(P("Hodíme dvěma kostkami. Jaká je pravděpodobnost, že " + t + "?"), ans(fr(m, 36)),
      "Ze $36$ stejně možných dvojic je příznivých $" + m + "$: $P = \\frac{" + m + "}{36} = " + ft(fr(m, 36)) + "$."));
  };
  G.hs_coins = function () {
    var n = ri(2, 6), k = ri(0, n);
    return inp(P("Hodíme $" + n + "$ mincemi. Jaká je pravděpodobnost, že padne přesně $" + k + "$krát líc?"), ans(fr(C(n, k), Math.pow(2, n))),
      "Všech výsledků je $2^{" + n + "} = " + Math.pow(2, n) + "$ a příznivých $\\binom{" + n + "}{" + k + "} = " + C(n, k) + "$: $P = " + ft(fr(C(n, k), Math.pow(2, n))) + "$.");
  };
  G.hs_urn = function () {
    var r = ri(2, 8), w = ri(2, 8), k = ri(0, 2), N2 = C(r + w, 2), m, t;
    if (k === 0) { m = C(r, 2); t = "obě červené"; } else if (k === 1) { m = C(w, 2); t = "obě bílé"; } else { m = r * w; t = "jedna červená a jedna bílá"; }
    return inp(P("V osudí je $" + r + "$ červených a $" + w + "$ bílých koulí. Vytáhneme najednou dvě. Jaká je pravděpodobnost, že budou " + t + "?"), ans(fr(m, N2)),
      "Dvojic je $\\binom{" + (r + w) + "}2 = " + N2 + "$, příznivých $" + m + "$: $P = " + ft(fr(m, N2)) + "$.");
  };
  G.hs_binom_p = function () {
    var p = pick([[1, 6, "šestka", "kostkou"], [1, 2, "líc", "mincí"], [1, 3, "číslo dělitelné třemi", "kostkou"]]), n = ri(2, 5), k = ri(0, n);
    var num = C(n, k) * Math.pow(p[0], k) * Math.pow(p[1] - p[0], n - k), den = Math.pow(p[1], n), f = fr(num, den);
    return inp(P("Hodíme $" + n + "$krát " + p[3] + ". Jaká je pravděpodobnost, že " + p[2] + " padne přesně $" + k + "$krát?"), ans(f),
      "$\\binom{" + n + "}{" + k + "}\\left(\\frac{" + p[0] + "}{" + p[1] + "}\\right)^{" + k + "}\\left(\\frac{" + (p[1] - p[0]) + "}{" + p[1] + "}\\right)^{" + (n - k) + "} = " + ft(f) + "$.");
  };
  G.hs_shooters = function () {
    var a = ri(3, 9), b = ri(3, 9), k = ri(0, 2), v, t;
    if (k === 0) { v = a * b; t = "zasáhnou oba"; } else if (k === 1) { v = 100 - (10 - a) * (10 - b); t = "cíl bude zasažen aspoň jednou"; } else { v = a * (10 - b) + (10 - a) * b; t = "zasáhne právě jeden"; }
    var s = v === 100 ? "1" : "0." + (v < 10 ? "0" + v : String(v)).replace(/0$/, "");
    return inp(P("Dva střelci střílejí nezávisle, první zasáhne s pravděpodobností $0{,}" + a + "$, druhý $0{,}" + b + "$. Jaká je pravděpodobnost, že " + t + "? Zapište desetinným číslem."), s,
      (k === 0 ? "$0{,}" + a + "\\cdot0{,}" + b + "$" : k === 1 ? "$1 - 0{,}" + (10 - a) + "\\cdot0{,}" + (10 - b) + "$" : "$0{,}" + a + "\\cdot0{,}" + (10 - b) + " + 0{,}" + (10 - a) + "\\cdot0{,}" + b + "$") + " $= " + cz(s) + "$.");
  };
  G.hs_stats = function () {
    var n = pick([5, 6, 7, 8]), xs = []; for (var i = 0; i < n; i++) xs.push(ri(1, 12));
    var k = ri(0, 1), srt = xs.slice().sort(function (a, b) { return a - b; });
    if (k === 0) { var s = xs.reduce(function (a, b) { return a + b; }, 0), f = fr(s, n);
      return withFig("x=0.2.." + (n + 0.8) + "; y=0..13; " + xs.map(function (v, j) { return "fill=" + [j + 0.65, 0, j + 1.35, 0, j + 1.35, v, j + 0.65, v].map(N).join(",") + ",def"; }).join("; ") + "; hline=" + N(s / n),
        inp(P("Určete aritmetický průměr hodnot $" + xs.join(", ") + "$."), ans(f), "Součet je $" + s + "$ a hodnot je $" + n + "$: $\\bar x = " + fq(s, n) + "$.")); }
    var med = n % 2 ? fr(srt[(n - 1) / 2], 1) : fr(srt[n / 2 - 1] + srt[n / 2], 2);
    return inp(P("Určete medián hodnot $" + xs.join(", ") + "$."), ans(med),
      "Seřadíme: $" + srt.join(", ") + "$. " + (n % 2 ? "Prostřední hodnota je $" + ft(med) + "$." : "Průměr dvou prostředních hodnot je $\\frac{" + srt[n / 2 - 1] + " + " + srt[n / 2] + "}{2} = " + ft(med) + "$."));
  };

  // ==== Úvod do analýzy =======================================================================
  G.hs_lim_fac = function () {
    var a = ri(-4, 4), b, c; do { b = ri(-5, 5); c = ri(-5, 5); } while (b === a || c === a || b === c);
    if (Math.random() < 0.5) return withFig(gr(a - 3, a + 3, a - b - 4, a - b + 4, ["f=x-(" + b + ")", "hole=" + a + "," + (a - b)]),
      inp(P("Vypočtěte $\\displaystyle\\lim_{x\\to" + a + "}\\frac{" + poly([[1, 2], [-(a + b), 1], [a * b, 0]]) + "}{" + poly([[1, 1], [-a, 0]]) + "}$."), String(a - b),
        "Čitatel je $" + lin(a) + lin(b) + "$, po zkrácení $" + lin(a) + "$ zbude $" + poly([[1, 1], [-b, 0]]) + "\\to" + (a - b) + "$."));
    var L = fr(a - b, a - c);
    return inp(P("Vypočtěte $\\displaystyle\\lim_{x\\to" + a + "}\\frac{" + poly([[1, 2], [-(a + b), 1], [a * b, 0]]) + "}{" + poly([[1, 2], [-(a + c), 1], [a * c, 0]]) + "}$."), ans(L),
      "$\\frac{" + lin(a) + lin(b) + "}{" + lin(a) + lin(c) + "} = \\frac{" + poly([[1, 1], [-b, 0]]) + "}{" + poly([[1, 1], [-c, 0]]) + "}\\to" + fq(a - b, a - c) + "$.");
  };
  G.hs_lim_inf = function () {
    var a = nz(-6, 6), d = nz(1, 6), deg = pick([1, 2, 3]), low = Math.random() < 0.25;
    var num = low ? (deg === 1 ? String(a) : poly([[a, deg - 1], [ri(-5, 5), 0]])) :poly([[a, deg], [ri(-5, 5), deg - 1 > 0 ? deg - 1 : 0]].concat(deg - 1 > 0 ? [[ri(-5, 5), 0]] : []));
    var L = low ? fr(0, 1) : fr(a, d);
    return inp(P("Vypočtěte $\\displaystyle\\lim_{x\\to\\infty}\\frac{" + num + "}{" + poly([[d, deg], [ri(1, 7), 0]]) + "}$."), ans(L),
      low ? "Čitatel má nižší stupeň než jmenovatel, limita je $0$." : "Vydělíme $x^{" + deg + "}$; rozhodují vedoucí členy: $" + fq(a, d) + "$.");
  };
  G.hs_deriv = function () {
    var n = ri(2, 4), terms = [], dterms = [], ans_ = [], show = [];
    for (var e = n; e >= 0; e--) { var c = e === n ? nz(-5, 5) : ri(-5, 5); if (c) { terms.push([c, e]); if (e) { dterms.push([c * e, e - 1]); ans_.push(c * e + (e - 1 ? "*x^" + (e - 1) : "")); } } }
    var extra = pick(["", "sin", "cos", "exp"]), k = nz(-3, 3), f = poly(terms), d = poly(dterms), A = ans_.join("+").replace(/\+-/g, "-") || "0";
    var term = function (c, t) { return (c < 0 ? " - " : " + ") + (Math.abs(c) === 1 ? "" : Math.abs(c)) + t; };
    if (extra === "sin") { f += term(k, "\\sin x"); d += term(k, "\\cos x"); A += "+(" + k + ")*cos(x)"; }
    if (extra === "cos") { f += term(k, "\\cos x"); d += term(-k, "\\sin x"); A += "-(" + k + ")*sin(x)"; }
    if (extra === "exp") { f += term(k, "e^x"); d += term(k, "e^x"); A += "+(" + k + ")*e^x"; }
    return expr(P("Derivujte $f(x) = " + f + "$."), A, "Derivujeme člen po členu ($(x^n)' = nx^{n-1}$, $(\\sin x)' = \\cos x$, $(\\cos x)' = -\\sin x$, $(e^x)' = e^x$): $f'(x) = " + d + "$.", [], "$" + d + "$");
  };
  G.hs_tangent = function () {
    var a = nz(-2, 2), b = ri(-4, 4), c = ri(-4, 4), x0 = ri(-2, 2), y0 = a * x0 * x0 + b * x0 + c, k = 2 * a * x0 + b, q = y0 - k * x0;
    return withFig(gr(x0 - 3, x0 + 3, y0 - 6, y0 + 6, ["f=" + a + "*x^2+(" + b + ")*x+(" + c + ")", "tan=" + a + "*x^2+(" + b + ")*x+(" + c + ")," + x0, "pt=" + x0 + "," + y0]),
      expr(P("Napište rovnici tečny ke grafu $y = " + poly([[a, 2], [b, 1], [c, 0]]) + "$ v bodě $" + pt2(x0, y0) + "$ ve tvaru $y = \\dots$"), k + "*x+(" + q + ")",
        "$y' = " + poly([[2 * a, 1], [b, 0]]) + "$, směrnice v bodě $" + x0 + "$ je $" + k + "$: $y = " + y0 + (k < 0 ? " - " : " + ") + Math.abs(k) + "(x - " + par(x0) + ") = " + poly([[k, 1], [q, 0]]) + "$.", [], "$y = " + poly([[k, 1], [q, 0]]) + "$"));
  };
  G.hs_extremum = function () {
    var p = ri(1, 3), s = pick([1, -1]), max = Math.random() < 0.5;
    // f = s*(x^3 - 3p^2 x): s=1 → max at -p, min at p
    var at = (s === 1) === max ? -p : p;
    return withFig(gr(-p - 1.5, p + 1.5, -2 * p * p * p - 2, 2 * p * p * p + 2, ["f=" + s + "*(x^3-" + 3 * p * p + "*x)", "pt=" + (-p) + "," + (s * 2 * p * p * p), "pt=" + p + "," + (-s * 2 * p * p * p)]),
      inp(P("Ve kterém bodě má funkce $f(x) = " + poly([[s, 3], [-3 * p * p * s, 1]]) + "$ lokální " + (max ? "maximum" : "minimum") + "?"), String(at),
        "$f'(x) = " + poly([[3 * s, 2], [-3 * p * p * s, 0]]) + " = 0$ pro $x = \\pm" + p + "$. Derivace mění znaménko " + (max ? "z $+$ na $-$" : "z $-$ na $+$") + " v bodě $" + at + "$, tam je " + (max ? "maximum" : "minimum") + "."));
  };
  G.hs_defint = function () {
    var c = nz(-3, 3), n = ri(1, 3), d = ri(-3, 3), a = ri(-2, 1), b = ri(a + 1, 3);
    var num = c * (Math.pow(b, n + 1) - Math.pow(a, n + 1)) + d * (n + 1) * (b - a), v = fr(num, n + 1), cf = fr(c, n + 1);
    var lo = 0, hi = 0; for (var i = 0; i <= 20; i++) { var x = a - 1 + (b - a + 2) * i / 20, y = c * Math.pow(x, n) + d; lo = Math.min(lo, y); hi = Math.max(hi, y); }
    var Ft = (cf.p === cf.q ? "" : cf.p === -cf.q ? "-" : ft(cf)) + "x^{" + (n + 1) + "}" + (d ? (d < 0 ? " - " : " + ") + (Math.abs(d) === 1 ? "" : Math.abs(d)) + "x" : "");
    return withFig(gr(a - 1, b + 1, lo - 1, hi + 1, ["f=" + c + "*x^" + n + "+(" + d + ")", "shade=" + c + "*x^" + n + "+(" + d + "),0," + a + "," + b]),
      inp(P("Vypočtěte $\\displaystyle\\int_{" + a + "}^{" + b + "}(" + poly([[c, n], [d, 0]]) + ")\\,\\mathrm dx$."), ans(v),
        "Primitivní funkce je $F(x) = " + Ft + "$ a $F(" + b + ") - F(" + par(a) + ") = " + ft(v) + "$."));
  };
  G.hs_area_par = function () {
    var k = ri(1, 4), A = fr(4 * k * k * k, 3);
    return withFig(gr(-k - 1, k + 1, -1, k * k + 1, ["f=" + k * k + "-x^2", "shade=" + k * k + "-x^2,0," + (-k) + "," + k]),
      inp(P("Vypočtěte obsah obrazce omezeného parabolou $y = " + k * k + " - x^2$ a osou $x$."), ans(A),
        "Parabola protíná osu v $\\pm" + k + "$: $\\int_{-" + k + "}^{" + k + "}(" + k * k + " - x^2)\\,\\mathrm dx = \\left[" + k * k + "x - \\frac{x^3}3\\right]_{-" + k + "}^{" + k + "} = " + ft(A) + "$."));
  };
});
