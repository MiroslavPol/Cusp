/* The course path as a map.
   - icon(spec): tiny function portraits for the lesson nodes (white on the node colour)
   - space(root, opts): the course as a spiral that starts on the outer rim and winds into a black hole
     (the final test), drawn over a coordinate grid that is flat far away and "slightly twisted" near the
     hole. Pan by dragging, zoom by pinching / the wheel / the buttons; tapping a node shows its card.
   Called from learn.js (renderPath), which supplies the items, the HUD and the card contents. */
(function () {
  "use strict";
  var F = function () { return window.LEMMA_FIG; };
  var NS = "http://www.w3.org/2000/svg";

  // ---------------------------------------------------------------- icons
  // Coordinates are in [-1,1]^2 with y up. Spec items, separated by ";":
  //   f=expr  fd=expr (dashed)  seq=expr(n) with N=count  pt=x,y  hole=x,y  line/dash/bar/arrow=x1,y1,x2,y2
  //   tan=x0  sec=a,b  (on the first f)  shade=a,b (first f to the x-axis)  between=a,b (first two f)
  //   rect=a,b,n (rectangles under the first f)  band=y1,y2  circle=cx,cy,r  ell=cx,cy,rx,ry
  //   poly=x1,y1,...  text=glyph  size=k  ax=x0,y0 (axis origin)  noaxes
  function r3(v) { return Math.round(v * 1000) / 1000; }
  function args(v) { return v.split(",").map(function (s) { return F().num(s.trim()); }); }
  function icon(spec) {
    var o = { fs: [], items: [], ax: [0, 0], axes: true, N: 8, size: 1 };
    String(spec).split(";").forEach(function (part) {
      part = part.trim(); if (!part) return;
      if (part === "noaxes") { o.axes = false; return; }
      var i = part.indexOf("="); if (i < 0) return;
      var k = part.slice(0, i).trim(), v = part.slice(i + 1).trim();
      if (k === "ax") o.ax = args(v);
      else if (k === "N") o.N = +v;
      else if (k === "size") o.size = +v;
      else { o.items.push({ k: k, v: v }); if (k === "f" || k === "fd") o.fs.push(F().compile(v, "x")); }
    });
    var ax = o.ax, g = [], txt = "", W = 0.14;
    function Y(y) { return r3(-y); }
    function L(x1, y1, x2, y2, extra) { return '<line x1="' + r3(x1) + '" y1="' + Y(y1) + '" x2="' + r3(x2) + '" y2="' + Y(y2) + '"' + (extra || "") + "/>"; }
    function curve(f, a, b) {
      var d = "", pen = false, prev = null, n = 90;
      for (var i = 0; i <= n; i++) {
        var x = a + (b - a) * i / n, y = f(x);
        var ok = isFinite(y) && Math.abs(y) < 1.6;
        if (ok && prev !== null && Math.abs(y - prev) > 0.5) pen = false;
        if (ok) { d += (pen ? "L" : "M") + r3(x) + " " + Y(y); pen = true; prev = y; } else { pen = false; prev = null; }
      }
      return d;
    }
    if (o.axes) g.push('<g class="i-ax">' + L(-1.1, ax[1], 1.1, ax[1]) + L(ax[0], -1.1, ax[0], 1.1) + "</g>");
    var fi = 0;
    o.items.forEach(function (it) {
      var a, f0 = o.fs[0], k = it.k;
      try {
        if (k === "f" || k === "fd") {
          var f = o.fs[fi++];
          g.push('<path d="' + curve(f, -1.1, 1.1) + '"' + (k === "fd" ? ' class="i-dash"' : "") + "/>");
        } else if (k === "seq") {
          var s = F().compile(it.v, "n");
          for (var n = 1; n <= o.N; n++) {
            var y = s(n); if (!isFinite(y)) continue;
            g.push('<circle class="i-dot" cx="' + r3(-0.85 + 1.7 * (n - 1) / (o.N - 1)) + '" cy="' + Y(y) + '" r="0.085"/>');
          }
        } else if (k === "pt") { a = args(it.v); g.push('<circle class="i-dot" cx="' + r3(a[0]) + '" cy="' + Y(a[1]) + '" r="0.12"/>'); }
        else if (k === "hole") { a = args(it.v); g.push('<circle class="i-hole" cx="' + r3(a[0]) + '" cy="' + Y(a[1]) + '" r="0.11"/>'); }
        else if (k === "line") { a = args(it.v); g.push(L(a[0], a[1], a[2], a[3])); }
        else if (k === "dash") { a = args(it.v); g.push(L(a[0], a[1], a[2], a[3], ' class="i-dash"')); }
        else if (k === "bar") { a = args(it.v); g.push(L(a[0], a[1], a[2], a[3], ' class="i-bar"')); }
        else if (k === "arrow") {
          a = args(it.v);
          var ang = Math.atan2(a[3] - a[1], a[2] - a[0]), h = 0.26;
          g.push(L(a[0], a[1], a[2], a[3]) + '<path d="M' + r3(a[2] - h * Math.cos(ang - 0.5)) + " " + Y(a[3] - h * Math.sin(ang - 0.5)) + "L" + r3(a[2]) + " " + Y(a[3]) + "L" + r3(a[2] - h * Math.cos(ang + 0.5)) + " " + Y(a[3] - h * Math.sin(ang + 0.5)) + '"/>');
        } else if (k === "tan" || k === "sec") {
          a = args(it.v);
          var x0, y0, m;
          if (k === "tan") { x0 = a[0]; y0 = f0(x0); m = (f0(x0 + 1e-4) - f0(x0 - 1e-4)) / 2e-4; }
          else { x0 = a[0]; y0 = f0(a[0]); m = (f0(a[1]) - y0) / (a[1] - a[0]); }
          var dx = 0.75 / Math.sqrt(1 + m * m);
          var xa = k === "sec" ? a[0] - 0.25 * (a[1] - a[0]) : x0 - dx, xb = k === "sec" ? a[1] + 0.25 * (a[1] - a[0]) : x0 + dx;
          g.push(L(xa, y0 + m * (xa - x0), xb, y0 + m * (xb - x0), k === "sec" ? ' class="i-dash"' : ' class="i-acc"'));
          if (k === "sec") g.push('<circle class="i-dot" cx="' + r3(a[0]) + '" cy="' + Y(f0(a[0])) + '" r="0.1"/><circle class="i-dot" cx="' + r3(a[1]) + '" cy="' + Y(f0(a[1])) + '" r="0.1"/>');
        } else if (k === "shade" || k === "between") {
          a = args(it.v);
          var g2 = k === "between" ? o.fs[1] : function () { return ax[1]; }, top = "", bot = "";
          for (var i = 0; i <= 40; i++) {
            var x = a[0] + (a[1] - a[0]) * i / 40;
            top += (i ? "L" : "M") + r3(x) + " " + Y(f0(x));
            var xb2 = a[1] - (a[1] - a[0]) * i / 40;
            bot += "L" + r3(xb2) + " " + Y(g2(xb2));
          }
          g.unshift('<path class="i-fill" d="' + top + bot + 'Z"/>');
        } else if (k === "rect") {
          a = args(it.v);
          var w = (a[1] - a[0]) / a[2], rs = "";
          for (var j = 0; j < a[2]; j++) {
            var xl = a[0] + j * w, hgt = f0(xl + w / 2) - ax[1];
            rs += '<rect x="' + r3(xl) + '" y="' + Y(ax[1] + Math.max(hgt, 0)) + '" width="' + r3(w) + '" height="' + r3(Math.abs(hgt)) + '"/>';
          }
          g.unshift('<g class="i-rect">' + rs + "</g>");
        } else if (k === "band") { a = args(it.v); g.unshift('<rect class="i-fill" x="-1.1" y="' + Y(a[1]) + '" width="2.2" height="' + r3(a[1] - a[0]) + '"/>'); }
        else if (k === "circle") { a = args(it.v); g.push('<circle cx="' + r3(a[0]) + '" cy="' + Y(a[1]) + '" r="' + r3(a[2]) + '"/>'); }
        else if (k === "ell") { a = args(it.v); g.push('<ellipse cx="' + r3(a[0]) + '" cy="' + Y(a[1]) + '" rx="' + r3(a[2]) + '" ry="' + r3(a[3]) + '"/>'); }
        else if (k === "poly") {
          a = args(it.v); var d = "";
          for (var q = 0; q + 1 < a.length; q += 2) d += (q ? "L" : "M") + r3(a[q]) + " " + Y(a[q + 1]);
          g.push('<path d="' + d + '"/>');
        } else if (k === "text") {
          txt = '<text x="0" y="0" dominant-baseline="central" text-anchor="middle" class="i-text" style="font-size:' + r3(1.25 * o.size) + 'px">' + it.v.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</text>";
        }
      } catch (e) { /* a bad icon item just isn't drawn */ }
    });
    return '<svg class="licon" viewBox="-1.15 -1.15 2.3 2.3" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="' + W + '" stroke-linecap="round" stroke-linejoin="round">' + g.join("") + "</g>" + txt + "</svg>";
  }

  // ================================================================ the spiral map
  // The course is an Archimedean spiral r(φ) = R − b(φ − φ0), b = D/2π, that starts at the top of the
  // outer rim and winds clockwise into a black hole at the centre. Nodes sit at equal arc length S.
  // Behind it: a Cartesian grid that is flat far away and twisted (and pulled in) near the hole.
  var S = 82,        // arc length between two nodes
      D = 132,       // distance between two turns of the spiral
      R_IN = 178,    // radius of the last node
      R_HOLE = 62,   // the path falls in here
      MARGIN = 330,  // space around the spiral (axis labels, stars, the metric on the rim)
      UNIT = 120,    // one unit of the coordinate grid, in world pixels
      PHI0 = -Math.PI / 2;
  var B = D / (2 * Math.PI);

  // arc length of the spiral from radius 0 to r (closed form)
  function arcF(r) { var u = r / B; return (B / 2) * (u * Math.sqrt(1 + u * u) + Math.log(u + Math.sqrt(1 + u * u))); }
  function solve(f, lo, hi) { for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; } return (lo + hi) / 2; }

  function geometry(n) {
    var rOut = n > 1 ? solve(function (R) { return arcF(R) - arcF(R_IN) - (n - 1) * S; }, R_IN, R_IN + n * S) : R_IN;
    var H = Math.ceil(rOut + MARGIN), C = H;      // world is 2H × 2H, the hole at (C, C)
    function phi(r) { return PHI0 + (rOut - r) / B; }
    function at(r, off) { var p = phi(r), rr = r + (off || 0); return [C + rr * Math.cos(p), C + rr * Math.sin(p)]; }
    var radii = [];
    for (var i = 0; i < n; i++) { var target = arcF(rOut) - i * S; radii.push(solve(function (r) { return arcF(r) - target; }, 0, rOut + 1)); }
    // points along the spiral between two radii (r1 > r2), off = radial offset
    function trace(r1, r2, off) {
      var pts = [], p1 = phi(r1), p2 = phi(r2), steps = Math.max(2, Math.ceil(Math.abs(p2 - p1) / 0.025));
      for (var k = 0; k <= steps; k++) { var p = p1 + (p2 - p1) * k / steps; pts.push(at(rOut - (p - PHI0) * B, off)); }
      return pts;
    }
    return { rOut: rOut, H: H, C: C, radii: radii, phi: phi, at: at, trace: trace };
  }

  // the "slightly twisted" plane: frame dragging around the hole plus a little gravitational pull
  function warp(x, y) {
    var r = Math.sqrt(x * x + y * y), th = Math.atan2(y, x);
    var r2 = r * (1 - 0.42 * Math.exp(-r * r / (2 * 150 * 150)));
    var th2 = th + 0.95 * Math.exp(-r / 300);
    return [r2 * Math.cos(th2), r2 * Math.sin(th2)];
  }

  function rng(seed) {   // small deterministic PRNG, so the sky is the same every time
    var h = 2166136261; for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h += 0x6D2B79F5; var t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function f1(v) { return v.toFixed(1); }
  function poly(pts) { return pts.map(function (p, i) { return (i ? "L" : "M") + f1(p[0]) + " " + f1(p[1]); }).join(""); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function background(g, key, opts) {
    var H = g.H, C = g.C, out = [], rand = rng(key);
    // stars
    var stars = "", n = Math.round((4 * H * H) / 2600);
    for (var i = 0; i < n; i++) {
      var x = rand() * 2 * H, y = rand() * 2 * H, r = 0.35 + Math.pow(rand(), 3) * 1.5, o = 0.25 + rand() * 0.7;
      stars += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r.toFixed(2) + '" opacity="' + o.toFixed(2) + '"' + (rand() < 0.08 ? ' class="tw" style="animation-delay:-' + (rand() * 4).toFixed(1) + 's"' : "") + "/>";
    }
    out.push('<g class="sp-stars">' + stars + "</g>");
    // the twisted Cartesian grid
    var step = UNIT / 2, minor = "", major = "", axes = "", lim = H - 10;
    function line(x0, y0, x1, y1) {
      var pts = [], len = Math.hypot(x1 - x0, y1 - y0), m = Math.ceil(len / 10);
      for (var k = 0; k <= m; k++) {
        var x = x0 + (x1 - x0) * k / m, y = y0 + (y1 - y0) * k / m;
        if (x * x + y * y < 40 * 40) { if (pts.length) pts.push(null); continue; }
        var w = warp(x, y); pts.push([C + w[0], C + w[1]]);
      }
      var d = "", pen = false;
      pts.forEach(function (p) { if (!p) { pen = false; return; } d += (pen ? "L" : "M") + f1(p[0]) + " " + f1(p[1]); pen = true; });
      return d;
    }
    for (var v = -Math.floor(lim / step) * step; v <= lim; v += step) {
      var d = line(v, -lim, v, lim) + line(-lim, v, lim, v);
      if (v === 0) axes += d; else if (v % UNIT === 0) major += d; else minor += d;
    }
    out.push('<g class="sp-grid" mask="url(#spFade-' + key + ')"><path class="g-min" d="' + minor + '"/><path class="g-maj" d="' + major + '"/><path class="g-axis" d="' + axes + '"/></g>');
    // axis arrows, x / y, tick numbers (y up, as it should be)
    function arrow(x, y, dx, dy, label) {
      var a = warp(x, y), b = warp(x - dx * 14, y - dy * 14), ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
      var ax = C + a[0], ay = C + a[1], h = 11;
      return '<path class="g-arrow" d="M' + f1(ax - h * Math.cos(ang - 0.45)) + " " + f1(ay - h * Math.sin(ang - 0.45)) + "L" + f1(ax) + " " + f1(ay) + "L" + f1(ax - h * Math.cos(ang + 0.45)) + " " + f1(ay - h * Math.sin(ang + 0.45)) + '"/>' +
        '<text class="g-name" x="' + f1(ax + 16 * Math.cos(ang) + (dx ? 0 : 12)) + '" y="' + f1(ay + 16 * Math.sin(ang) + (dy ? 0 : -10)) + '">' + label + "</text>";
    }
    var ticks = "";
    for (var t = 1; t * UNIT < lim - 30; t++) {
      [[t, 0, String(t)], [-t, 0, "−" + t], [0, -t, String(t)], [0, t, "−" + t]].forEach(function (q) {
        if (t * UNIT < 230) return;                              // too close to the hole to read
        var w = warp(q[0] * UNIT, q[1] * UNIT);
        ticks += '<text class="g-tick" x="' + f1(C + w[0] + (q[1] ? 9 : 0)) + '" y="' + f1(C + w[1] + (q[1] ? 4 : 17)) + '"' + (q[1] ? "" : ' text-anchor="middle"') + ">" + q[2] + "</text>";
      });
    }
    out.push('<g class="sp-axes">' + arrow(lim, 0, 1, 0, "x") + arrow(0, -lim, 0, -1, "y") + ticks + "</g>");
    // the metric, around the rim
    var rr = g.rOut + 150;
    out.push('<path id="spRim-' + key + '" d="M' + f1(C - rr * Math.cos(0.5)) + " " + f1(C - rr * Math.sin(0.5)) + "A" + f1(rr) + " " + f1(rr) + " 0 0 1 " + f1(C + rr * Math.cos(0.5)) + " " + f1(C - rr * Math.sin(0.5)) + '" fill="none"/>' +
      '<text class="sp-metric"><textPath href="#spRim-' + key + '" startOffset="50%" text-anchor="middle">' + esc(opts.metric) + "</textPath></text>");
    var defs = '<defs><radialGradient id="spFadeG-' + key + '"><stop offset="0" stop-color="#fff"/><stop offset="' + ((g.rOut + 60) / H).toFixed(3) + '" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0.15"/></radialGradient>' +
      '<mask id="spFade-' + key + '"><rect width="' + 2 * H + '" height="' + 2 * H + '" fill="url(#spFadeG-' + key + ')"/></mask></defs>';
    return defs + out.join("");
  }

  // the course itself: path, unit names along the outside of their arc, lecture ticks inside
  function course(g, items, key) {
    var out = [], r = g.radii, last = items.length - 1;
    // lead-in from outer space and the fall into the hole
    out.push('<path class="sp-path lead" d="' + poly(g.trace(r[0] + D * 0.55, r[0])) + '"/>');
    for (var i = 0; i < last; i++) {
      out.push('<path class="sp-path' + (items[i].status === "done" ? " done" : "") + '" style="--c:' + items[i + 1].color + '" d="' + poly(g.trace(r[i], r[i + 1])) + '"/>');
    }
    out.push('<path class="sp-path fall' + (items[last].status === "done" ? " done" : "") + '" style="--c:' + items[last].color + '" d="' + poly(g.trace(r[last], R_HOLE)) + '"/>');
    items.forEach(function (it, i) {
      if (it.unitTitle) {
        var r1 = solve(function (x) { return arcF(x) - (arcF(r[i]) - S * 0.45); }, 0, r[i]);        // start half a step after the node
        var r2 = solve(function (x) { return arcF(x) - (arcF(r[i]) - 360); }, 0, r[i]);     // ~330px of arc for the name
        var pts = g.trace(r1, Math.max(r2, R_HOLE), 44);
        var mid = pts[Math.floor(pts.length / 2)];
        if (mid[1] > g.C) pts.reverse();                                                  // keep it upright on the lower half
        var id = "spU-" + key + "-" + i;
        out.push('<path id="' + id + '" d="' + poly(pts) + '" fill="none"/>' +
          '<text class="sp-unit" style="fill:' + it.color + '"><textPath href="#' + id + '" startOffset="' + (mid[1] > g.C ? "100%" : "0") + '" text-anchor="' + (mid[1] > g.C ? "end" : "start") + '">' +
          '<tspan class="sp-unit-k">' + esc(it.unitKicker) + "  </tspan>" + esc(it.unitTitle) + "</textPath></text>");
      }
      if (it.tick) {
        var p = g.at(r[i], -44);
        out.push('<text class="sp-tick" x="' + f1(p[0]) + '" y="' + f1(p[1] + 3.5) + '">' + esc(it.tick) + "</text>");
      }
    });
    return out.join("");
  }

  function hole(status) {
    var W = 280, c = W / 2;
    var back = '<svg class="bh-svg" viewBox="0 0 ' + W + " " + W + '" aria-hidden="true"><g transform="translate(' + c + " " + c + ') rotate(-16)">' +
      '<circle class="bh-glow" r="60"/><path class="s-disk back" d="M-108 0A108 24 0 0 1 108 0"/><path class="s-disk back thin" d="M-76 0A76 16 0 0 1 76 0"/></g></svg>';
    var front = '<svg class="bh-svg front" viewBox="0 0 ' + W + " " + W + '" aria-hidden="true"><g transform="translate(' + c + " " + c + ') rotate(-16)">' +
      '<path class="s-disk" d="M108 0A108 24 0 0 1 -108 0"/><path class="s-disk thin" d="M76 0A76 16 0 0 1 -76 0"/></g></svg>';
    return back + '<button type="button" class="sing-core" data-id="sing"><span>' + (status === "done" ? "∎" : "∞") + "</span></button>" + front;
  }

  // ---------------------------------------------------------------- pan & zoom
  var views = {}, seenCurrent = {}, active = null;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function space(root, opts) {
    var key = opts.key, items = opts.items, g = geometry(items.length), H = g.H;
    root.innerHTML = "";
    root.classList.add("space");
    var view = document.createElement("div"); view.className = "sp-view";
    var world = document.createElement("div"); world.className = "sp-world";
    world.style.width = world.style.height = 2 * H + "px";
    world.innerHTML = '<svg class="sp-svg" width="' + 2 * H + '" height="' + 2 * H + '" viewBox="0 0 ' + 2 * H + " " + 2 * H + '" aria-hidden="true">' +
      background(g, key, opts) + course(g, items, key) + "</svg>";
    var byId = {};
    items.forEach(function (it, i) {
      var p = g.at(g.radii[i]), wrap = document.createElement("div");
      wrap.className = "sp-node"; wrap.style.left = f1(p[0]) + "px"; wrap.style.top = f1(p[1]) + "px";
      wrap.style.setProperty("--u", it.color);
      wrap.innerHTML = '<button type="button" class="node ' + it.status + (it.checkpoint ? " cp" : "") + (it.bonus ? " bonus" : "") + '" data-id="' + esc(it.id) + '" aria-label="' + esc(it.aria) + '">' + it.icon + it.badge + "</button>";
      world.appendChild(wrap);
      byId[it.id] = { item: it, x: p[0], y: p[1], btn: wrap.querySelector("button") };
    });
    var bh = document.createElement("div");
    bh.className = "bh is-" + opts.sing.status; bh.style.left = bh.style.top = g.C + "px";
    bh.innerHTML = hole(opts.sing.status);
    bh.querySelector(".sing-core").setAttribute("aria-label", opts.sing.title);
    world.appendChild(bh);
    byId.sing = { item: { id: "sing" }, x: g.C, y: g.C, btn: bh.querySelector(".sing-core") };
    view.appendChild(world);

    // HUD
    var top = document.createElement("div"); top.className = "hud hud-top";
    if (opts.hud) top.appendChild(opts.hud);
    var tools = document.createElement("div"); tools.className = "hud hud-tools";
    [["here", "⌖"], ["fit", "◎"], ["zin", "+"], ["zout", "−"]].forEach(function (t) {
      var b = document.createElement("button"); b.type = "button"; b.className = "hud-btn"; b.dataset.t = t[0];
      b.textContent = t[1]; b.setAttribute("aria-label", opts.strings[t[0]]); b.title = opts.strings[t[0]];
      tools.appendChild(b);
    });
    var coords = document.createElement("div"); coords.className = "hud hud-coords"; coords.setAttribute("aria-hidden", "true");
    var card = document.createElement("div"); card.className = "hud hud-card";
    top.appendChild(tools); top.appendChild(coords);      // they hang below the top panel
    root.appendChild(view); root.appendChild(top); root.appendChild(card);

    // camera: screen = world·k + (x, y)
    var cam = views[key] ? Object.assign({}, views[key].cam) : null, size = { w: 0, h: 0 }, focusId = null, anim = 0;
    function insets() {
      var vr = root.getBoundingClientRect();
      var t = top.getBoundingClientRect(), c = card.getBoundingClientRect();
      var topY = Math.max(0, t.bottom - vr.top), botY = card.offsetHeight ? Math.min(vr.height, c.top - vr.top) : vr.height;
      return { top: topY, bottom: botY, cx: vr.width / 2, cy: (topY + botY) / 2, h: Math.max(80, botY - topY) };
    }
    function fitK() { var ins = insets(); return Math.min(size.w / (2 * (g.rOut + 70)), ins.h / (2 * (g.rOut + 70))); }
    function kMin() { return Math.min(fitK() * 0.85, 0.9); }
    function apply() {
      cam.k = Math.max(kMin(), Math.min(2.4, cam.k));
      var m = g.rOut * cam.k;                            // keep some of the spiral on screen
      cam.x = Math.max(-g.C * cam.k - m + 80, Math.min(size.w - g.C * cam.k + m - 80, cam.x));
      cam.y = Math.max(-g.C * cam.k - m + 80, Math.min(size.h - g.C * cam.k + m - 80, cam.y));
      world.style.transform = "translate(" + cam.x.toFixed(1) + "px," + cam.y.toFixed(1) + "px) scale(" + cam.k.toFixed(4) + ")";
      views[key] = { cam: Object.assign({}, cam) };
      var ins = insets(), wx = (ins.cx - cam.x) / cam.k - g.C, wy = (ins.cy - cam.y) / cam.k - g.C;
      coords.textContent = "x " + (wx / UNIT).toFixed(2).replace("-", "−") + "   y " + (-wy / UNIT).toFixed(2).replace("-", "−");
    }
    function centerOn(wx, wy, k) { var ins = insets(); return { k: k, x: ins.cx - wx * k, y: ins.cy - wy * k }; }
    function fly(to, ms) {
      cancelAnimationFrame(anim);
      if (reduce || !ms) { cam = to; apply(); return; }
      var from = Object.assign({}, cam), t0 = performance.now();
      (function step(now) {
        var t = Math.min(1, (now - t0) / ms), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        var k = from.k * Math.pow(to.k / from.k, e);    // zoom geometrically, pan so the target stays on its path
        cam = { k: k, x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
        apply();
        if (t < 1) anim = requestAnimationFrame(step);
      })(t0);
    }
    function zoomAt(f, sx, sy) { var k = Math.max(kMin(), Math.min(2.4, cam.k * f)); f = k / cam.k; cam = { k: k, x: sx - (sx - cam.x) * f, y: sy - (sy - cam.y) * f }; apply(); }
    function nodeK() { return Math.max(cam.k, Math.min(1, Math.max(0.75, fitK() * 1.6))); }

    function focus(id, move) {
      var n = byId[id]; if (!n) return;
      if (focusId && byId[focusId]) byId[focusId].btn.classList.remove("is-focus");
      focusId = id; n.btn.classList.add("is-focus");
      card.innerHTML = ""; card.appendChild(opts.card(id));
      if (move) fly(centerOn(n.x, n.y, Math.max(cam.k, nodeK())), 650);
    }

    function measure() {
      var r = root.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      // the map runs under the page header and the tab bar; the HUD sits between them
      var head = root.parentNode && root.parentNode.querySelector(".top"), tabs = document.querySelector(".tabbar");
      root.style.setProperty("--top-h", (head ? head.offsetHeight : 0) + "px");
      root.style.setProperty("--bot-h", (tabs ? tabs.offsetHeight : 0) + "px");
      var first = !size.w; size = { w: r.width, h: r.height };
      if (first) {
        focus(opts.focus || opts.currentId || "sing", false);
        var cur = byId[opts.currentId] || byId.sing, again = seenCurrent[key];
        if (!cam) {                                          // first visit: from the whole map to where you are
          cam = centerOn(g.C, g.C, fitK()); apply();
          setTimeout(function () { fly(centerOn(cur.x, cur.y, nodeK()), 1500); }, 350);
        } else {
          apply();
          if (again && again !== opts.currentId) setTimeout(function () { fly(centerOn(cur.x, cur.y, Math.max(cam.k, nodeK())), 900); }, 250);
        }
        seenCurrent[key] = opts.currentId;
      } else apply();
      return true;
    }

    // pointer gestures: drag to pan, pinch / wheel to zoom; a drag never counts as a tap
    var ptrs = {}, moved = false, startDist = 0, startK = 1, startMid = null, last = null;
    function mid() { var a = Object.keys(ptrs).map(function (k) { return ptrs[k]; }); return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) }; }
    view.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      cancelAnimationFrame(anim);
      var r = root.getBoundingClientRect();
      ptrs[e.pointerId] = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (Object.keys(ptrs).length === 1) { moved = false; last = ptrs[e.pointerId]; }
      if (Object.keys(ptrs).length === 2) { var m = mid(); startDist = m.d; startK = cam.k; startMid = m; last = m; }
    });
    function onMove(e) {
      if (!ptrs[e.pointerId]) return;
      var r = root.getBoundingClientRect(), p = { x: e.clientX - r.left, y: e.clientY - r.top };
      var o = ptrs[e.pointerId]; ptrs[e.pointerId] = p;
      var n = Object.keys(ptrs).length;
      if (n === 1) {
        if (!moved && Math.hypot(p.x - last.x, p.y - last.y) < 7) { ptrs[e.pointerId] = o; return; }
        if (!moved) { o = last; moved = true; world.classList.add("moving"); }
        cam.x += p.x - o.x; cam.y += p.y - o.y; apply();
      } else if (n === 2) {
        moved = true; world.classList.add("moving");
        var m = mid();
        cam.x += m.x - last.x; cam.y += m.y - last.y; apply();
        zoomAt((startK * m.d / Math.max(1, startDist)) / cam.k, m.x, m.y);
        last = m;
      }
    }
    function up(e) {
      if (!ptrs[e.pointerId]) return;
      delete ptrs[e.pointerId];
      var left = Object.keys(ptrs);
      if (left.length === 1) last = ptrs[left[0]];
      if (!left.length) { world.classList.remove("moving"); setTimeout(function () { moved = false; }, 0); }
    }
    view.addEventListener("click", function (e) {
      if (moved) { e.stopPropagation(); e.preventDefault(); return; }
      var b = e.target.closest("button[data-id]"); if (!b) return;
      focus(b.dataset.id, true);
    }, true);
    view.addEventListener("focusin", function (e) {        // keyboard: Tab through the nodes, the map follows
      var b = e.target.closest("button[data-id]"); if (b && !Object.keys(ptrs).length) focus(b.dataset.id, true);
    });
    view.addEventListener("wheel", function (e) {
      e.preventDefault();
      var r = root.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
      var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY, dx = e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX;
      if (e.ctrlKey || (Math.abs(dy) >= 40 && !dx)) zoomAt(Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)), sx, sy);   // pinch / mouse wheel
      else { cam.x -= dx; cam.y -= dy; apply(); }                                                                    // trackpad scroll
    }, { passive: false });
    tools.addEventListener("click", function (e) {
      var b = e.target.closest(".hud-btn"); if (!b) return;
      var ins = insets(), t = b.dataset.t;
      if (t === "zin" || t === "zout") { cancelAnimationFrame(anim); var k = cam.k * (t === "zin" ? 1.4 : 1 / 1.4); var c0 = { k: k, x: ins.cx - (ins.cx - cam.x) * k / cam.k, y: ins.cy - (ins.cy - cam.y) * k / cam.k }; fly(c0, 220); }
      else if (t === "fit") fly(centerOn(g.C, g.C, fitK()), 700);
      else { var cur = byId[opts.currentId] || byId.sing; focus(cur.item.id, false); fly(centerOn(cur.x, cur.y, nodeK()), 700); }
    });

    var ctl = { refresh: measure, focus: function (id) { focus(id, true); }, move: onMove, up: up };
    active = ctl;
    measure();
    return ctl;
  }
  // one set of window listeners for whichever map is showing
  window.addEventListener("resize", function () { if (active) active.refresh(); });
  window.addEventListener("pointermove", function (e) { if (active) active.move(e); });
  window.addEventListener("pointerup", function (e) { if (active) active.up(e); });
  window.addEventListener("pointercancel", function (e) { if (active) active.up(e); });

  window.LEMMA_PATH = { icon: icon, space: space, refresh: function () { if (active) active.refresh(); } };
})();
