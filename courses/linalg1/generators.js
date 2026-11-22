/* Random question generators for this course. In lessons.txt, "? gen | name" calls G.name.
   Each generator returns a fresh question object (see app/js/genkit.js for the helpers in K).
   All numbers are small integers, so the answers stay exact (fractions via K.fr / K.ans). */
CUSP_GEN.define("linalg1", function (K, G) {
  "use strict";
  var P = K.P, ans = K.ans, fr = K.fr, ft = K.ft, inp = K.inp, nz = K.nz, par = K.par, pick = K.pick, ri = K.ri;

  // ---- helpers -----------------------------------------------------------------
  function mat(rows) {                                   // TeX matrix from [[..], ..]
    return "\\begin{pmatrix}" + rows.map(function (r) { return r.join("&"); }).join("\\\\") + "\\end{pmatrix}";
  }
  function vec(v) { return "(" + v.join(", ") + ")^T"; }  // a (column) vector of K^n, written in a row with ^T as in the lectures
  // linear form a1*x1 + a2*x2 + ... with the given variable names, e.g. 2x - y + 3z
  function lin(coefs, names) {
    var s = "";
    coefs.forEach(function (c, i) {
      if (!c) return;
      var a = Math.abs(c), body = (a === 1 ? "" : String(a)) + names[i];
      s += s ? (c < 0 ? " - " : " + ") + body : (c < 0 ? "-" : "") + body;
    });
    return s || "0";
  }
  function det2(m) { return m[0][0] * m[1][1] - m[0][1] * m[1][0]; }
  function det3(m) {
    return m[0][0] * m[1][1] * m[2][2] + m[0][1] * m[1][2] * m[2][0] + m[0][2] * m[1][0] * m[2][1]
         - m[0][2] * m[1][1] * m[2][0] - m[0][0] * m[1][2] * m[2][1] - m[0][1] * m[1][0] * m[2][2];
  }
  function randMat(k, n, lo, hi) {
    var m = [];
    for (var i = 0; i < k; i++) { m.push([]); for (var j = 0; j < n; j++) m[i].push(ri(lo, hi)); }
    return m;
  }
  function rank(m) {                                     // Gaussian elimination in floating point (small integers only)
    var a = m.map(function (r) { return r.slice(); }), k = a.length, n = a[0].length, r = 0;
    for (var c = 0; c < n && r < k; c++) {
      var p = -1;
      for (var i = r; i < k; i++) if (Math.abs(a[i][c]) > 1e-9) { p = i; break; }
      if (p < 0) continue;
      var t = a[p]; a[p] = a[r]; a[r] = t;
      for (i = r + 1; i < k; i++) {
        var f = a[i][c] / a[r][c];
        for (var j = c; j < n; j++) a[i][j] -= f * a[r][j];
      }
      r++;
    }
    return r;
  }
  // a k x n integer matrix of the given rank: r random independent rows, the others integer combinations of them
  function matOfRank(k, n, r) {
    var base;
    do { base = randMat(r, n, -3, 3); } while (rank(base) < r);
    var rows = base.slice();
    while (rows.length < k) {
      var row = [];
      for (var j = 0; j < n; j++) row.push(0);
      base.forEach(function (b) { var c = ri(-2, 2); for (var j = 0; j < n; j++) row[j] += c * b[j]; });
      rows.push(row);
    }
    // shuffle the rows so the dependent ones are not always at the bottom
    for (var i = rows.length - 1; i > 0; i--) { var s = ri(0, i), t = rows[i]; rows[i] = rows[s]; rows[s] = t; }
    return rows;
  }
  var ORD = ["první", "druhá", "třetí", "čtvrtá"];

  // ---- Soustavy ------------------------------------------------------------------
  G.la_sys3 = function () {
    var A, d;
    do { A = randMat(3, 3, -2, 3); d = det3(A); } while (d === 0 || A.some(function (r) { return r.every(function (x) { return x === 0; }); }));
    var s = [ri(-3, 3), ri(-3, 3), ri(-3, 3)];
    var b = A.map(function (r) { return r[0] * s[0] + r[1] * s[1] + r[2] * s[2]; });
    var names = ["x", "y", "z"], k = ri(0, 2);
    var eqs = A.map(function (r, i) { return lin(r, names) + " &= " + b[i]; }).join("\\\\");
    return inp(P("Řešte soustavu") + "$$\\begin{aligned}" + eqs + "\\end{aligned}$$" + P("Kolik je $" + names[k] + "$?"), String(s[k]),
      "Determinant matice soustavy je $" + d + "\\ne0$, řešení je tedy jediné. Eliminací (nebo Cramerovým pravidlem) vyjde $(x,y,z)^T = " + vec(s) +
      "$; zkouška v první rovnici: $" + A[0].map(function (c, i) { return par(c) + "\\cdot" + par(s[i]); }).join(" + ") + " = " + b[0] + "$. Tedy $" + names[k] + " = " + s[k] + "$.");
  };

  // ---- Matice --------------------------------------------------------------------
  G.la_matvec = function () {
    var A = randMat(2, 3, -3, 4), x = [ri(-2, 3), ri(-2, 3), ri(-2, 3)], k = ri(0, 1);
    var y = A.map(function (r) { return r[0] * x[0] + r[1] * x[1] + r[2] * x[2]; });
    return inp(P("Jaká je " + ORD[k] + " složka vektoru $Ax$ pro") + "$$A = " + mat(A) + ",\\quad x = " + vec(x) + "\\ ?$$", String(y[k]),
      "$Ax = " + x.map(function (c, j) { return par(c) + "\\cdot" + vec([A[0][j], A[1][j]]); }).join(" + ") + " = " + vec(y) + "$ je kombinace sloupců $A$. " + ["První", "Druhá"][k] + " složka je $" + y[k] + "$.");
  };
  G.la_area = function () {
    var u, v, d;
    do { u = [ri(1, 4), ri(-1, 2)]; v = [ri(-2, 2), ri(1, 3)]; d = u[0] * v[1] - u[1] * v[0]; } while (d === 0);
    var xs = [0, u[0], v[0], u[0] + v[0]], ys = [0, u[1], v[1], u[1] + v[1]], w = [u[0] + v[0], u[1] + v[1]];
    var f = "x=" + (Math.min.apply(null, xs) - 0.7) + ".." + (Math.max.apply(null, xs) + 0.7) + "; y=" + (Math.min.apply(null, ys) - 0.7) + ".." + (Math.max.apply(null, ys) + 0.7) +
      "; aspect=equal; fill=0,0," + u + "," + w + "," + v + "; vec=" + u + ",def; vec=" + v + ",ex; label=" + (u[0] + 0.35) + "," + (u[1] - 0.3) + ",u; label=" + (v[0] - 0.3) + "," + (v[1] + 0.3) + ",v";
    return K.withFig(String(f), inp(P("Jaký obsah má rovnoběžník určený vektory $u = " + vec(u) + "$ a $v = " + vec(v) + "$?"), String(Math.abs(d)),
      "$\\det\\begin{pmatrix}" + u[0] + "&" + v[0] + "\\\\" + u[1] + "&" + v[1] + "\\end{pmatrix} = " + par(u[0]) + "\\cdot" + par(v[1]) + " - " + par(v[0]) + "\\cdot" + par(u[1]) + " = " + d +
      "$" + (d < 0 ? ", dvojice je záporně orientovaná" : "") + ". Obsah je $|" + d + "| = " + Math.abs(d) + "$."));
  };
  G.la_perm_sign = function () {
    var n = pick([4, 5]), p = [];
    for (var i = 1; i <= n; i++) p.push(i);
    for (i = n - 1; i > 0; i--) { var j = ri(0, i), t = p[i]; p[i] = p[j]; p[j] = t; }
    var inv = [];
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) if (p[i] > p[j]) inv.push("(" + p[i] + "," + p[j] + ")");
    var s = inv.length % 2 ? -1 : 1;
    return inp(P("Jaké znaménko ($1$ nebo $-1$) má permutace $(" + p.join(", ") + ")$?"), String(s),
      "Inverze jsou dvojice čísel, kde větší stojí před menším" + (inv.length ? ": " + inv.join(", ") : "; tady žádná není") + ". Je jich $" + inv.length + "$, znaménko je $(-1)^{" + inv.length + "} = " + s + "$.");
  };
  G.la_matmul = function () {
    var A = randMat(2, 3, -3, 4), B = randMat(3, 2, -3, 4), i = ri(0, 1), j = ri(0, 1);
    var terms = [0, 1, 2].map(function (p) { return par(A[i][p]) + "\\cdot" + par(B[p][j]); });
    var v = A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j];
    return inp(P("Pro") + "$$A = " + mat(A) + ",\\quad B = " + mat(B) + "$$" + P("určete prvek $(AB)_{" + (i + 1) + (j + 1) + "}$."), String(v),
      "$" + (i + 1) + "$. řádek $A$ krát $" + (j + 1) + "$. sloupec $B$: $" + terms.join(" + ") + " = " + v + "$.");
  };
  G.la_inv2 = function () {
    var A, d;
    do { A = randMat(2, 2, -4, 5); d = det2(A); } while (d === 0 || Math.abs(d) > 6);
    var inv = [[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]], i = ri(0, 1), j = ri(0, 1), f = fr(inv[i][j], d);
    return inp(P("Jaký prvek je na místě $(" + (i + 1) + "," + (j + 1) + ")$ inverzní matice k") + "$$" + mat(A) + "\\ ?$$", ans(f),
      "$\\det A = " + d + "$ a $A^{-1} = \\frac{1}{" + d + "}" + mat(inv) + "$. Hledaný prvek je $" + ft(f) + "$.");
  };

  // ---- Souřadnice a lineární zobrazení -------------------------------------------
  G.la_coord = function () {
    var u, v;
    do { u = [ri(-3, 3), ri(-3, 3)]; v = [ri(-3, 3), ri(-3, 3)]; } while (u[0] * v[1] - u[1] * v[0] === 0);
    var s = ri(-3, 3), t = ri(-3, 3), w = [s * u[0] + t * v[0], s * u[1] + t * v[1]], k = ri(0, 1);
    return inp(P("Jakou " + ["první", "druhou"][k] + " souřadnici má vektor $" + vec(w) + "$ v bázi $\\big(" + vec(u) + ",\\ " + vec(v) + "\\big)$ prostoru $\\mathbb R^2$?"), String([s, t][k]),
      "Řešíme $a" + vec(u) + " + b" + vec(v) + " = " + vec(w) + "$, tedy soustavu se dvěma neznámými. Vyjde $a = " + s + "$, $b = " + t + "$, takže hledaná souřadnice je $" + [s, t][k] + "$.");
  };
  G.la_linmap = function () {
    var p = [ri(-4, 4), ri(-4, 4)], q = [ri(-4, 4), ri(-4, 4)], x = ri(-3, 3), y = ri(-3, 3), k = ri(0, 1);
    var a = fr(x + y, 2), b = fr(x - y, 2), val = fr((x + y) * p[k] + (x - y) * q[k], 2);
    return inp(P("Lineární $\\varphi\\colon\\mathbb R^2\\to\\mathbb R^2$ splňuje $\\varphi(1,1) = " + vec(p) + "$ a $\\varphi(1,-1) = " + vec(q) + "$. Jaká je " + ORD[k] + " složka $\\varphi(" + x + ", " + y + ")$?"), ans(val),
      "$(" + x + ", " + y + ")^T = " + ft(a) + "\\cdot(1,1)^T + " + ft(b) + "\\cdot(1,-1)^T$, takže $\\varphi(" + x + ", " + y + ") = " + ft(a) + "\\cdot" + vec(p) + " + " + ft(b) + "\\cdot" + vec(q) +
      "$ a jeho " + ORD[k] + " složka je $" + ft(val) + "$.");
  };
  G.la_rank_ker = function () {
    var r = ri(1, 3), A = matOfRank(3, 4, r);
    return inp(P("Jakou dimenzi má jádro zobrazení $\\varphi\\colon\\mathbb R^4\\to\\mathbb R^3$, $\\varphi(x) = Ax$, kde") + "$$A = " + mat(A) + "\\ ?$$", String(4 - r),
      "Eliminací zjistíme $h(A) = " + r + "$, tedy $\\dim\\operatorname{im}\\varphi = " + r + "$. Podle věty o dimenzi jádra a obrazu $\\dim\\ker\\varphi = 4 - " + r + " = " + (4 - r) + "$.");
  };
  G.la_rank = function () {
    var n = pick([3, 4]), r = ri(1, 3), A = matOfRank(3, n, r);
    return inp(P("Jaká je hodnost matice") + "$$" + mat(A) + "\\ ?$$", String(r),
      "Řádkovými úpravami dostaneme schodovitý tvar s $" + r + "$ nenulovými řádky" + (r < 3 ? " (některé řádky jsou kombinacemi ostatních)" : "") + ". Hodnost je $" + r + "$.");
  };

  // ---- Determinanty --------------------------------------------------------------
  G.la_det2 = function () {
    var A = randMat(2, 2, -5, 6), d = det2(A);
    return inp(P("Spočtěte") + "$$\\det" + mat(A) + ".$$", String(d),
      "$" + par(A[0][0]) + "\\cdot" + par(A[1][1]) + " - " + par(A[0][1]) + "\\cdot" + par(A[1][0]) + " = " + d + "$.");
  };
  G.la_det3 = function () {
    var A = randMat(3, 3, -3, 3), d = det3(A), m = A;
    var plus = [m[0][0] * m[1][1] * m[2][2], m[0][1] * m[1][2] * m[2][0], m[0][2] * m[1][0] * m[2][1]];
    var minus = [m[0][2] * m[1][1] * m[2][0], m[0][0] * m[1][2] * m[2][1], m[0][1] * m[1][0] * m[2][2]];
    return inp(P("Spočtěte") + "$$\\det" + mat(A) + ".$$", String(d),
      "Sarrusovo pravidlo: součiny po diagonálách dolů jsou $" + plus.join(",\\ ") + "$, nahoru $" + minus.join(",\\ ") + "$." +
      "$$" + plus.map(par).join(" + ") + " - " + minus.map(par).join(" - ") + " = " + d + ".$$");
  };
  G.la_detprod = function () {
    var n = pick([2, 3]), a = nz(-4, 4), b = nz(-3, 3), c = pick([2, 3, -1, -2]);
    var cases = [
      ["\\det(AB)", fr(a * b), "\\det A\\cdot\\det B = " + par(a) + "\\cdot" + par(b)],
      ["\\det(A^{-1}B)", fr(b, a), "\\frac{\\det B}{\\det A} = \\frac{" + b + "}{" + a + "}"],
      ["\\det(A^TB^2)", fr(a * b * b), "\\det A\\cdot(\\det B)^2 = " + par(a) + "\\cdot" + par(b) + "^2"],
      ["\\det(" + c + "A)", fr(Math.pow(c, n) * a), par(c) + "^" + n + "\\cdot\\det A = " + par(c) + "^" + n + "\\cdot" + par(a)],
      ["\\det(BAB^{-1})", fr(a), "\\det B\\cdot\\det A\\cdot\\frac{1}{\\det B} = \\det A"]
    ], q = pick(cases);
    return inp(P("Matice $A$, $B$ tvaru $" + n + "\\times" + n + "$ mají $\\det A = " + a + "$ a $\\det B = " + b + "$. Kolik je $" + q[0] + "$?"), ans(q[1]),
      "Podle Cauchyovy věty a vlastností determinantu:$$" + q[0] + " = " + q[2] + " = " + ft(q[1]) + ".$$");
  };
  G.la_cramer = function () {
    var A, d;
    do { A = randMat(2, 2, -4, 5); d = det2(A); } while (d === 0 || A[0].every(function (x) { return x === 0; }) || A[1].every(function (x) { return x === 0; }));
    var s = [ri(-4, 4), ri(-4, 4)], b = [A[0][0] * s[0] + A[0][1] * s[1], A[1][0] * s[0] + A[1][1] * s[1]], k = ri(0, 1);
    var Ak = k === 0 ? [[b[0], A[0][1]], [b[1], A[1][1]]] : [[A[0][0], b[0]], [A[1][0], b[1]]], dk = det2(Ak), names = ["x", "y"];
    var eqs = A.map(function (r, i) { return lin(r, names) + " &= " + b[i]; }).join("\\\\");
    return inp(P("Cramerovým pravidlem řešte soustavu") + "$$\\begin{aligned}" + eqs + "\\end{aligned}$$" + P("Kolik je $" + names[k] + "$?"), String(s[k]),
      "$\\det A = " + d + "$ a po nahrazení " + (k + 1) + ". sloupce pravou stranou $\\det A_" + (k + 1) + " = \\det" + mat(Ak) + " = " + dk + "$. Tedy $" + names[k] + " = \\frac{" + dk + "}{" + d + "} = " + s[k] + "$.");
  };
  G.la_cross = function () {
    var u = [ri(-3, 3), ri(-3, 3), ri(-3, 3)], v = [ri(-3, 3), ri(-3, 3), ri(-3, 3)], k = ri(0, 2);
    var w = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    var how = [
      par(u[1]) + "\\cdot" + par(v[2]) + " - " + par(u[2]) + "\\cdot" + par(v[1]),
      par(u[2]) + "\\cdot" + par(v[0]) + " - " + par(u[0]) + "\\cdot" + par(v[2]),
      par(u[0]) + "\\cdot" + par(v[1]) + " - " + par(u[1]) + "\\cdot" + par(v[0])
    ][k];
    return inp(P("Jaká je " + ORD[k] + " složka vektorového součinu $" + vec(u) + "\\times" + vec(v) + "$?"), String(w[k]),
      "$(u\\times v)_" + (k + 1) + " = " + how + " = " + w[k] + "$. Celý součin je $" + vec(w) + "$.");
  };
});
