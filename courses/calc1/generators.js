/* Random question generators for this course. In lessons.txt, "? gen | name" calls G.name.
   Each generator returns a fresh question object (see app/js/genkit.js for the helpers in K). */
CUSP_GEN.define("calc1", function (K, G) {
  "use strict";
  var P = K.P, ans = K.ans, dec = K.dec, expr = K.expr, fr = K.fr, fs = K.fs, ft = K.ft, gcd = K.gcd, inp = K.inp, ivl = K.ivl, lin = K.lin, mc = K.mc, nz = K.nz, par = K.par, pick = K.pick, poly = K.poly, ri = K.ri, set = K.set, sgn = K.sgn, withFig = K.withFig;

  // ---- Reálná čísla ----------------------------------------------------------
  G.sup_set = function () {
    var a = ri(2, 5), b = ri(1, 4), ask = pick(["sup", "inf"]);
    var set = "\\left\\{\\dfrac{" + a + "n}{n+" + b + "} : n\\in\\mathbb N\\right\\}";
    var inf = fr(a, 1 + b);
    return withFig("x=0..20; seq=" + a + "*n/(n+" + b + "); hline=" + a + "; hline=" + a + "/" + (1 + b), inp(P("Určete $\\" + ask + set + "$."), ask === "sup" ? String(a) : ans(inf),
      "$\\dfrac{" + a + "n}{n+" + b + "} = " + a + " - \\dfrac{" + a * b + "}{n+" + b + "}$ roste s $n$. Supremum je $" + a + "$ (nenabývá se), infimum je hodnota pro $n=1$: $" + ft(inf) + "$."));
  };

  // ---- Funkce -----------------------------------------------------------------
  G.inverse_lin = function () {
    var a = pick([2, 3, 4, 5, -2, -3]), b = ri(-5, 5), x0 = ri(-4, 6), c = a * x0 + b;
    return withFig((function () { var lo = Math.min(x0, c, 0) - 2, hi = Math.max(x0, c, 0) + 2; return "x=" + lo + ".." + hi + "; y=" + lo + ".." + hi + "; aspect=equal; f=(" + a + ")*x+(" + b + "); f=(x-(" + b + "))/(" + a + "); f=x; pt=" + x0 + "," + c + "; pt=" + c + "," + x0; })(), inp(P("Pro $f(x) = " + poly([[a, 1], [b, 0]]) + "$ určete $f^{-1}(" + c + ")$."), String(x0),
      "Hledáme $x$ s $f(x) = " + c + "$: $x = \\dfrac{" + (c - b) + "}{" + a + "} = " + x0 + "$."));
  };
  G.compose = function () {
    var a = ri(-3, 3), b = ri(2, 4), c = ri(-3, 3), k = ri(-2, 3), g = b * k + c, v = g * g + a;
    return inp(P("Pro $f(x) = " + poly([[1, 2], [a, 0]]) + "$ a $g(x) = " + poly([[b, 1], [c, 0]]) + "$ spočtěte $f(g(" + k + "))$."), String(v),
      "$g(" + k + ") = " + g + "$ a $f(" + g + ") = " + par(g) + "^2 " + (a < 0 ? "- " + (-a) : "+ " + a) + " = " + v + "$.");
  };

  // ---- Posloupnosti -------------------------------------------------------------
  G.seq_rat = function () {
    var a = nz(-6, 6), b = ri(-5, 5), c = ri(-5, 5), d = ri(1, 6), e = ri(1, 9), L = fr(a, d);
    return withFig("x=0..30; seq=((" + a + ")*n^2+(" + b + ")*n+(" + c + "))/((" + d + ")*n^2+(" + e + ")); hline=" + a + "/" + d, inp(P("Určete $\\lim\\limits_{n\\to\\infty}\\dfrac{" + poly([[a, 2], [b, 1], [c, 0]], "n") + "}{" + poly([[d, 2], [e, 0]], "n") + "}$."), ans(L),
      "Vydělíme čitatele i jmenovatele $n^2$; zbude podíl vedoucích koeficientů $\\frac{" + a + "}{" + d + "} = " + ft(L) + "$."));
  };
  G.seq_sqrt = function () {
    var a = ri(1, 8), L = fr(a, 2);
    return withFig("x=0..30; seq=sqrt(n^2+" + a + "*n)-n; hline=" + a + "/2", inp(P("Určete $\\lim\\limits_{n\\to\\infty}\\left(\\sqrt{n^2+" + (a === 1 ? "" : a) + "n}-n\\right)$."), ans(L),
      "Rozšíříme: $\\dfrac{" + (a === 1 ? "" : a) + "n}{\\sqrt{n^2+" + (a === 1 ? "" : a) + "n}+n} = \\dfrac{" + a + "}{\\sqrt{1+" + a + "/n}+1}\\to" + ft(L) + "$."));
  };
  G.seq_e = function () {
    var a = pick([2, 3, 4, -1, -2, -3]);
    var ae = a === -1 ? "-e" : a + "e";
    return withFig("x=0..30; seq=(1+(" + a + ")/n)^n; hline=E^(" + a + ")", mc(P("Určete $\\lim\\limits_{n\\to\\infty}\\left(1" + (a < 0 ? "-" : "+") + "\\dfrac{" + Math.abs(a) + "}{n}\\right)^n$."),
      "$e^{" + a + "}$", ["$e$", "$" + ae + "$", "$1$"],
      "Platí $\\left(1+\\frac{a}{n}\\right)^n\\to e^a$, zde $a = " + a + "$. Výraz „$1^\\infty$“ je neurčitý."));
  };
  G.limsup_trig = function () {
    var a = ri(2, 6), fn = pick(["cos", "sin"]), up = Math.random() < 0.5;
    return withFig("x=0..16; seq=" + a + "*" + fn + "(n*pi/2); hline=" + (up ? a : -a), inp(P("Určete $\\" + (up ? "limsup" : "liminf") + "\\limits_{n\\to\\infty}\\," + a + "\\" + fn + "\\dfrac{n\\pi}{2}$."), String(up ? a : -a),
      "Členy se opakují s periodou $4$ a nabývají hodnot $-" + a + "$, $0$ a $" + a + "$; " + (up ? "největší" : "nejmenší") + " hromadný bod je $" + (up ? a : -a) + "$."));
  };

  // ---- Limita a spojitost funkce -----------------------------------------------
  G.lim_factor = function () {
    var c = nz(-5, 5);
    return withFig("x=" + (c - 4) + ".." + (c + 4) + "; f=(x^2-" + c * c + ")/(x-(" + c + ")); hole=" + c + "," + 2 * c, inp(P("Určete $\\lim\\limits_{x\\to " + c + "}\\dfrac{" + poly([[1, 2], [-c * c, 0]]) + "}{" + poly([[1, 1], [-c, 0]]) + "}$."), String(2 * c),
      "$" + poly([[1, 2], [-c * c, 0]]) + " = " + lin(c) + "(" + poly([[1, 1], [c, 0]]) + ")$, po zkrácení zbude $" + poly([[1, 1], [c, 0]]) + "\\to" + 2 * c + "$."));
  };
  G.lim_sin = function () {
    var a = ri(1, 7), b = ri(1, 7), L = fr(a, b);
    return withFig("x=-3..3; f=sin(" + a + "*x)/(" + b + "*x); hole=0," + a + "/" + b, inp(P("Určete $\\lim\\limits_{x\\to0}\\dfrac{\\sin " + (a === 1 ? "" : a) + "x}{" + (b === 1 ? "" : b) + "x}$."), ans(L),
      "$\\dfrac{\\sin " + a + "x}{" + b + "x} = \\dfrac{" + a + "}{" + b + "}\\cdot\\dfrac{\\sin " + a + "x}{" + a + "x}\\to" + ft(L) + "$."));
  };
  G.lim_exp = function () {
    var a = nz(-5, 5), b = ri(1, 6), L = fr(a, b);
    return withFig("x=" + (-2 / Math.abs(a)) + ".." + (2 / Math.abs(a)) + "; f=(exp((" + a + ")*x)-1)/(" + b + "*x); hole=0," + a + "/" + b, inp(P("Určete $\\lim\\limits_{x\\to0}\\dfrac{e^{" + poly([[a, 1]]) + "}-1}{" + (b === 1 ? "" : b) + "x}$."), ans(L),
      "$\\dfrac{e^{" + a + "x}-1}{" + b + "x} = \\dfrac{" + a + "}{" + b + "}\\cdot\\dfrac{e^{" + a + "x}-1}{" + a + "x}\\to" + ft(L) + "$."));
  };

  // ---- Derivace -------------------------------------------------------------------
  G.deriv_poly = function () {
    var a = nz(-3, 4), b = ri(-5, 5), c = ri(-6, 6), d = ri(-5, 5), k = ri(-2, 2);
    var v = 3 * a * k * k + 2 * b * k + c;
    return withFig((function () { var e = "(" + a + ")*x^3+(" + b + ")*x^2+(" + c + ")*x+(" + d + ")"; return "x=" + (k - 2.5) + ".." + (k + 2.5) + "; f=" + e + "; tan=" + e + "," + k + "; pt=" + k + "," + (a * k * k * k + b * k * k + c * k + d); })(), inp(P("Pro $f(x) = " + poly([[a, 3], [b, 2], [c, 1], [d, 0]]) + "$ spočtěte $f'(" + k + ")$."), String(v),
      "$f'(x) = " + poly([[3 * a, 2], [2 * b, 1], [c, 0]]) + "$, tedy $f'(" + k + ") = " + v + "$."));
  };
  G.tangent = function () {
    var a = ri(-4, 4), x0 = nz(-3, 3), k = 2 * x0, q = a - x0 * x0, askK = Math.random() < 0.5;
    return withFig("x=" + (x0 - 3) + ".." + (x0 + 3) + "; f=x^2+(" + a + "); tan=x^2+(" + a + ")," + x0 + "; pt=" + x0 + "," + (x0 * x0 + a), inp(P("Tečna ke grafu $y = " + poly([[1, 2], [a, 0]]) + "$ v bodě $x_0 = " + x0 + "$ má rovnici $y = kx + q$. Určete $" + (askK ? "k" : "q") + "$."), String(askK ? k : q),
      "$k = f'(" + x0 + ") = " + k + "$ a $q = f(x_0) - k x_0 = " + (x0 * x0 + a) + " - " + par(k) + "\\cdot" + par(x0) + " = " + q + "$."));
  };
  G.deriv_prod = function () {
    var a = ri(-4, 5);
    var f = a === 0 ? "xe^x" : "(" + poly([[1, 1], [a, 0]]) + ")e^x";
    return withFig("x=-4..1.5; f=(x+(" + a + "))*exp(x); tan=(x+(" + a + "))*exp(x),0; pt=0," + a, inp(P("Pro $f(x) = " + f + "$ spočtěte $f'(0)$."), String(1 + a),
      "$f'(x) = e^x + " + (a === 0 ? "x" : "(" + poly([[1, 1], [a, 0]]) + ")") + "e^x$, v nule $1 + " + par(a) + " = " + (1 + a) + "$."));
  };
  G.deriv_chain = function () {
    var a = ri(1, 3), b = ri(1, 3), n = ri(2, 4), v = n * a * Math.pow(b, n - 1);
    return inp(P("Pro $f(x) = (" + poly([[a, 1], [b, 0]]) + ")^{" + n + "}$ spočtěte $f'(0)$."), String(v),
      "$f'(x) = " + n + "(" + poly([[a, 1], [b, 0]]) + ")^{" + (n - 1) + "}\\cdot " + a + "$, v nule $" + n + "\\cdot " + b + "^{" + (n - 1) + "}\\cdot " + a + " = " + v + "$.");
  };
  // a sum of two functions from the table of derivatives, typed as a formula
  G.deriv_table = function () {
    function term(c, body) { return (c === 1 ? "" : c === -1 ? "-" : String(c)) + body; }
    function frac(c, den) { return (c < 0 ? "-" : "") + "\\frac{" + Math.abs(c) + "}{" + den + "}"; }
    function join(list) { return list.map(function (s, i) { return i === 0 ? s : s.charAt(0) === "-" ? " - " + s.slice(1) : " + " + s; }).join(""); }
    function make(k) {
      var c = nz(-5, 5), m = ri(2, 6), b = ri(2, 5);
      if (k === 0) return { f: term(c, "x^{" + m + "}"), d: term(c * m, m === 2 ? "x" : "x^{" + (m - 1) + "}"), s: "(" + c * m + ")*x^" + (m - 1) };
      if (k === 1) return { f: term(c, "e^x"), d: term(c, "e^x"), s: "(" + c + ")*e^x" };
      if (k === 2) return { f: term(c, "\\sin x"), d: term(c, "\\cos x"), s: "(" + c + ")*cos(x)" };
      if (k === 3) return { f: term(c, "\\cos x"), d: term(-c, "\\sin x"), s: "(" + (-c) + ")*sin(x)" };
      if (k === 4) return { f: term(c, "\\ln x"), d: frac(c, "x"), s: "(" + c + ")/x" };
      if (k === 5) return { f: term(c, "\\operatorname{arctg}x"), d: frac(c, "1+x^2"), s: "(" + c + ")/(1+x^2)" };
      if (k === 6) return { f: frac(c, "x"), d: frac(-c, "x^2"), s: "(" + (-c) + ")/x^2" };
      return { f: b + "^x", d: b + "^x\\ln " + b, s: b + "^x*ln(" + b + ")" };
    }
    var i = ri(0, 7), j;
    do { j = ri(0, 7); } while (j === i);
    var A = make(i), B = make(j), k0 = ri(-9, 9), D = join([A.d, B.d]);
    return expr(P("Zderivujte $" + join([A.f, B.f]) + (k0 ? sgn(k0) : "") + "$."), A.s + " + " + B.s,
      "Derivujeme člen po členu podle tabulky, konstanta se vytýká" + (k0 ? " a derivace konstanty je $0$" : "") + ": $" + D + "$.", [], "$" + D + "$");
  };
  // velocity and acceleration of a point moving along a line
  G.motion = function () {
    var a = ri(1, 2), b = nz(-6, 6), c = ri(-5, 9), t0 = ri(1, 4), askV = Math.random() < 0.5;
    var v = 3 * a * t0 * t0 + 2 * b * t0 + c, acc = 6 * a * t0 + 2 * b, vt = poly([[3 * a, 2], [2 * b, 1], [c, 0]], "t");
    return inp(P("Bod se pohybuje po přímce a v čase $t$ sekund je v poloze $s(t) = " + poly([[a, 3], [b, 2], [c, 1]], "t") + "$ metrů. " + (askV ? "Jaká je jeho rychlost (m/s)" : "Jaké je jeho zrychlení (m/s²)") + " v čase $t = " + t0 + "$?"), String(askV ? v : acc),
      askV ? "Rychlost je první derivace polohy: $v(t) = s'(t) = " + vt + "$, tedy $v(" + t0 + ") = " + v + "$."
        : "Zrychlení je druhá derivace polohy: $v(t) = " + vt + "$ a $a(t) = v'(t) = " + poly([[6 * a, 1], [2 * b, 0]], "t") + "$, tedy $a(" + t0 + ") = " + acc + "$.");
  };

  // ---- Věty o střední hodnotě a průběh ------------------------------------------
  G.lagrange_c = function () {
    var a = ri(-3, 2), b = a + ri(1, 4), c = fr(a + b, 2);
    return withFig("x=" + (a - 1) + ".." + (b + 1) + "; f=x^2; sec=x^2," + a + "," + b + "; tan=x^2," + (a + b) / 2 + "; pt=" + (a + b) / 2 + "," + (a + b) * (a + b) / 4, inp(P("Najděte $c$ z Lagrangeovy věty pro $f(x) = x^2$ na $[" + a + ", " + b + "]$."), ans(c),
      "$\\frac{f(b)-f(a)}{b-a} = a + b = " + (a + b) + "$ a $f'(c) = 2c$, tedy $c = " + ft(c) + "$."));
  };
  G.lhopital = function () {
    var a = ri(1, 4), L = fr(a * a, 2), ax = a === 1 ? "x" : a + "x";
    return withFig("x=" + (-2 / a) + ".." + (1.2 / a) + "; f=(exp(" + a + "*x)-1-" + a + "*x)/x^2; hole=0," + a * a / 2, inp(P("Určete $\\lim\\limits_{x\\to0}\\dfrac{e^{" + ax + "} - 1 - " + ax + "}{x^2}$."), ans(L),
      "Dvakrát L'Hospital: $\\dfrac{" + a + "e^{" + ax + "} - " + a + "}{2x}\\to\\dfrac{" + a * a + "e^{" + ax + "}}{2}\\to" + ft(L) + "$."));
  };
  G.quad_min = function () {
    var a = nz(-4, 4), b = ri(-5, 8), askV = Math.random() < 0.5;
    return withFig("x=" + (a - 3) + ".." + (a + 3) + "; f=x^2-(" + 2 * a + ")*x+(" + b + "); pt=" + a + "," + (b - a * a), inp(P("Funkce $f(x) = " + poly([[1, 2], [-2 * a, 1], [b, 0]]) + "$ má jediný lokální extrém. " + (askV ? "Jaká je jeho hodnota?" : "Ve kterém bodě nastává?")), String(askV ? b - a * a : a),
      "$f'(x) = " + poly([[2, 1], [-2 * a, 0]]) + " = 0$ pro $x = " + a + "$ a $f'' = 2 > 0$, jde o minimum $f(" + a + ") = " + (b - a * a) + "$."));
  };
  G.cubic_max = function () {
    var a = ri(1, 4), askV = Math.random() < 0.5;
    return withFig("x=" + (-2.2 * a) + ".." + (2.2 * a) + "; f=x^3-" + 3 * a * a + "*x; pt=" + (-a) + "," + 2 * a * a * a + "; pt=" + a + "," + (-2 * a * a * a), inp(P("Funkce $f(x) = x^3 - " + 3 * a * a + "x$ má lokální maximum. " + (askV ? "Jaká je jeho hodnota?" : "Ve kterém bodě nastává?")), String(askV ? 2 * a * a * a : -a),
      "$f'(x) = 3x^2 - " + 3 * a * a + " = 0$ pro $x = \\pm" + a + "$; derivace mění znaménko z $+$ na $-$ v $x = -" + a + "$, kde $f(-" + a + ") = " + 2 * a * a * a + "$."));
  };

  // ---- Neurčitý integrál -------------------------------------------------------------
  G.antider = function () {
    var a = 3 * ri(1, 3), b = 2 * pick([-3, -2, -1, 1, 2, 3]), c = ri(-4, 4);
    var f = poly([[a, 2], [b, 1], [c, 0]]);
    return mc(P("$\\displaystyle\\int\\left(" + f + "\\right)dx = $"),
      "$" + poly([[a / 3, 3], [b / 2, 2], [c, 1]]) + " + C$",
      ["$" + poly([[2 * a, 1], [b, 0]]) + " + C$", "$" + poly([[a, 3], [b, 2], [c, 1]]) + " + C$", "$" + poly([[a / 3, 3], [b, 2], [c, 1]]) + " + C$"],
      "Integrujeme člen po členu: $\\int x^n\\,dx = \\frac{x^{n+1}}{n+1}$.");
  };
  G.pf_A = function () {
    var r = ri(-3, 3), s; do { s = ri(-3, 3); } while (s === r);
    var p = ri(1, 4), q = ri(-4, 4), A = fr(p * r + q, r - s);
    return inp(P("V rozkladu $\\dfrac{" + poly([[p, 1], [q, 0]]) + "}{" + lin(r) + lin(s) + "} = \\dfrac{A}{" + (r === 0 ? "x" : poly([[1, 1], [-r, 0]])) + "} + \\dfrac{B}{" + (s === 0 ? "x" : poly([[1, 1], [-s, 0]])) + "}$ určete $A$."), ans(A),
      "Dosadíme $x = " + r + "$ do $" + poly([[p, 1], [q, 0]]) + " = A" + lin(s) + " + B" + lin(r) + "$: $" + (p * r + q) + " = " + (r - s) + "A$.");
  };

  // ---- Riemannův integrál ----------------------------------------------------------------
  G.def_lin = function () {
    var a = ri(1, 6), b = ri(-3, 5), k = ri(1, 4), v = fr(a * k * k + 2 * b * k, 2);
    return withFig("x=-0.5.." + (k + 0.5) + "; f=" + a + "*x+(" + b + "); shade=" + a + "*x+(" + b + "),0,0," + k, inp(P("Spočtěte $\\displaystyle\\int_0^{" + k + "}\\left(" + poly([[a, 1], [b, 0]]) + "\\right)dx$."), ans(v),
      "$\\left[" + ft(fr(a, 2)) + "x^2" + (b ? (b < 0 ? " - " : " + ") + (Math.abs(b) === 1 ? "" : Math.abs(b)) + "x" : "") + "\\right]_0^{" + k + "} = " + ft(v) + "$."));
  };
  G.def_power = function () {
    var n = ri(2, 9), c = ri(1, 5), v = fr(c, n + 1);
    return withFig("x=-0.1..1.2; f=" + c + "*x^" + n + "; shade=" + c + "*x^" + n + ",0,0,1", inp(P("Spočtěte $\\displaystyle\\int_0^1 " + (c === 1 ? "" : c) + "x^{" + n + "}\\,dx$."), ans(v),
      "$\\left[\\frac{" + c + "x^{" + (n + 1) + "}}{" + (n + 1) + "}\\right]_0^1 = " + ft(v) + "$."));
  };
  G.avg_sq = function () {
    var k = ri(1, 6), v = fr(k * k, 3);
    return withFig("x=-0.2.." + (k + 0.3) + "; f=x^2; shade=x^2,0,0," + k + "; hline=" + k * k + "/3", inp(P("Jaká je průměrná hodnota funkce $x^2$ na intervalu $[0, " + k + "]$?"), ans(v),
      "$\\frac{1}{" + k + "}\\int_0^{" + k + "}x^2\\,dx = \\frac{1}{" + k + "}\\cdot\\frac{" + k * k * k + "}{3} = " + ft(v) + "$."));
  };
  G.ftc = function () {
    var m = pick([2, 3]), n = pick([1, 2]), x0 = pick([1, 2]);
    var v = m * Math.pow(x0, m - 1) * Math.pow(x0, m * n);
    return inp(P("Spočtěte $F'(" + x0 + ")$ pro $F(x) = \\displaystyle\\int_0^{x^{" + m + "}} t" + (n === 1 ? "" : "^{" + n + "}") + "\\,dt$."), String(v),
      "Podle hlavní věty a řetízkového pravidla $F'(x) = (x^{" + m + "})^{" + n + "}\\cdot " + m + "x^{" + (m - 1) + "}$, tedy $F'(" + x0 + ") = " + v + "$.");
  };

  // ---- Aplikace a nevlastní integrál ---------------------------------------------------
  G.area_powers = function () {
    var a = ri(1, 3), b = a + ri(1, 3), v = fr(b - a, (a + 1) * (b + 1));
    var xa = a === 1 ? "x" : "x^{" + a + "}";
    return withFig("x=-0.1..1.2; y=-0.1..1.2; f=x^" + a + "; f=x^" + b + "; shade=x^" + a + ",x^" + b + ",0,1", inp(P("Jaký je obsah plochy mezi grafy $y = " + xa + "$ a $y = x^{" + b + "}$ na intervalu $[0,1]$?"), ans(v),
      "Na $[0,1]$ je $" + xa + "\\ge x^{" + b + "}$, tedy $\\int_0^1(" + xa + " - x^{" + b + "})\\,dx = \\frac{1}{" + (a + 1) + "} - \\frac{1}{" + (b + 1) + "} = " + ft(v) + "$."));
  };
  G.vol_power = function () {
    var n = ri(1, 4), d = 2 * n + 1;
    return withFig("x=-0.2..1.3; y=-1.2..1.2; aspect=equal; f=x^" + n + "; f=0-x^" + n + "; shade=x^" + n + ",0-x^" + n + ",0,1; vline=1", inp(P("Spočtěte objem tělesa vzniklého rotací grafu $y = " + (n === 1 ? "x" : "x^{" + n + "}") + "$, $x\\in[0,1]$, kolem osy $x$."), "π/" + d + "; " + (Math.round(Math.PI / d * 10000) / 10000),
      "$V = \\pi\\int_0^1 x^{" + 2 * n + "}\\,dx = \\frac{\\pi}{" + d + "}$."));
  };
  G.improper_p = function () {
    var p = pick([fr(2), fr(3), fr(4), fr(3, 2), fr(5, 2), fr(4, 3)]);
    var v = fr(p.q, p.p - p.q);
    return withFig("x=0..10; y=-0.1..1.2; f=1/x^(" + p.p + "/" + p.q + "); shade=1/x^(" + p.p + "/" + p.q + "),0,1,10; vline=1", inp(P("Spočtěte $\\displaystyle\\int_1^\\infty \\frac{dx}{x^{" + ft(p) + "}}$."), ans(v),
      "Pro $p = " + ft(p) + " > 1$ je $\\int_1^\\infty x^{-p}\\,dx = \\left[\\frac{x^{1-p}}{1-p}\\right]_1^\\infty = \\frac{1}{p-1} = " + ft(v) + "$."));
  };
  G.improper_exp = function () {
    var a = ri(1, 6), v = fr(1, a);
    return withFig("x=-0.3.." + (6 / a + 0.5) + "; y=-0.1..1.2; f=exp(0-" + a + "*x); shade=exp(0-" + a + "*x),0,0," + 6 / a, inp(P("Spočtěte $\\displaystyle\\int_0^\\infty e^{-" + (a === 1 ? "" : a) + "x}\\,dx$."), ans(v),
      "$\\left[-\\frac{1}{" + a + "}e^{-" + a + "x}\\right]_0^\\infty = 0 + \\frac{1}{" + a + "} = " + ft(v) + "$."));
  };


  // MA I: derivatives typed as formulas
  G.deriv_expr = function () {
    var k = pick([0, 1, 2, 3]), a = ri(2, 5), b = nz(-4, 4), n = ri(2, 4);
    if (k === 0) return expr(P("Zderivujte $(" + a + "x" + sgn(b) + ")^{" + n + "}$."), n * a + "(" + a + "x" + sgn(b) + ")^" + (n - 1),
      "Vnější funkce $u^{" + n + "}$, vnitřní $" + a + "x" + sgn(b) + "$ s derivací $" + a + "$.", [], "$" + n * a + "(" + a + "x" + sgn(b) + ")^{" + (n - 1) + "}$");
    if (k === 1) return expr(P("Zderivujte $e^{" + a + "x^2}$."), 2 * a + "x e^(" + a + "x^2)",
      "$(e^u)' = e^uu'$ s $u = " + a + "x^2$.", [], "$" + 2 * a + "x\\,e^{" + a + "x^2}$");
    if (k === 2) return expr(P("Zderivujte $\\ln(x^2+" + a + ")$."), "2x/(x^2+" + a + ")",
      "$\\frac{1}{x^2+" + a + "}\\cdot 2x$.", [], "$\\dfrac{2x}{x^2+" + a + "}$");
    return expr(P("Zderivujte $x^{" + n + "}\\sin(" + a + "x)$."), n + "x^" + (n - 1) + " sin(" + a + "x) + " + a + "x^" + n + " cos(" + a + "x)",
      "Součin a řetízek: $" + n + "x^{" + (n - 1) + "}\\sin(" + a + "x) + x^{" + n + "}\\cdot" + a + "\\cos(" + a + "x)$.", [], "$" + n + "x^{" + (n - 1) + "}\\sin(" + a + "x) + " + a + "x^{" + n + "}\\cos(" + a + "x)$");
  };
  // MA I: antiderivatives of polynomials and simple exponentials
  G.antider_expr = function () {
    var a = ri(1, 4), b = nz(-5, 5), c = ri(2, 5), k = pick([0, 1, 2]);
    if (k === 0) return expr(P("Najděte $\\displaystyle\\int\\left(" + 3 * a + "x^2" + sgn(2 * b) + "x" + sgn(c) + "\\right)dx$."), a + "x^3" + sgn(b) + "x^2" + sgn(c) + "x",
      "Člen po členu: $\\int x^n = \\frac{x^{n+1}}{n+1}$.", ["+C"], "$" + poly([[a, 3], [b, 2], [c, 1]]) + " + C$");
    if (k === 1) return expr(P("Najděte $\\displaystyle\\int e^{" + c + "x}\\,dx$."), "e^(" + c + "x)/" + c,
      "Substituce $t = " + c + "x$: $\\frac1{" + c + "}e^{" + c + "x}$.", ["+C"], "$\\frac{1}{" + c + "}e^{" + c + "x} + C$");
    return expr(P("Najděte $\\displaystyle\\int\\cos(" + c + "x)\\,dx$."), "sin(" + c + "x)/" + c,
      "$\\left(\\frac{\\sin " + c + "x}{" + c + "}\\right)' = \\cos " + c + "x$.", ["+C"], "$\\frac{1}{" + c + "}\\sin(" + c + "x) + C$");
  };
  // MA I: domains as intervals
  G.domain_ivl = function () {
    var a = ri(1, 9), k = pick([0, 1, 2]);
    if (k === 0) return ivl(P("Jaký je definiční obor funkce $\\ln(x" + sgn(-a) + ")$?"), "(" + a + "; ∞)", "Potřebujeme $x" + sgn(-a) + ">0$.");
    if (k === 1) return ivl(P("Jaký je definiční obor funkce $\\sqrt{" + a * a + "-x^2}$?"), "[-" + a + "; " + a + "]", "Potřebujeme $x^2\\le" + a * a + "$, tedy $|x|\\le" + a + "$.");
    return ivl(P("Jaký je definiční obor funkce $\\dfrac{1}{\\sqrt{x" + sgn(a) + "}}$?"), "(-" + a + "; ∞)", "Odmocnina musí být definovaná a nenulová: $x" + sgn(a) + ">0$.");
  };
  // MA I: integer roots of a polynomial as a set
  G.roots_set = function () {
    var r = [], c3 = pick([2, 3]);
    while (r.length < c3) { var v = ri(-4, 4); if (r.indexOf(v) < 0) r.push(v); }
    r.sort(function (p, q) { return p - q; });
    var coef = [1];                                  // expand prod (x - r_i)
    r.forEach(function (ri_) { var nc = coef.concat([0]); for (var i = 1; i < nc.length; i++) nc[i] -= ri_ * coef[i - 1]; coef = nc; });
    var deg = coef.length - 1, terms = coef.map(function (c, i) { return [c, deg - i]; });
    return set(P("Najděte všechny reálné kořeny polynomu $" + poly(terms) + "$."), r.join("; "),
      "$" + poly(terms) + " = " + r.map(function (v) { return lin(v); }).join("") + "$.");
  };
});
