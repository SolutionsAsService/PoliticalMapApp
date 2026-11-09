/* Ages of Rule: shared data helpers, page chrome and the "systems alive" skyline.
   No dependencies. Every printed figure on the site is computed here from data/systems.json. */
(function () {
  'use strict';

  var DOMAIN = [-3200, 2026]; // drawn range; the end is "now" for ongoing systems
  var REPO = 'https://github.com/SolutionsAsService/PoliticalMapApp';

  // Order = stacking order (bottom to top) and legend order. Colours live in site.css as --c-<id>.
  var FAMILIES = [
    { id: 'monarchy', short: 'Monarchy', label: 'Monarchy', blurb: 'Rule by a hereditary king or queen.' },
    { id: 'empire', short: 'Empire', label: 'Empire', blurb: 'One state ruling many peoples by conquest or tribute.' },
    { id: 'republic', short: 'Republic', label: 'Republic & democracy', blurb: 'Power held by citizens or their elected representatives.' },
    { id: 'theocracy', short: 'Theocracy', label: 'Theocracy', blurb: 'Religious and state authority held together.' },
    { id: 'oligarchy', short: 'Oligarchy', label: 'Oligarchy', blurb: 'A small group (nobles, merchants or a dominant minority) holds the power.' },
    { id: 'authoritarian', short: 'One-party', label: 'One-party & dictatorship', blurb: 'A party or a strongman rules without free competition.' },
    { id: 'federal', short: 'Feudal & tribal', label: 'Federal, feudal & tribal', blurb: 'Authority is shared among many lords, cities or nations.' }
  ];
  var famById = {};
  FAMILIES.forEach(function (f) { famById[f.id] = f; });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function fmtN(n) { return Number(n).toLocaleString('en-US'); }

  // Years are signed: negative = BCE. There is no year 0, as in the historical calendar.
  function yr(y) { return y < 0 ? (-y) + ' BCE' : (y < 1000 ? y + ' CE' : String(y)); }
  function endY(s) { return s.end == null ? DOMAIN[1] : s.end; }
  function dur(s) {
    var e = endY(s), d = e - s.start;
    if (s.start < 0 && e > 0) d -= 1; // no year 0
    return d;
  }
  function fmtRange(s) {
    var a = s.start, b = s.end, c = s.approx ? 'c. ' : '';
    if (b == null) return c + yr(a) + '–present';
    var left = a < 0 ? (b < 0 ? String(-a) : (-a) + ' BCE') : (a < 1000 && b >= 1000 ? a + ' CE' : String(a));
    var right = b < 0 ? (-b) + ' BCE' : (b < 1000 ? b + ' CE' : String(b));
    return c + left + '–' + right;
  }
  function alive(s, year) { return s.start <= year && year <= endY(s); }
  function overlap(a, b) {
    var lo = Math.max(a.start, b.start), hi = Math.min(endY(a), endY(b));
    return Math.max(0, hi - lo);
  }

  // Counts of systems alive per family at a regular step. Step 10 keeps the picture honest to the data.
  function counts(data, step) {
    var years = [], y;
    for (y = DOMAIN[0]; y < DOMAIN[1]; y += step) years.push(y);
    years.push(DOMAIN[1]);
    var fam = {}, total = [], peak = { n: 0, year: years[0] };
    FAMILIES.forEach(function (f) { fam[f.id] = []; });
    years.forEach(function (yy, i) {
      var t = 0;
      FAMILIES.forEach(function (f) { fam[f.id][i] = 0; });
      data.forEach(function (s) { if (alive(s, yy)) { fam[s.family][i]++; t++; } });
      total.push(t);
      if (t > peak.n) peak = { n: t, year: yy };
    });
    return { years: years, fam: fam, total: total, peak: peak };
  }

  // Figures printed anywhere on the site: one function, so one place to audit.
  function curated(data) { return data.filter(function (s) { return s.kind !== 'state'; }); }
  function states(data) { return data.filter(function (s) { return s.kind === 'state'; }); }
  function figures(all) {
    var data = curated(all), st = states(all);
    var ongoing = data.filter(function (s) { return s.end == null; }).length;
    var c = counts(data, 1);
    var longest = data.slice().sort(function (a, b) { return dur(b) - dur(a); })[0];
    return {
      count: data.length,
      states: st.length,
      statesNow: st.filter(function (s) { return s.end == null; }).length,
      total: all.length,
      families: FAMILIES.length,
      years: DOMAIN[1] - DOMAIN[0],
      ongoing: ongoing,
      ended: data.length - ongoing,
      approx: data.filter(function (s) { return s.approx; }).length,
      peakN: c.peak.n,
      peakYear: yr(c.peak.year),
      longest: longest.name,
      longestYears: dur(longest)
    };
  }

  /* ------------------------------------------------------------------ chrome */
  var NAV = [
    { id: 'timeline', href: 'timeline.html', label: 'Timeline' },
    { id: 'systems', href: 'systems.html', label: 'All systems' },
    { id: 'about', href: 'about.html', label: 'About the data' }
  ];
  function chrome(active) {
    var h = document.createElement('header');
    h.className = 'site';
    h.innerHTML =
      '<a class="skip" href="#main">Skip to content</a>' +
      '<div class="wrap topbar">' +
      '<a class="brand" href="index.html" aria-label="Ages of Rule, home">' +
      '<svg class="mark" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
      '<rect x="1" y="3" width="14" height="4" rx="1" fill="var(--c-empire)"/>' +
      '<rect x="6" y="10" width="17" height="4" rx="1" fill="var(--c-republic)"/>' +
      '<rect x="3" y="17" width="9" height="4" rx="1" fill="var(--c-monarchy)"/></svg>' +
      '<span>Ages of Rule</span></a>' +
      '<nav aria-label="Main">' +
      NAV.map(function (n) {
        return '<a href="' + n.href + '"' + (n.id === active ? ' aria-current="page"' : '') + '>' + n.label + '</a>';
      }).join('') +
      '</nav></div>';
    document.body.insertBefore(h, document.body.firstChild);
    var f = document.createElement('footer');
    f.className = 'site';
    f.innerHTML =
      '<div class="wrap">' +
      '<p>Dates are conventional markers, rounded where scholars disagree; dashed bars are approximate. ' +
      '<a href="about.html">How the data was built</a>.</p>' +
      '<p><a href="' + REPO + '/issues">Report a wrong fact</a> · <a href="data/systems.json">Raw data (JSON)</a> · ' +
      '<a href="' + REPO + '">Source</a> · MIT licence</p></div>';
    document.body.appendChild(f);
  }

  function load() {
    function get(path) {
      return fetch(new URL(path, document.baseURI)).then(function (r) {
        if (!r.ok) throw new Error(path + ': HTTP ' + r.status);
        return r.json();
      });
    }
    return Promise.all([get('data/systems.json'), get('data/countries.json')]).then(function (both) {
      var all = both[0].map(function (s) { s.kind = 'system'; return s; }).concat(both[1]);
      all.sort(function (a, b) { return a.start - b.start || endY(a) - endY(b); });
      return all;
    });
  }

  // boot(activeNav, fn): inject chrome, load data, fill [data-fig] spans, run fn(data, G).
  function boot(active, fn) {
    chrome(active);
    var main = $('#main');
    load().then(function (data) {
      var fig = figures(data);
      $$('[data-fig]').forEach(function (el) {
        var v = fig[el.getAttribute('data-fig')];
        el.textContent = typeof v === 'number' ? fmtN(v) : v;
      });
      fn(data, G, fig);
    }).catch(function (err) {
      console.error(err);
      if (main) main.insertAdjacentHTML('afterbegin',
        '<p class="notice" role="alert">The data could not be loaded (' + esc(err.message) +
        '). If you opened this file directly, serve the folder instead, for example with <code>npx serve .</code>.</p>');
    });
  }

  /* ------------------------------------------------------------------ shared detail markup */
  function link(s) { return '<a href="system.html?id=' + encodeURIComponent(s.id) + '">' + esc(s.name) + '</a>'; }
  function familyTag(s) {
    return '<span class="tag fam-' + s.family + '"><i aria-hidden="true"></i>' + esc(famById[s.family].label) + '</span>';
  }
  function lineage(s, byId, data) {
    var prev = data.filter(function (o) { return (o.next || []).indexOf(s.id) >= 0; });
    var next = (s.next || []).map(function (id) { return byId[id]; }).filter(Boolean);
    var out = '';
    if (prev.length) out += '<div><dt>Came from</dt><dd>' + prev.map(link).join(', ') + '</dd></div>';
    if (next.length) out += '<div><dt>Became</dt><dd>' + next.map(link).join(', ') + '</dd></div>';
    return out;
  }

  /* ------------------------------------------------------------------ skyline
     Stacked, stepped areas of "how many systems were alive in each year", by family.
     opts: { height, mute (single grey area, no families), band {a,b,family}, axis (bool) } */
  function skyline(svg, data, opts) {
    opts = opts || {};
    var W = Math.max(280, Math.round(svg.parentNode.clientWidth));
    var H = opts.height || 280;
    var m = { l: 30, r: 10, t: 10, b: 26 };
    var pw = W - m.l - m.r, ph = H - m.t - m.b;
    var c = counts(data, 10);
    var gstep = c.peak.n <= 25 ? 5 : c.peak.n <= 60 ? 10 : c.peak.n <= 150 ? 25 : 50;
    var maxN = Math.max(5, Math.ceil(c.peak.n / gstep) * gstep);
    function x(y) { return m.l + (y - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0]) * pw; }
    function yOf(n) { return m.t + ph - n / maxN * ph; }
    function yearOf(px) {
      var y = DOMAIN[0] + (px - m.l) / pw * (DOMAIN[1] - DOMAIN[0]);
      return Math.max(DOMAIN[0], Math.min(DOMAIN[1], Math.round(y)));
    }
    function step(vals) {
      var pts = [], i;
      for (i = 0; i < c.years.length - 1; i++) {
        pts.push([x(c.years[i]), yOf(vals[i])], [x(c.years[i + 1]), yOf(vals[i])]);
      }
      return pts;
    }
    function area(top, bottom) {
      var t = step(top), b = step(bottom).reverse();
      return 'M' + t.concat(b).map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('L') + 'Z';
    }
    var h = '<title>Number of governance systems alive in each year, by family</title>';
    // gridlines
    var g, tickYears = pw < 520 ? [-3000, -1000, 1, 1000, 2000] : [-3000, -2000, -1000, 1, 1000, 2000];
    for (g = 0; g <= maxN; g += gstep) {
      h += '<line class="grid" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + yOf(g).toFixed(1) + '" y2="' + yOf(g).toFixed(1) + '"/>';
      if (!opts.mute || g === 0 || g === maxN) h += '<text class="ytick" x="' + (m.l - 6) + '" y="' + (yOf(g) + 4).toFixed(1) + '" text-anchor="end">' + g + '</text>';
    }
    if (opts.band) {
      var a = x(opts.band.a), b = x(opts.band.b);
      h += '<rect class="band fam-' + opts.band.family + '" x="' + a.toFixed(1) + '" y="' + m.t + '" width="' + Math.max(2, b - a).toFixed(1) + '" height="' + ph + '"/>';
    }
    if (opts.mute) {
      h += '<path class="area mute" d="' + area(c.total, c.total.map(function () { return 0; })) + '"/>';
    } else {
      var base = c.total.map(function () { return 0; });
      FAMILIES.forEach(function (f) {
        var top = base.map(function (v, i) { return v + c.fam[f.id][i]; });
        h += '<path class="area fam-' + f.id + '" d="' + area(top, base) + '"/>';
        base = top;
      });
    }
    // axis
    h += '<line class="axis" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + (m.t + ph) + '" y2="' + (m.t + ph) + '"/>';
    tickYears.forEach(function (ty) {
      var tx = x(ty), lab = ty === 1 ? '1 CE' : yr(ty);
      var anchor = ty === -3000 ? 'start' : (ty === 2000 ? 'end' : 'middle');
      h += '<line class="axis" x1="' + tx.toFixed(1) + '" x2="' + tx.toFixed(1) + '" y1="' + (m.t + ph) + '" y2="' + (m.t + ph + 4) + '"/>' +
        '<text class="xtick" x="' + (anchor === 'start' ? tx - 4 : (anchor === 'end' ? tx + 6 : tx)).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + anchor + '">' + lab + '</text>';
    });
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.innerHTML = h;
    return { x: x, yOf: yOf, yearOf: yearOf, W: W, H: H, m: m, ph: ph, counts: c, maxN: maxN };
  }

  var G = {
    DOMAIN: DOMAIN, FAMILIES: FAMILIES, famById: famById, REPO: REPO,
    esc: esc, $: $, $$: $$, fmtN: fmtN, yr: yr, endY: endY, dur: dur, fmtRange: fmtRange,
    alive: alive, overlap: overlap, curated: curated, states: states, counts: counts, figures: figures,
    link: link, familyTag: familyTag, lineage: lineage, skyline: skyline, boot: boot, load: load
  };
  window.Gov = G;
})();
