/* Timeline: lanes by family, bars packed into rows, zoom by pixels-per-year inside a sideways scroller. */
Gov.boot('timeline', function (data, G) {
  var $ = G.$, esc = G.esc, D0 = G.DOMAIN[0], D1 = G.DOMAIN[1];
  var byId = {}; data.forEach(function (s) { byId[s.id] = s; });
  var scroller = $('#scroller'), detail = $('#detail'), viewEl = $('#view');
  var ERAS = [
    { label: 'Whole record', a: D0, b: D1 },
    { label: 'Bronze & Iron Age', a: -3200, b: -500 },
    { label: 'Classical', a: -500, b: 500 },
    { label: 'Medieval', a: 500, b: 1500 },
    { label: 'Early modern', a: 1500, b: 1800 },
    { label: 'Modern', a: 1800, b: D1 }
  ];
  var ROW = 30, BAR = 24, HEAD = 30, AXIS = 34, MIN_W = 8;
  var st = { ppy: 0, fam: {}, status: 'all', q: '', sel: null, era: 0 };
  G.FAMILIES.forEach(function (f) { st.fam[f.id] = true; });

  var ctx = document.createElement('canvas').getContext('2d');
  ctx.font = '600 12px ' + getComputedStyle(document.body).fontFamily;
  function tw(t) { return ctx.measureText(t).width; }

  function cw() { return scroller.clientWidth || 900; }
  function minPPY() { return (cw() < 700 ? 960 : cw()) / (D1 - D0); }
  function maxPPY() { return 12; }
  function clampPPY(p) { return Math.max(minPPY(), Math.min(maxPPY(), p)); }

  /* ---------------------------------------------------------------- controls */
  $('#eras').insertAdjacentHTML('beforeend', ERAS.map(function (e, i) {
    return '<button type="button" data-era="' + i + '" aria-pressed="false">' + e.label + '</button>';
  }).join(''));
  $('#fams').innerHTML = '<div class="group"><span class="lbl">Families</span>' + G.FAMILIES.map(function (f) {
    return '<button type="button" class="fam fam-' + f.id + '" data-fam="' + f.id + '" aria-pressed="true">' + esc(f.label) + '</button>';
  }).join('') + '</div>';

  function matches(s) {
    if (!st.fam[s.family]) return false;
    if (st.status === 'ended' && s.end == null) return false;
    if (st.status === 'ongoing' && s.end != null) return false;
    if (st.q) {
      var hay = (s.name + ' ' + s.region + ' ' + s.origin).toLowerCase();
      if (hay.indexOf(st.q) < 0) return false;
    }
    return true;
  }

  /* ---------------------------------------------------------------- axis */
  function ticks(ppy) {
    var steps = [10, 25, 50, 100, 250, 500, 1000], step = 1000, i, out = [], y;
    for (i = 0; i < steps.length; i++) if (steps[i] * ppy >= 90) { step = steps[i]; break; }
    for (y = Math.ceil(D0 / step) * step; y <= D1; y += step) out.push(y);
    return out;
  }
  function tickLabel(y) { return y === 0 ? '1 CE' : G.yr(y); }
  function axisSVG(W, ppy, x) {
    var h = '<svg width="' + W + '" height="' + AXIS + '" aria-hidden="true"><line class="axis" x1="0" x2="' + W + '" y1="' + (AXIS - 1) + '" y2="' + (AXIS - 1) + '"/>';
    ticks(ppy).forEach(function (y) {
      var tx = x(y);
      h += '<line class="axis" x1="' + tx + '" x2="' + tx + '" y1="' + (AXIS - 8) + '" y2="' + (AXIS - 1) + '"/>' +
        '<text class="xtick" x="' + (tx + 4) + '" y="' + (AXIS - 14) + '">' + tickLabel(y) + '</text>';
    });
    return h + '</svg>';
  }

  /* ---------------------------------------------------------------- render */
  var longLabels = []; // {el, bx, bw, tw} for sticky label clamping
  function render() {
    var ppy = st.ppy, W = Math.round((D1 - D0) * ppy);
    function x(y) { return Math.round((y - D0) * ppy * 10) / 10; }
    var grid = ticks(ppy).map(function (y) { return x(y); });
    var html = '<div style="width:' + W + 'px"><div class="axis-row">' + axisSVG(W, ppy, x) + '</div>';
    var shown = 0;
    longLabels = [];
    G.FAMILIES.forEach(function (f) {
      var items = data.filter(function (s) { return s.family === f.id && matches(s); });
      if (!items.length) return;
      shown += items.length;
      // pack into rows (px-based, so it depends on zoom)
      var rows = [];
      items.forEach(function (s) {
        var x0 = x(s.start), x1 = Math.max(x(G.endY(s)), x0 + MIN_W);
        var extent = (x1 - x0 >= tw(s.name) + 16) ? x1 : x1 + tw(s.name) + 12; // room for an outside label
        var r = 0;
        while (r < rows.length && rows[r].end + 4 > x0) r++;
        if (r === rows.length) rows.push({ end: -1, items: [] });
        rows[r].end = extent; rows[r].items.push({ s: s, x0: x0, x1: x1 });
      });
      var H = HEAD + rows.length * ROW + 6;
      html += '<section class="lane fam-' + f.id + '" aria-label="' + esc(f.label) + '">' +
        '<h3 class="lane-head"><span class="tag"><i aria-hidden="true"></i>' + esc(f.label) + '</span><small>' + items.length + '</small></h3>' +
        '<svg width="' + W + '" height="' + H + '">';
      grid.forEach(function (gx) { html += '<line class="grid" x1="' + gx + '" x2="' + gx + '" y1="0" y2="' + H + '"/>'; });
      rows.forEach(function (row, ri) {
        var y = HEAD + ri * ROW;
        row.items.forEach(function (it, ii) {
          var s = it.s, bw = it.x1 - it.x0, nxt = row.items[ii + 1];
          var room = (nxt ? nxt.x0 : W) - it.x1 - 6, t = tw(s.name);
          var cls = 'bar' + (s.approx ? ' approx' : '') + (st.sel === s.id ? ' sel' : '');
          var label = '', hit = '';
          var shape = s.end == null
            ? '<path d="M' + it.x0 + ',' + y + 'H' + (it.x1 - 7) + 'L' + it.x1 + ',' + (y + BAR / 2) + 'L' + (it.x1 - 7) + ',' + (y + BAR) + 'H' + it.x0 + 'Z"/>'
            : '<rect x="' + it.x0 + '" y="' + y + '" width="' + bw + '" height="' + BAR + '" rx="3"/>';
          if (bw >= t + 16) {
            label = '<text x="' + (it.x0 + 8) + '" y="' + (y + 16) + '" data-bx="' + it.x0 + '" data-bw="' + bw + '" data-tw="' + t.toFixed(0) + '" class="in">' + esc(s.name) + '</text>';
          } else if (room >= t + 8) {
            label = '<text class="out" x="' + (it.x1 + 6) + '" y="' + (y + 16) + '">' + esc(s.name) + '</text>';
          }
          if (s.approx && bw > 12) {
            shape += s.end == null
              ? '<path class="inset" d="M' + (it.x0 + 2) + ',' + (y + 2) + 'H' + (it.x1 - 8) + 'L' + (it.x1 - 4) + ',' + (y + BAR / 2) + 'L' + (it.x1 - 8) + ',' + (y + BAR - 2) + 'H' + (it.x0 + 2) + 'Z"/>'
              : '<rect class="inset" x="' + (it.x0 + 2) + '" y="' + (y + 2) + '" width="' + (bw - 4) + '" height="' + (BAR - 4) + '" rx="2"/>';
          }
          if (bw < 24) hit = '<rect x="' + (it.x0 + bw / 2 - 12) + '" y="' + y + '" width="24" height="' + BAR + '" fill="transparent"/>';
          html += '<g class="' + cls + '" data-id="' + s.id + '" tabindex="0" role="button" aria-label="' + esc(s.name + ', ' + G.fmtRange(s)) + '">' + hit + shape + label + '</g>';
        });
      });
      html += '</svg></section>';
    });
    html += '<div class="axis-row">' + axisSVG(W, ppy, x) + '</div></div>';
    if (!shown) html = '<p class="empty">No systems match these filters.</p>';
    scroller.innerHTML = html;
    stickyLabels();
    updateView();
    renderDetail();
  }

  // Keep the label of a long bar readable when its left edge has scrolled off.
  function stickyLabels() {
    var left = scroller.scrollLeft;
    G.$$('text.in', scroller).forEach(function (t) {
      var bx = +t.dataset.bx, bw = +t.dataset.bw, w = +t.dataset.tw;
      var x = Math.max(bx + 8, Math.min(left + 8, bx + bw - w - 8));
      t.setAttribute('x', x);
    });
  }
  function updateView() {
    var a = D0 + scroller.scrollLeft / st.ppy, b = a + cw() / st.ppy;
    a = Math.max(D0, Math.round(a)); b = Math.min(D1, Math.round(b));
    viewEl.textContent = 'Viewing ' + G.yr(a) + ' to ' + (b >= D1 ? 'present' : G.yr(b));
    G.$$('[data-era]').forEach(function (btn) {
      var e = ERAS[+btn.dataset.era];
      btn.setAttribute('aria-pressed', String(+btn.dataset.era === st.era));
    });
  }

  /* ---------------------------------------------------------------- detail */
  function renderDetail() {
    var s = byId[st.sel];
    if (!s) {
      detail.innerHTML =
        '<h2>How to read this</h2><div class="key">' +
        '<div><svg width="46" height="18" aria-hidden="true"><rect width="46" height="18" rx="3" fill="var(--ink2)"/></svg>A system that ended</div>' +
        '<div><svg width="46" height="18" aria-hidden="true"><path d="M0,0H39L46,9L39,18H0Z" fill="var(--ink2)"/></svg>Still in existence</div>' +
        '<div><svg width="46" height="18" aria-hidden="true"><rect width="46" height="18" rx="3" fill="var(--ink2)"/><rect class="inset" x="2" y="2" width="42" height="14" rx="2" fill="none" stroke="var(--bg)" stroke-width="1.25" stroke-dasharray="3 2"/></svg>Approximate dates</div></div>' +
        '<p class="sub">Select any bar. The address bar updates, so you can share a link to one system.</p>';
      return;
    }
    var overl = data.filter(function (o) { return o.id !== s.id && G.overlap(s, o) > 0; }).length;
    detail.innerHTML =
      '<button type="button" class="btn close" id="close" aria-label="Close details">Close</button>' +
      G.familyTag(s) + '<h2 id="dh" tabindex="-1">' + esc(s.name) + '</h2>' +
      '<p class="dates">' + G.fmtRange(s) + ' · ' + G.fmtN(G.dur(s)) + ' years' + (s.end == null ? ' so far' : '') + '</p>' +
      '<dl class="facts">' +
      '<div><dt>Where</dt><dd>' + esc(s.region) + '</dd></div>' +
      '<div><dt>How it began</dt><dd>' + esc(s.origin) + '</dd></div>' +
      '<div><dt>' + (s.end == null ? 'Today' : 'How it ended') + '</dt><dd>' + esc(s.ending) + '</dd></div>' +
      '<div><dt>In brief</dt><dd>' + esc(s.summary) + '</dd></div>' +
      G.lineage(s, byId, data) + '</dl>' +
      '<a class="more" href="system.html?id=' + encodeURIComponent(s.id) + '">Open the page: ' + overl + ' systems overlapped it &rarr;</a>';
  }

  function select(id, opts) {
    st.sel = id;
    if (history.replaceState) history.replaceState(null, '', id ? '#' + id : location.pathname + location.search);
    G.$$('.bar', scroller).forEach(function (g) { g.classList.toggle('sel', g.dataset.id === id); });
    renderDetail();
    var s = byId[id];
    if (s && opts && opts.scroll) {
      var cx = (G.DOMAIN[0] * -1 + (s.start + G.endY(s)) / 2) * st.ppy;
      scroller.scrollLeft = Math.max(0, cx - cw() / 2);
    }
    if (s && opts && opts.focus) { var h = $('#dh'); if (h) h.focus({ preventScroll: false }); }
  }

  /* ---------------------------------------------------------------- events */
  function setEra(i) {
    var e = ERAS[i]; st.era = i;
    st.ppy = clampPPY(cw() / (e.b - e.a));
    render();
    scroller.scrollLeft = Math.max(0, (e.a - D0) * st.ppy);
    stickyLabels(); updateView();
  }
  function zoom(f) {
    var mid = D0 + (scroller.scrollLeft + cw() / 2) / st.ppy;
    st.ppy = clampPPY(st.ppy * f); st.era = -1;
    render();
    scroller.scrollLeft = Math.max(0, (mid - D0) * st.ppy - cw() / 2);
    stickyLabels(); updateView();
  }
  $('#eras').addEventListener('click', function (e) { var b = e.target.closest('[data-era]'); if (b) setEra(+b.dataset.era); });
  $('#zin').addEventListener('click', function () { zoom(1.6); });
  $('#zout').addEventListener('click', function () { zoom(1 / 1.6); });
  $('#fams').addEventListener('click', function (e) {
    var b = e.target.closest('[data-fam]'); if (!b) return;
    st.fam[b.dataset.fam] = !st.fam[b.dataset.fam];
    b.setAttribute('aria-pressed', String(st.fam[b.dataset.fam]));
    var left = scroller.scrollLeft; render(); scroller.scrollLeft = left; stickyLabels(); updateView();
  });
  $('#status').addEventListener('change', function (e) { st.status = e.target.value; var l = scroller.scrollLeft; render(); scroller.scrollLeft = l; stickyLabels(); updateView(); });
  var qt;
  $('#q').addEventListener('input', function (e) { clearTimeout(qt); qt = setTimeout(function () { st.q = e.target.value.trim().toLowerCase(); var l = scroller.scrollLeft; render(); scroller.scrollLeft = l; stickyLabels(); updateView(); }, 120); });
  scroller.addEventListener('scroll', function () { stickyLabels(); updateView(); }, { passive: true });
  scroller.addEventListener('click', function (e) { var g = e.target.closest('.bar'); if (g) select(g.dataset.id, { focus: false }); });
  scroller.addEventListener('keydown', function (e) {
    var g = e.target.closest && e.target.closest('.bar');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(g.dataset.id, { focus: true }); }
  });
  detail.addEventListener('click', function (e) { if (e.target.id === 'close') select(null); });
  window.addEventListener('hashchange', function () { var id = location.hash.slice(1); if (byId[id]) select(id, { scroll: true }); });
  var rt, lastW = cw();
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (Math.abs(cw() - lastW) > 40) { lastW = cw(); setEra(st.era < 0 ? 0 : st.era); } }, 150);
  });

  // start: Whole record, or the hash target
  var initial = byId[location.hash.slice(1)] ? location.hash.slice(1) : null;
  st.sel = initial;
  st.ppy = clampPPY(cw() / (D1 - D0)); st.era = 0;
  render();
  if (initial) select(initial, { scroll: true });
});
