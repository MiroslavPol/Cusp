(function () {
  "use strict";
  /*
   * Figure engine: a one-line spec -> SVG.
   *   x=-3..3; y=-1..5; aspect=equal
   *   f=x^2            graph (repeatable; colours cycle)
   *   seq=1/n          sequence points n = 1..floor(xmax)
   *   rec=1; sqrt(2+a) recursive sequence a1 = 1, a_{n+1} = expr(a)
   *   param=cos(t),sin(t),0,2*pi
   *   shade=f,g,a,b    region between f and g (g may be 0) on [a,b]
   *   rect=upper,f,a,b,n   Riemann rectangles (upper|lower)
   *   tan=f,x0   sec=f,x1,x2   pt=x,y   hole=x,y   vline=x   hline=y
   *   band=y1,y2   vband=x1,x2   poly=x1,y1,x2,y2,...   circle=cx,cy,r   label=x,y,text
   * Vectors and linear maps (an optional last argument def|ex|prf|thm|ink|muted picks the colour; default def):
   *   vec=x,y          arrow from the origin to [x,y]      vec=x0,y0,x1,y1   arrow from [x0,y0] to [x1,y1]
   *   seg=x0,y0,x1,y1  segment                            line=x0,y0,x1,y1  the whole line through both points
   *   fill=x1,y1,x2,y2,...   filled polygon (translucent)
   *   grid=a,b,c,d[,k]  image of the lines x = i, y = j (integers, |i|,|j| <= k) under the matrix (a b; c d);
   *                    without k, enough lines to cover the window
   */
  var W = 320, H = 200, PAD = 6;
  var COLORS = ["var(--def)", "var(--ex)", "var(--prf)", "var(--thm)"];
  var NAMED = { def: "var(--def)", ex: "var(--ex)", prf: "var(--prf)", thm: "var(--thm)", ink: "var(--ink)", muted: "var(--muted)" };
  // an optional colour name as the last argument: returns [numbers, css colour]
  function colourArgs(args) {
    var col = NAMED.def;
    if (args.length && NAMED.hasOwnProperty(args[args.length - 1])) col = NAMED[args.pop()];
    return [args.map(num), col];
  }
  var FN = "sin,cos,tan,asin,acos,atan,sinh,cosh,tanh,exp,ln,log,sqrt,abs,floor,sign,cbrt,min,max,pow".split(",");
  var ALLOWED = FN.concat(["x", "n", "a", "t", "PI", "E", "NaN"]);
  var cache = {};

  function compile(expr, v) {
    var key = v + "|" + expr;
    if (cache[key]) return cache[key];
    var e = String(expr).replace(/\s+/g, "").replace(/π|pi/g, "PI").replace(/\^/g, "**");
    // JS forbids "-x**2": wrap unary minus before a power
    e = e.replace(/(^|[^\w).])-(\w+(?:\.\d+)?|\([^()]*\))\*\*(\w+(?:\.\d+)?|\([^()]*\))/g, "$1-($2**$3)");
    (e.match(/[A-Za-z_]+/g) || []).forEach(function (id) { if (ALLOWED.indexOf(id) < 0) throw new Error("unknown name " + id); });
    if (/[^\w\s+\-*/().,<>=?:!&|]/.test(e)) throw new Error("bad character in " + expr);
    var pre = "var sin=M.sin,cos=M.cos,tan=M.tan,asin=M.asin,acos=M.acos,atan=M.atan,sinh=M.sinh,cosh=M.cosh,tanh=M.tanh," +
      "exp=M.exp,ln=M.log,log=M.log,sqrt=M.sqrt,abs=M.abs,floor=M.floor,sign=M.sign,cbrt=M.cbrt,min=M.min,max=M.max,pow=M.pow,PI=M.PI,E=M.E;";
    var f = new Function("M", v, pre + "return (" + e + ");");
    var g = function (val) { try { var r = f(Math, val); return typeof r === "number" ? r : NaN; } catch (err) { return NaN; } };
    cache[key] = g;
    return g;
  }
  function num(s) { return compile(s, "x")(0); }   // constant expressions like pi/2

  function parse(spec) {
    var o = { fx: [], items: [] };
    spec.split(";").forEach(function (part) {
      part = part.trim(); if (!part) return;
      var i = part.indexOf("="); if (i < 0) return;
      var k = part.slice(0, i).trim(), v = part.slice(i + 1).trim();
      if (k === "x" || k === "y") { var r = v.split(".."); o[k] = [num(r[0]), num(r[1])]; }
      else if (k === "aspect") o.aspect = v;
      else if (k === "axes") o.axes = v;
      else o.items.push({ k: k, v: v });
    });
    return o;
  }
  // "rec=1; sqrt(2+a)" — the bare expression after rec is stored as an item without "="
  function parseRec(spec) {
    var parts = spec.split(";"), out = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      if (/^rec=/.test(p) && i + 1 < parts.length && parts[i + 1].indexOf("=") < 0) { out.push(p + "|" + parts[i + 1].trim()); i++; }
      else out.push(p);
    }
    return out.join(";");
  }
  function splitArgs(v) { // split on commas that are not inside parentheses
    var out = [], depth = 0, cur = "";
    for (var i = 0; i < v.length; i++) {
      var c = v[i];
      if (c === "(") depth++; else if (c === ")") depth--;
      if (c === "," && depth === 0) { out.push(cur); cur = ""; } else cur += c;
    }
    out.push(cur);
    return out.map(function (s) { return s.trim(); });
  }

  function niceStep(span) {
    var raw = span / 6, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }

  function render(el, spec) {
    var o;
    try { o = parse(parseRec(spec)); } catch (e) { el.innerHTML = ""; el.dataset.err = String(e.message || e); return; }
    var items = o.items;
    var X = o.x || [-3, 3];
    // auto y-range from functions if missing
    var Y = o.y;
    if (!Y) {
      var ys = [];
      items.forEach(function (it) {
        var i, f;
        if (it.k === "f") { f = compile(it.v, "x"); for (i = 0; i <= 200; i++) { var yv = f(X[0] + (X[1] - X[0]) * i / 200); if (isFinite(yv)) ys.push(yv); } }
        if (it.k === "seq") { f = compile(it.v, "n"); for (i = Math.max(1, Math.ceil(X[0])); i <= X[1]; i++) { var sv = f(i); if (isFinite(sv)) ys.push(sv); } }
        if (it.k === "rec") { var rv = it.v.split("|"), g = compile(rv[1], "a"), av = num(rv[0].replace(/^rec=/, "")); for (i = 1; i <= X[1] && isFinite(av); i++) { ys.push(av); av = g(av); } }
        if (it.k === "hline") ys.push(num(it.v));
        if (it.k === "pt" || it.k === "hole") ys.push(num(splitArgs(it.v)[1]));
      });
      var seqOnly = !items.some(function (it) { return it.k === "f"; });
      ys.sort(function (a, b) { return a - b; });
      var lo = ys.length ? (seqOnly ? ys[0] : ys[Math.floor(ys.length * 0.03)]) : -1, hi = ys.length ? (seqOnly ? ys[ys.length - 1] : ys[Math.max(0, Math.ceil(ys.length * 0.97) - 1)]) : 1;
      lo = Math.min(lo, 0); hi = Math.max(hi, 0);
      var m = (hi - lo) * 0.12 || 1; Y = [lo - m, hi + m];
    }
    var w = W - 2 * PAD, h = H - 2 * PAD;
    if (o.aspect === "equal") {
      var sx = w / (X[1] - X[0]), sy = h / (Y[1] - Y[0]);
      if (sx > sy) { var cx = (X[0] + X[1]) / 2, half = w / sy / 2; X = [cx - half, cx + half]; }
      else { var cy = (Y[0] + Y[1]) / 2, halfy = h / sx / 2; Y = [cy - halfy, cy + halfy]; }
    }
    function px(x) { return PAD + (x - X[0]) / (X[1] - X[0]) * w; }
    function py(y) { return PAD + (Y[1] - y) / (Y[1] - Y[0]) * h; }
    function r2(v) { return Math.round(v * 10) / 10; }
    var svg = [];
    svg.push('<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Obrázek">');
    svg.push('<defs><clipPath id="cp' + (render.n = (render.n || 0) + 1) + '"><rect x="' + PAD + '" y="' + PAD + '" width="' + w + '" height="' + h + '"/></clipPath></defs>');
    var clip = 'clip-path="url(#cp' + render.n + ')"';
    // grid + axes
    var sxp = niceStep(X[1] - X[0]), syp = niceStep(Y[1] - Y[0]);
    var g = [];
    for (var gx = Math.ceil(X[0] / sxp) * sxp; gx <= X[1] + 1e-9; gx += sxp) g.push('<line x1="' + r2(px(gx)) + '" y1="' + PAD + '" x2="' + r2(px(gx)) + '" y2="' + (H - PAD) + '" style="stroke:var(--grid-strong)"/>');
    for (var gy = Math.ceil(Y[0] / syp) * syp; gy <= Y[1] + 1e-9; gy += syp) g.push('<line x1="' + PAD + '" y1="' + r2(py(gy)) + '" x2="' + (W - PAD) + '" y2="' + r2(py(gy)) + '" style="stroke:var(--grid-strong)"/>');
    var bare = o.axes === "off";
    if (bare) g = [];
    svg.push(g.join(""));
    var ax0 = Math.min(Math.max(0, X[0]), X[1]), ay0 = Math.min(Math.max(0, Y[0]), Y[1]);
    if (!bare) svg.push('<line x1="' + PAD + '" y1="' + r2(py(ay0)) + '" x2="' + (W - PAD) + '" y2="' + r2(py(ay0)) + '" style="stroke:var(--muted)" stroke-width="1"/>');
    if (!bare) svg.push('<line x1="' + r2(px(ax0)) + '" y1="' + PAD + '" x2="' + r2(px(ax0)) + '" y2="' + (H - PAD) + '" style="stroke:var(--muted)" stroke-width="1"/>');
    var labels = [];
    function fmt(v, st) { var d = Math.max(0, Math.min(6, -Math.floor(Math.log10(st) + 1e-9))); return String(parseFloat(v.toFixed(d))).replace("-", "−"); }
    for (gx = Math.ceil(X[0] / sxp) * sxp; gx <= X[1] + 1e-9; gx += sxp) if (Math.abs(gx) > 1e-9 && px(gx) > PAD + 8 && px(gx) < W - PAD - 8) labels.push('<text x="' + r2(px(gx)) + '" y="' + r2(Math.min(H - PAD - 2, py(ay0) + 11)) + '" text-anchor="middle">' + fmt(gx, sxp) + "</text>");
    for (gy = Math.ceil(Y[0] / syp) * syp; gy <= Y[1] + 1e-9; gy += syp) if (Math.abs(gy) > 1e-9 && py(gy) > PAD + 6 && py(gy) < H - PAD - 4) labels.push('<text x="' + r2(Math.max(PAD + 2, px(ax0) - 3)) + '" y="' + r2(py(gy) + 3.5) + '" text-anchor="' + (px(ax0) - 3 < PAD + 14 ? "start" : "end") + '">' + fmt(gy, syp) + "</text>");
    if (!bare) svg.push('<g class="fig-ticks">' + labels.join("") + "</g>");

    var fi = 0, body = [];
    // A real discontinuity keeps a visible gap however far we bisect; a steep continuous piece does not.
    function isJump(f, x0, x1, y0, y1) {
      for (var i = 0; i < 40; i++) {
        var xm = (x0 + x1) / 2, ym = f(xm);
        if (!isFinite(ym)) return true;
        if (Math.abs(ym - y0) > Math.abs(y1 - ym)) { x1 = xm; y1 = ym; } else { x0 = xm; y0 = ym; }
        if (Math.abs(py(y1) - py(y0)) < 1.5) return false;
      }
      return true;
    }
    function pathFor(f, a, b, steps) {
      var d = "", pen = false, prev = null, span = Y[1] - Y[0];
      for (var i = 0; i <= steps; i++) {
        var x = a + (b - a) * i / steps, y = f(x);
        var ok = isFinite(y) && y > Y[0] - 2 * span && y < Y[1] + 2 * span;
        if (ok && prev !== null && (Math.abs(y - prev) > span * 1.5 || (Math.abs(py(y) - py(prev)) > 4 && isJump(f, x - (b - a) / steps, x, prev, y)))) pen = false; // jump: break
        if (ok) { d += (pen ? "L" : "M") + r2(px(x)) + "," + r2(py(y)); pen = true; prev = y; } else { pen = false; prev = null; }
      }
      return d;
    }
    items.forEach(function (it) {
      var a, f, gfun, c;
      switch (it.k) {
        case "f":
          c = COLORS[fi++ % COLORS.length];
          body.push('<path d="' + pathFor(compile(it.v, "x"), X[0], X[1], 600) + '" fill="none" style="stroke:' + c + '" stroke-width="2" ' + clip + "/>");
          break;
        case "shade":
          a = splitArgs(it.v); f = compile(a[0], "x"); gfun = compile(a[1] || "0", "x");
          var A = num(a[2]), B = num(a[3]), pts = [], k;
          for (k = 0; k <= 160; k++) { var xs = A + (B - A) * k / 160; pts.push(r2(px(xs)) + "," + r2(py(f(xs)))); }
          for (k = 160; k >= 0; k--) { var xs2 = A + (B - A) * k / 160; pts.push(r2(px(xs2)) + "," + r2(py(gfun(xs2)))); }
          body.unshift('<polygon points="' + pts.join(" ") + '" style="fill:var(--def);fill-opacity:.18;stroke:none" ' + clip + "/>");
          break;
        case "rect":
          a = splitArgs(it.v); f = compile(a[1], "x");
          var a0 = num(a[2]), b0 = num(a[3]), nn = Math.round(num(a[4])), up = a[0] === "upper";
          for (k = 0; k < nn; k++) {
            var l = a0 + (b0 - a0) * k / nn, r = a0 + (b0 - a0) * (k + 1) / nn, ext = up ? -Infinity : Infinity;
            for (var s = 0; s <= 40; s++) { var yy = f(l + (r - l) * s / 40); if (isFinite(yy)) ext = up ? Math.max(ext, yy) : Math.min(ext, yy); }
            var top = Math.max(ext, 0), bot = Math.min(ext, 0);
            body.unshift('<rect x="' + r2(px(l)) + '" y="' + r2(py(top)) + '" width="' + r2(px(r) - px(l)) + '" height="' + r2(py(bot) - py(top)) + '" style="fill:' + (up ? "var(--ex)" : "var(--prf)") + ';fill-opacity:.16;stroke:' + (up ? "var(--ex)" : "var(--prf)") + '" stroke-width="1"/>');
          }
          break;
        case "seq":
          f = compile(it.v, "n"); c = COLORS[fi++ % COLORS.length];
          var dotR = X[1] - Math.max(1, X[0]) > 70 ? 1.5 : X[1] - X[0] > 35 ? 2 : 2.6;
          for (k = 1; k <= Math.floor(X[1]); k++) { var sv = f(k); if (isFinite(sv) && sv >= Y[0] && sv <= Y[1] && k >= X[0]) body.push('<circle cx="' + r2(px(k)) + '" cy="' + r2(py(sv)) + '" r="' + dotR + '" style="fill:' + c + '"/>'); }
          break;
        case "rec":
          var rv = it.v.split("|"); f = compile(rv[1], "a"); c = COLORS[fi++ % COLORS.length];
          var av = num(rv[0].replace(/^rec=/, ""));
          for (k = 1; k <= Math.floor(X[1]); k++) { if (isFinite(av) && av >= Y[0] && av <= Y[1]) body.push('<circle cx="' + r2(px(k)) + '" cy="' + r2(py(av)) + '" r="2.6" style="fill:' + c + '"/>'); av = f(av); }
          break;
        case "param":
          a = splitArgs(it.v); var fxp = compile(a[0], "t"), fyp = compile(a[1], "t"), t0 = num(a[2]), t1 = num(a[3]), dp = "";
          for (k = 0; k <= 400; k++) { var tt = t0 + (t1 - t0) * k / 400; dp += (k ? "L" : "M") + r2(px(fxp(tt))) + "," + r2(py(fyp(tt))); }
          c = COLORS[fi++ % COLORS.length];
          body.push('<path d="' + dp + '" fill="none" style="stroke:' + c + '" stroke-width="2" ' + clip + "/>");
          break;
        case "tan": case "sec":
          a = splitArgs(it.v); f = compile(a[0], "x");
          var x1 = num(a[1]), y1 = f(x1), slope;
          if (it.k === "tan") { var hh = 1e-5; slope = (f(x1 + hh) - f(x1 - hh)) / (2 * hh); }
          else { var x2 = num(a[2]); slope = (f(x2) - y1) / (x2 - x1); }
          var lx0 = X[0], lx1 = X[1];
          if (isFinite(slope)) body.push('<line x1="' + r2(px(lx0)) + '" y1="' + r2(py(y1 + slope * (lx0 - x1))) + '" x2="' + r2(px(lx1)) + '" y2="' + r2(py(y1 + slope * (lx1 - x1))) + '" style="stroke:' + (it.k === "tan" ? "var(--ex)" : "var(--thm)") + '" stroke-width="1.6" stroke-dasharray="' + (it.k === "tan" ? "6 4" : "2 3") + '" ' + clip + "/>");
          else body.push('<line x1="' + r2(px(x1)) + '" y1="' + PAD + '" x2="' + r2(px(x1)) + '" y2="' + (H - PAD) + '" style="stroke:var(--ex)" stroke-width="1.6" stroke-dasharray="6 4"/>');
          break;
        case "vline": body.push('<line x1="' + r2(px(num(it.v))) + '" y1="' + PAD + '" x2="' + r2(px(num(it.v))) + '" y2="' + (H - PAD) + '" style="stroke:var(--muted)" stroke-width="1.2" stroke-dasharray="4 4"/>'); break;
        case "hline": body.push('<line x1="' + PAD + '" y1="' + r2(py(num(it.v))) + '" x2="' + (W - PAD) + '" y2="' + r2(py(num(it.v))) + '" style="stroke:var(--muted)" stroke-width="1.2" stroke-dasharray="4 4"/>'); break;
        case "band": a = splitArgs(it.v).map(num); body.unshift('<rect x="' + PAD + '" y="' + r2(py(Math.max(a[0], a[1]))) + '" width="' + w + '" height="' + r2(Math.abs(py(a[0]) - py(a[1]))) + '" style="fill:var(--ex);fill-opacity:.12"/>'); break;
        case "vband": a = splitArgs(it.v).map(num); body.unshift('<rect x="' + r2(px(Math.min(a[0], a[1]))) + '" y="' + PAD + '" width="' + r2(Math.abs(px(a[1]) - px(a[0]))) + '" height="' + h + '" style="fill:var(--prf);fill-opacity:.14"/>'); break;
        case "pt": a = splitArgs(it.v).map(num); body.push('<circle cx="' + r2(px(a[0])) + '" cy="' + r2(py(a[1])) + '" r="3.6" style="fill:var(--ink)"/>'); break;
        case "hole": a = splitArgs(it.v).map(num); body.push('<circle cx="' + r2(px(a[0])) + '" cy="' + r2(py(a[1])) + '" r="3.6" style="fill:var(--card);stroke:var(--ink)" stroke-width="1.6"/>'); break;
        case "poly":
          a = splitArgs(it.v).map(num); var pp = [];
          for (k = 0; k + 1 < a.length; k += 2) pp.push(r2(px(a[k])) + "," + r2(py(a[k + 1])));
          body.push('<polyline points="' + pp.join(" ") + '" fill="none" style="stroke:var(--ink)" stroke-width="2" stroke-linejoin="round"/>');
          break;
        case "circle": a = splitArgs(it.v).map(num); body.push('<ellipse cx="' + r2(px(a[0])) + '" cy="' + r2(py(a[1])) + '" rx="' + r2(px(a[0] + a[2]) - px(a[0])) + '" ry="' + r2(py(a[1]) - py(a[1] + a[2])) + '" fill="none" style="stroke:var(--def)" stroke-width="2"/>'); break;
        case "vec": case "seg": case "line":
          a = colourArgs(splitArgs(it.v)); c = a[1]; a = a[0];
          if (a.length === 2) a = [0, 0, a[0], a[1]];
          var sx0 = px(a[0]), sy0 = py(a[1]), sx1 = px(a[2]), sy1 = py(a[3]), sdx = sx1 - sx0, sdy = sy1 - sy0, slen = Math.sqrt(sdx * sdx + sdy * sdy);
          if (!(slen > 0.5)) break;
          if (it.k === "line") { var ext = 2 * (W + H) / slen; sx0 -= sdx * ext; sy0 -= sdy * ext; sx1 += sdx * ext; sy1 += sdy * ext; }
          body.push('<line x1="' + r2(sx0) + '" y1="' + r2(sy0) + '" x2="' + r2(sx1) + '" y2="' + r2(sy1) + '" style="stroke:' + c + '" stroke-width="2" stroke-linecap="round" ' + clip + "/>");
          if (it.k === "vec") {     // the head has the same size in every figure: 9 px, 24 degrees to each side
            var hl = Math.min(9, slen * 0.45), ux = sdx / slen, uy = sdy / slen, ca = Math.cos(0.42), sa = Math.sin(0.42);
            var hp = [[sx1 - hl * (ux * ca - uy * sa), sy1 - hl * (uy * ca + ux * sa)], [sx1, sy1], [sx1 - hl * (ux * ca + uy * sa), sy1 - hl * (uy * ca - ux * sa)]];
            body.push('<polyline points="' + hp.map(function (q) { return r2(q[0]) + "," + r2(q[1]); }).join(" ") + '" fill="none" style="stroke:' + c + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' + clip + "/>");
          }
          break;
        case "fill":
          a = colourArgs(splitArgs(it.v)); c = a[1]; a = a[0]; var fp = [];
          for (k = 0; k + 1 < a.length; k += 2) fp.push(r2(px(a[k])) + "," + r2(py(a[k + 1])));
          body.unshift('<polygon points="' + fp.join(" ") + '" style="fill:' + c + ';fill-opacity:.18;stroke:' + c + ';stroke-opacity:.45" stroke-width="1" ' + clip + "/>");
          break;
        case "grid":
          a = colourArgs(splitArgs(it.v)); c = a[1]; a = a[0];
          var ga = a[0], gb = a[1], gc = a[2], gd = a[3], gdet = ga * gd - gb * gc, gk = a.length > 4 ? Math.round(a[4]) : 30;
          var lo = [-gk, -gk], hi = [gk, gk], slo = [-60, -60], shi = [60, 60];
          if (Math.abs(gdet) > 1e-9) {      // which grid lines can be seen: the preimage of the window's corners
            var pre = [[X[0], Y[0]], [X[0], Y[1]], [X[1], Y[0]], [X[1], Y[1]]].map(function (q) { return [(gd * q[0] - gb * q[1]) / gdet, (-gc * q[0] + ga * q[1]) / gdet]; });
            for (var gi = 0; gi < 2; gi++) {
              var vs = pre.map(function (q) { return q[gi]; });
              slo[gi] = Math.min.apply(null, vs) - 1; shi[gi] = Math.max.apply(null, vs) + 1;
              lo[gi] = Math.max(-gk, Math.ceil(slo[gi])); hi[gi] = Math.min(gk, Math.floor(shi[gi]));
            }
          }
          var gl = [], gline = function (p, q) { gl.push('<line x1="' + r2(px(ga * p[0] + gb * p[1])) + '" y1="' + r2(py(gc * p[0] + gd * p[1])) + '" x2="' + r2(px(ga * q[0] + gb * q[1])) + '" y2="' + r2(py(gc * q[0] + gd * q[1])) + '"/>'); };
          for (var gx2 = lo[0]; gx2 <= hi[0] && gl.length < 200; gx2++) gline([gx2, slo[1]], [gx2, shi[1]]);
          for (var gy2 = lo[1]; gy2 <= hi[1] && gl.length < 400; gy2++) gline([slo[0], gy2], [shi[0], gy2]);
          body.unshift('<g style="stroke:' + c + ';stroke-opacity:.5" stroke-width="1" ' + clip + ">" + gl.join("") + "</g>");
          break;
        case "label":
          a = splitArgs(it.v);
          body.push('<text class="fig-label" x="' + r2(px(num(a[0]))) + '" y="' + r2(py(num(a[1]))) + '" text-anchor="middle">' + String(a.slice(2).join(",")).replace(/[&<>]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]; }) + "</text>");
          break;
      }
    });
    svg.push(body.join(""));
    svg.push("</svg>");
    el.innerHTML = svg.join("");
    el.dataset.done = "1";
  }

  function renderAll(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll(".fig:not([data-done])"), function (el) {
      try { render(el, el.getAttribute("data-spec")); } catch (e) { el.dataset.err = String(e.message || e); el.innerHTML = ""; }
    });
  }
  function html(spec) { return '<div class="fig" data-spec="' + String(spec).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;") + '"></div>'; }

  window.CUSP_FIG = { render: render, renderAll: renderAll, html: html, compile: compile, num: num };
})();
