/* Landing: the skyline of governance systems with a draggable year marker. */
Gov.boot(null, function (all, G, fig) {
  var $ = G.$, esc = G.esc;
  var withStates = false, data = G.curated(all);
  var svg = $('#sky'), legend = $('#legend'), chips = $('#chips'), head = $('#count-head'), jumps = $('#jumps');
  var year = 1800, sky = null, drag = false;
  var STOPS = [-500, 1, 1000, 1500, 1800, G.DOMAIN[1]];

  function chartHeight() {
    var w = window.innerWidth, vh = window.innerHeight;
    return Math.round(Math.max(190, Math.min(300, vh * 0.3, w < 700 ? 210 : 300)));
  }

  function labelFor(y) { return y === 1 ? '1 CE' : G.yr(y); }

  function draw() {
    sky = G.skyline(svg, data, { height: chartHeight() });
    var x = sky.x(year);
    var top = sky.m.t, bot = sky.m.t + sky.ph;
    svg.insertAdjacentHTML('beforeend',
      '<g class="marker" id="marker" role="slider" tabindex="0" aria-label="Year" ' +
      'aria-valuemin="' + G.DOMAIN[0] + '" aria-valuemax="' + G.DOMAIN[1] + '">' +
      '<rect class="grab" x="-16" y="' + top + '" width="32" height="' + (sky.ph + 22) + '"/>' +
      '<line x1="0" x2="0" y1="' + top + '" y2="' + bot + '"/>' +
      '<g class="pill-g"><rect class="pill" rx="3" height="20" y="' + (bot - 24) + '"/><text y="' + (bot - 10) + '" text-anchor="middle"></text></g></g>');
    place(x);
    update();
  }

  function place(x) {
    var mk = $('#marker');
    mk.setAttribute('transform', 'translate(' + x.toFixed(1) + ',0)');
    var t = mk.querySelector('text'), r = mk.querySelector('.pill');
    t.textContent = labelFor(year);
    var w = Math.max(48, t.textContent.length * 8 + 14);
    // keep the pill inside the plot
    var shift = Math.max(sky.m.l - (x - w / 2), 0) - Math.max((x + w / 2) - (sky.W - 2), 0);
    r.setAttribute('x', (-w / 2 + shift).toFixed(1));
    r.setAttribute('width', w);
    t.setAttribute('x', shift.toFixed(1));
    mk.setAttribute('aria-valuenow', year);
    mk.setAttribute('aria-valuetext', labelFor(year) + ', ' + current().length + ' systems alive');
  }

  function current() { return data.filter(function (s) { return G.alive(s, year); }); }

  function update() {
    var now = current();
    head.innerHTML = 'In <em>' + esc(labelFor(year)) + '</em>: ' + now.length + (now.length === 1 ? ' system' : ' systems') + ' alive';
    legend.innerHTML = G.FAMILIES.map(function (f) {
      var n = now.filter(function (s) { return s.family === f.id; }).length;
      return '<li class="fam-' + f.id + '" data-zero="' + (n === 0) + '"><i class="dot" aria-hidden="true"></i><span class="l-full">' + esc(f.label) + '</span><span class="l-short">' + esc(f.short) + '</span><b>' + n + '</b></li>';
    }).join('');
    chips.innerHTML = now.slice(0, 36).map(function (s) {
      return '<li class="fam-' + s.family + '"><a href="system.html?id=' + encodeURIComponent(s.id) + '">' + esc(s.name) + '</a></li>';
    }).join('') + (now.length > 36 ? '<li class="more-note">and ' + (now.length - 36) + ' more. <a href="systems.html">See the full list</a></li>' : '');
    jumps.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(Number(b.dataset.y) === year));
    });
  }

  function setYear(y, fromKeyboard) {
    year = Math.max(G.DOMAIN[0], Math.min(G.DOMAIN[1], Math.round(y)));
    place(sky.x(year));
    update();
    if (fromKeyboard) $('#marker').focus();
  }

  // jump buttons, plus the computed peak
  var peakY = G.counts(data, 1).peak.year;
  function peakBtn() { var py = G.counts(data, 1).peak.year; var b = $('#peak'); b.dataset.y = py; b.textContent = 'Peak (' + labelFor(py) + ')'; }
  jumps.insertAdjacentHTML('beforeend', STOPS.map(function (y) {
    return '<button type="button" data-y="' + y + '">' + (y === G.DOMAIN[1] ? 'Now' : labelFor(y)) + '</button>';
  }).join('') + '<button type="button" id="peak" data-y="' + peakY + '" title="The year with the most systems alive">Peak (' + labelFor(peakY) + ')</button>');
  var tg = $('#states-toggle');
  tg.textContent = 'Add ' + G.fmtN(G.states(all).length) + ' countries from CountryData';
  tg.addEventListener('click', function () {
    withStates = !withStates;
    data = withStates ? all : G.curated(all);
    tg.setAttribute('aria-pressed', String(withStates));
    tg.textContent = withStates ? 'Showing ' + G.fmtN(all.length) + ' systems and countries' : 'Add ' + G.fmtN(G.states(all).length) + ' countries from CountryData';
    $('#state-note').hidden = !withStates;
    draw(); peakBtn();
  });
  jumps.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b) setYear(Number(b.dataset.y));
  });

  function px(e) {
    var r = svg.getBoundingClientRect();
    return (e.clientX - r.left) * (sky.W / r.width);
  }
  svg.addEventListener('pointerdown', function (e) {
    drag = true;
    svg.setPointerCapture(e.pointerId);
    setYear(sky.yearOf(px(e)));
  });
  svg.addEventListener('pointermove', function (e) { if (drag) setYear(sky.yearOf(px(e))); });
  ['pointerup', 'pointercancel'].forEach(function (t) { svg.addEventListener(t, function () { drag = false; }); });
  svg.addEventListener('keydown', function (e) {
    var k = e.key, d = 0;
    if (k === 'ArrowLeft' || k === 'ArrowDown') d = -10;
    else if (k === 'ArrowRight' || k === 'ArrowUp') d = 10;
    else if (k === 'PageDown') d = -100;
    else if (k === 'PageUp') d = 100;
    else if (k === 'Home') return e.preventDefault(), setYear(G.DOMAIN[0], true);
    else if (k === 'End') return e.preventDefault(), setYear(G.DOMAIN[1], true);
    else return;
    e.preventDefault();
    setYear(year + d, true);
  });

  draw();
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(draw, 80); });
});
