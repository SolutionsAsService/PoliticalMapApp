Gov.boot('systems', function (data, G) {
  var $ = G.$, esc = G.esc, st = { kind: 'system', q: '', fam: '', status: 'all', key: 'start', dir: 1 };
  $('#fam').insertAdjacentHTML('beforeend', G.FAMILIES.map(function (f) { return '<option value="' + f.id + '">' + esc(f.label) + '</option>'; }).join(''));
  function val(s, k) {
    return k === 'dur' ? G.dur(s) : k === 'end' ? G.endY(s) : k === 'name' ? s.name.toLowerCase() : k === 'family' ? G.famById[s.family].label : k === 'region' ? s.region : s.start;
  }
  function render() {
    var rows = data.filter(function (s) {
      if (st.kind !== 'all' && s.kind !== st.kind) return false;
      if (st.fam && s.family !== st.fam) return false;
      if (st.status === 'ended' && s.end == null) return false;
      if (st.status === 'ongoing' && s.end != null) return false;
      return !st.q || (s.name + ' ' + s.region).toLowerCase().indexOf(st.q) >= 0;
    });
    rows.sort(function (a, b) { var x = val(a, st.key), y = val(b, st.key); return (x < y ? -1 : x > y ? 1 : 0) * st.dir; });
    $('#count').textContent = rows.length + ' of ' + data.length + ' systems';
    $('#rows').innerHTML = rows.map(function (s) {
      var a = (s.approx ? 'c. ' : '');
      return '<tr class="fam-' + s.family + '"><td>' + G.link(s) + '</td><td>' + G.familyTag(s) + '</td>' +
        '<td class="num">' + a + G.yr(s.start) + '</td><td class="num">' + (s.end == null ? 'present' : a + G.yr(s.end)) + '</td>' +
        '<td class="num">' + G.fmtN(G.dur(s)) + ' yrs</td><td>' + esc(s.region) + '</td></tr>';
    }).join('');
    G.$$('th').forEach(function (th) {
      var b = th.querySelector('button');
      th.setAttribute('aria-sort', b.dataset.k === st.key ? (st.dir > 0 ? 'ascending' : 'descending') : 'none');
    });
  }
  G.$$('th button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (st.key === b.dataset.k) st.dir = -st.dir; else { st.key = b.dataset.k; st.dir = 1; }
      render();
    });
  });
  $('#q').addEventListener('input', function (e) { st.q = e.target.value.trim().toLowerCase(); render(); });
  $('#kind').addEventListener('change', function (e) { st.kind = e.target.value; render(); });
  $('#fam').addEventListener('change', function (e) { st.fam = e.target.value; render(); });
  $('#status').addEventListener('change', function (e) { st.status = e.target.value; render(); });
  render();
});
