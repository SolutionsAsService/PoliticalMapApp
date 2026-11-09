Gov.boot('systems', function (data, G) {
  var $ = G.$, esc = G.esc, root = $('#sys');
  var byId = {}; data.forEach(function (s) { byId[s.id] = s; });
  var id = new URLSearchParams(location.search).get('id'), s = byId[id];
  if (!s) {
    document.title = 'Not found | Ages of Rule';
    root.innerHTML = '<h1>System not found</h1><p class="sub">No system has the id “' + esc(id || '') + '”. <a href="systems.html">Browse all systems</a>.</p>';
    return;
  }
  document.title = s.name + ' (' + G.fmtRange(s) + ') | Ages of Rule';
  var meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = s.name + ', ' + G.fmtRange(s) + '. ' + s.summary;
  var idx = data.indexOf(s), prev = data[idx - 1], next = data[idx + 1];
  var others = data.filter(function (o) { return o !== s && G.overlap(s, o) > 0; })
    .sort(function (a, b) { return G.overlap(s, b) - G.overlap(s, a); });
  var fam = G.famById[s.family];
  var sameFam = others.filter(function (o) { return o.family === s.family; }).length;

  root.innerHTML =
    '<p class="crumbs"><a href="systems.html">All systems</a></p>' +
    '<div class="fam-' + s.family + '">' + G.familyTag(s) + '</div>' +
    '<h1>' + esc(s.name) + '</h1>' +
    '<div class="sys-head"><span class="dates">' + G.fmtRange(s) + '</span><span>' + G.fmtN(G.dur(s)) + ' years' + (s.end == null ? ' so far' : '') + (s.approx ? ' (approximate dates)' : '') + '</span></div>' +
    '<figure class="locator"><figcaption>Where it sits in time: the grey shape is how many systems were alive in each year; the band is this one.</figcaption><svg id="loc" role="img" aria-label="' + esc(s.name) + ' located on the full timeline"></svg></figure>' +
    '<div class="two"><div><h2>The story</h2><dl class="facts">' +
    '<div><dt>In brief</dt><dd>' + esc(s.summary) + '</dd></div>' +
    '<div><dt>Where</dt><dd>' + esc(s.region) + '</dd></div>' +
    '<div><dt>How it began</dt><dd>' + esc(s.origin) + '</dd></div>' +
    '<div><dt>' + (s.end == null ? 'Today' : 'How it ended') + '</dt><dd>' + esc(s.ending) + '</dd></div>' +
    G.lineage(s, byId, data) + '</dl>' +
    '<p style="margin-top:14px"><a href="timeline.html#' + esc(s.id) + '">Show on the timeline &rarr;</a></p></div>' +
    '<div><h2>Alive at the same time</h2>' +
    (others.length ? '<p class="sub">' + others.length + ' systems overlapped it, ' + sameFam + ' of them in the same family. Longest overlap first.</p><ul class="plain">' +
      others.slice(0, 14).map(function (o) {
        return '<li class="fam-' + o.family + '"><i class="dot" aria-hidden="true"></i>' + G.link(o) + '<span>' + G.fmtN(G.overlap(s, o)) + ' yrs</span></li>';
      }).join('') + '</ul>' + (others.length > 14 ? '<p class="sub" style="margin-top:8px">and ' + (others.length - 14) + ' more with shorter overlaps.</p>' : '')
      : '<p class="sub">Nothing else in this record overlapped it.</p>') +
    '</div></div>' +
    '<nav class="pn" aria-label="Neighbours by start date">' +
    (prev ? '<a href="system.html?id=' + prev.id + '">&larr; Began earlier: ' + esc(prev.name) + '</a>' : '<span></span>') +
    (next ? '<a href="system.html?id=' + next.id + '">Began later: ' + esc(next.name) + ' &rarr;</a>' : '<span></span>') + '</nav>';

  function draw() {
    G.skyline($('#loc'), data, { height: 120, mute: true, band: { a: s.start, b: G.endY(s), family: s.family } });
  }
  draw();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(draw, 80); });
});
