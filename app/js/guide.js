/* In-app reader for a course's guide (courses/<id>/guide/guide.json, loaded with the course's data).
   The link to the online version is kept. */
(function () {
  "use strict";
  var C = window.CUSP, $ = C.$, escapeHtml = C.escapeHtml;

  function sections(c) { return (c.guideData && c.guideData.sections) || {}; }
  function guideSection(anchor, c) { c = c || C.course(); return c.guide ? sections(c)[String(anchor || "").replace(/^#/, "")] || null : null; }

  var scrollLock = "";
  function show(g) { if (g.hidden) scrollLock = document.body.style.overflow; g.hidden = false; document.body.style.overflow = "hidden"; }
  function openGuide(anchor, c) {
    c = c || C.course(); var G = c.guide; if (!G) return;
    var sec = guideSection(anchor, c), s = C.stringsFor(c);
    if (!sec) { if (G.url) window.open(G.url + anchor, "_blank", "noopener"); return; }
    var g = $("guide"), body = $("guideBody");
    $("guideKicker").textContent = (G.name || G.title) + " · " + sec.chapter;
    $("guideTitle").textContent = sec.title;
    body.innerHTML = '<div class="guide-inner">' + sec.html +
      '<div class="guide-foot">' + (G.url ? '<a href="' + escapeHtml(G.url + anchor) + '" target="_blank" rel="noopener">' + escapeHtml(s.openOnline) + " ↗</a>" : "") +
      "<span>" + (G.author ? escapeHtml(G.author) + ", " : "") + "<i>" + escapeHtml(G.title || "") + "</i></span></div></div>";
    body.scrollTop = 0;
    show(g);
    C.typeset(body);
    $("guideClose").focus({ preventScroll: true });
  }
  function openGuideIndex(c) {
    c = c || C.course(); var G = c.guide; if (!G) return;
    var data = c.guideData || {}, s = C.stringsFor(c), secs = sections(c);
    var g = $("guide"), body = $("guideBody");
    $("guideKicker").textContent = G.author || G.name || "";
    $("guideTitle").textContent = G.title || G.name || "";
    var html = '<div class="guide-inner"><nav class="g-toc" aria-label="' + escapeHtml(s.toc) + '">', ch = null;
    (data.order || []).forEach(function (k) {
      var sec = secs[k];
      if (sec.chapter !== ch) { if (ch !== null) html += "</ol>"; ch = sec.chapter; html += "<h4>" + escapeHtml(ch) + "</h4><ol>"; }
      html += '<li><button type="button" data-k="' + escapeHtml(k) + '">' + escapeHtml(sec.title) + "</button></li>";
    });
    html += "</ol></nav>" + (G.url ? '<div class="guide-foot"><a href="' + escapeHtml(G.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.openOnline) + " ↗</a></div>" : "") + "</div>";
    body.innerHTML = html;
    Array.prototype.forEach.call(body.querySelectorAll(".g-toc button"), function (bt) {
      bt.addEventListener("click", function () { var keep = scrollLock; openGuide("#" + bt.dataset.k, c); scrollLock = keep; });
    });
    body.scrollTop = 0;
    show(g);
    C.typeset(body);
  }
  function closeGuide() { $("guide").hidden = true; document.body.style.overflow = scrollLock; }
  $("guideClose").addEventListener("click", closeGuide);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("guide").hidden) closeGuide(); });

  C.guideSection = guideSection; C.openGuide = openGuide; C.openGuideIndex = openGuideIndex;
})();
