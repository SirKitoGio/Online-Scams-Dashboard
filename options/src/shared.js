/* Chart + data helpers shared by the three options. All figures come from data.js (generated from the CSV). */
(function () {
  const rows = window.SCAM_ROWS;
  const by = Object.fromEntries(rows.map(r => [r.observation_id, r]));
  const V = id => { if (!by[id]) throw new Error('Unknown id ' + id); return Number(by[id].numeric_value); };
  const fmt = n => Math.round(n).toLocaleString('en-PH');
  const pct = (from, to, d = 1) => { const p = (to / from - 1) * 100; return (p >= 0 ? '+' : '−') + Math.abs(p).toFixed(d) + '%'; };
  const peso = (n, d = 1) => '₱' + (n / 1e6).toFixed(d) + 'M';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const named = ['gcash', 'bpi', 'gotyme', 'maya'].reduce((s, k) => s + V(`cicc.losses.${k}.2024`), 0);
  const pnp = ['onlineselling', 'investment', 'hijacked', 'vishing'];
  const D = {
    mult: V('cicc.complaints.2025') / V('cicc.complaints.2023'),
    fraud: V('cicc.consumerfraud.2025') + V('cicc.onlinefraud.2025'),
    fraudShare: (V('cicc.consumerfraud.2025') + V('cicc.onlinefraud.2025')) / V('cicc.complaints.2025') * 100,
    unattributed: V('cicc.losses.2024') - named,
    pnp24: pnp.reduce((s, k) => s + V(`pnp.${k}.2024`), 0),
    pnp25: pnp.reduce((s, k) => s + V(`pnp.${k}.2025`), 0),
    strictRate: V('bsp.mediation.successful.2025') / V('bsp.mediation.completed.2025') * 100,
  };

  /* Re-renders on width change; animates on first paint only. */
  function mount(el, draw) {
    if (el._ro) el._ro.disconnect();
    let last = 0;
    const paint = first => {
      const w = el.clientWidth; if (!w || w === last) return; last = w;
      el.innerHTML = draw(w); el.classList.toggle('vz-anim', !!first);
    };
    paint(true);
    el._ro = new ResizeObserver(() => paint(false)); el._ro.observe(el);
  }

  const barPath = (x, y, w, h, r = 4) => {
    w = Math.max(w, 1); r = Math.min(r, w, h / 2);
    return `M${x} ${y}h${w - r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${r - w}z`;
  };
  const colPath = (x, y, w, h, r = 4) => {
    h = Math.max(h, 1); r = Math.min(r, h, w / 2);
    return `M${x} ${y + h}v${r - h}a${r} ${r} 0 0 1 ${r} ${-r}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - r}z`;
  };

  /* rows: {label, value, text, hi, tip} */
  function hbars(el, o) {
    const rowH = o.rowH || 34, barH = o.barH || 16, H = o.rows.length * rowH;
    const max = o.max || Math.max(...o.rows.map(r => r.value));
    mount(el, w => {
      const lw = o.labelW || Math.min(150, w * .36), vw = o.valueW || 86, pw = Math.max(40, w - lw - vw - 8);
      const g = o.rows.map((r, i) => {
        const y = i * rowH, by = y + (rowH - barH) / 2, bw = r.value / max * pw;
        return `<g data-tip="${esc(r.tip || r.label + ': ' + r.text)}"><rect x="0" y="${y}" width="${w}" height="${rowH}" fill="transparent"/>
          <text class="vz-l${r.hi ? ' vz-strong' : ''}" x="${lw - 10}" y="${y + rowH / 2}" text-anchor="end" dominant-baseline="central">${esc(r.label)}</text>
          <path class="vz-gx" style="--d:${i * 60}ms;fill:${r.hi ? 'var(--mark-hi)' : 'var(--mark)'}" d="${barPath(lw, by, bw, barH)}"/>
          <text class="vz-v${r.hi ? ' vz-strong' : ''}" x="${lw + bw + 8}" y="${y + rowH / 2}" dominant-baseline="central">${esc(r.text)}</text></g>`;
      }).join('');
      return `<svg role="img" aria-label="${esc(o.alt)}" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}">${g}</svg>`;
    });
  }

  /* rows: {label, value, text, hi} */
  function columns(el, o) {
    const H = o.h || 200, top = 28, bot = 26, ph = H - top - bot, bm = o.barMax || 44;
    const max = Math.max(...o.rows.map(r => r.value));
    mount(el, w => {
      const band = w / o.rows.length, bw = Math.min(bm, band * .55);
      const g = o.rows.map((r, i) => {
        const h = r.value / max * ph, x = band * i + (band - bw) / 2, y = top + ph - h;
        return `<g data-tip="${esc(r.label + ': ' + r.text)}"><rect x="${band * i}" y="0" width="${band}" height="${H}" fill="transparent"/>
          <path class="vz-gy" style="--d:${i * 90}ms;fill:${r.hi ? 'var(--mark-hi)' : 'var(--mark)'}" d="${colPath(x, y, bw, h)}"/>
          <text class="vz-v${r.hi ? ' vz-strong' : ''}" x="${x + bw / 2}" y="${y - 8}" text-anchor="middle">${esc(r.text)}</text>
          <text class="vz-l" x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${esc(r.label)}</text></g>`;
      }).join('');
      return `<svg role="img" aria-label="${esc(o.alt)}" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}"><line class="vz-axis" x1="0" x2="${w}" y1="${top + ph + .5}" y2="${top + ph + .5}"/>${g}</svg>`;
    });
  }

  /* rows: {label, a, b, text}: a = earlier value, b = later value */
  function dumbbell(el, o) {
    const rowH = o.rowH || 38, head = 26, H = o.rows.length * rowH + head;
    const max = Math.max(...o.rows.map(r => Math.max(r.a, r.b)));
    mount(el, w => {
      const lw = o.labelW || Math.min(150, w * .34), vw = o.valueW || 118, pw = Math.max(60, w - lw - vw - 16);
      const g = o.rows.map((r, i) => {
        const y = head + i * rowH + rowH / 2, xa = lw + r.a / max * pw, xb = lw + r.b / max * pw;
        return `<g data-tip="${esc(`${r.label}: ${fmt(r.a)} → ${fmt(r.b)} (${r.text})`)}"><rect x="0" y="${y - rowH / 2}" width="${w}" height="${rowH}" fill="transparent"/>
          <text class="vz-l" x="${lw - 12}" y="${y}" text-anchor="end" dominant-baseline="central">${esc(r.label)}</text>
          <line class="vz-conn" x1="${xa}" x2="${xb}" y1="${y}" y2="${y}"/>
          <circle cx="${xa}" cy="${y}" r="5" style="fill:var(--mark)" class="vz-dot"/>
          <circle cx="${xb}" cy="${y}" r="6" style="fill:var(--mark-hi)" class="vz-dot"/>
          <text class="vz-v vz-strong" x="${w}" y="${y}" text-anchor="end" dominant-baseline="central">${esc(r.text)}</text></g>`;
      }).join('');
      const legend = `<g class="vz-l"><circle cx="${lw + 5}" cy="9" r="5" style="fill:var(--mark)"/><text x="${lw + 16}" y="9" dominant-baseline="central">${esc(o.aName)}</text>
        <circle cx="${lw + 76}" cy="9" r="6" style="fill:var(--mark-hi)"/><text x="${lw + 88}" y="9" dominant-baseline="central">${esc(o.bName)}</text></g>`;
      return `<svg role="img" aria-label="${esc(o.alt)}" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}">${legend}${g}</svg>`;
    });
  }

  /* series: {name, change, value (index), color}: one axis, indexed to 2024 = 100 */
  function slope(el, o) {
    const H = o.h || 300, top = 16, bot = 28, ph = H - top - bot;
    const Y = v => top + ph - v / 200 * ph;
    mount(el, w => {
      const x1 = 12, rw = Math.min(o.rightW || 190, w * .68), x2 = w - rw - 14;
      const g = o.series.map(s => `<g data-tip="${esc(`${s.name}: ${s.change} (2024 = 100, now ${Math.round(s.value)})`)}">
          <line class="vz-slope" style="stroke:${s.color}" x1="${x1}" x2="${x2}" y1="${Y(100)}" y2="${Y(s.value)}" pathLength="1"/>
          <circle class="vz-dot" cx="${x2}" cy="${Y(s.value)}" r="6" style="fill:${s.color}"/>
          <text x="${x2 + 14}" y="${Y(s.value)}" dominant-baseline="central"><tspan class="vz-big">${esc(s.change)}</tspan><tspan class="vz-l" dx="7">${esc(s.name)}</tspan></text></g>`).join('');
      return `<svg role="img" aria-label="${esc(o.alt)}" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}">
        <line class="vz-axis" x1="${x1}" x2="${x2}" y1="${Y(100)}" y2="${Y(100)}"/>
        <circle class="vz-dot" cx="${x1}" cy="${Y(100)}" r="5" style="fill:var(--muted)"/>
        ${g}
        <text class="vz-l" x="${x1 - 4}" y="${H - 6}">2024</text><text class="vz-l" x="${x2}" y="${H - 6}" text-anchor="middle">2025</text></svg>`;
    });
  }

  /* segs: {label, value, color} */
  function stack(el, o) {
    const total = o.segs.reduce((s, x) => s + x.value, 0);
    el.innerHTML = `<div class="vz-stack" role="img" aria-label="${esc(o.alt)}" style="height:${o.h || 26}px">${o.segs.map((s, i) => `<i data-tip="${esc(`${s.label}: ${fmt(s.value)} of ${fmt(total)}`)}" style="flex:${s.value} 1 0;background:${s.color};--d:${i * 80}ms"></i>`).join('')}</div>
      <ul class="vz-legend">${o.segs.map(s => `<li><i style="background:${s.color}"></i><b>${fmt(s.value)}</b> ${esc(s.label)}</li>`).join('')}</ul>`;
    el.classList.add('vz-anim');
  }

  function ledger(el) {
    el.innerHTML = `<div class="vz-tablewrap"><table class="vz-table"><thead><tr><th>Measure</th><th>Value</th><th>Period</th><th>Source</th></tr></thead><tbody>${rows.map(r =>
      `<tr><td>${esc(r.measure)}${r.category ? ` <span>· ${esc(r.category)}</span>` : ''}${r.methodology_notes ? `<small>${esc(r.methodology_notes)}</small>` : ''}</td><td class="nowrap">${r.value_qualifier === 'lower-bound' ? '≥ ' : r.value_qualifier === 'approximate' ? '~' : ''}${Number(r.numeric_value).toLocaleString('en-PH')} ${esc(r.unit)}</td><td class="nowrap">${esc(r.period)}</td><td><a href="${esc(r.source_url)}" target="_blank" rel="noopener">${esc(r.source_name)}</a></td></tr>`).join('')}</tbody></table></div>`;
  }

  function exportCSV() {
    const cols = Object.keys(rows[0]);
    const q = v => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [cols.map(q).join(','), ...rows.map(r => cols.map(c => q(r[c])).join(','))].join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })), download: 'ph-online-scams-indicators.csv' });
    a.click(); URL.revokeObjectURL(a.href);
  }

  /* Tooltip enhances direct labels; it never holds the only copy of a value. */
  const tip = document.createElement('div'); tip.className = 'vz-tip'; tip.hidden = true;
  addEventListener('DOMContentLoaded', () => document.body.append(tip));
  addEventListener('mousemove', e => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) { tip.hidden = true; return; }
    tip.textContent = t.dataset.tip; tip.hidden = false;
    tip.style.left = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8) + 'px';
    tip.style.top = (e.clientY + 16) + 'px';
  });

  /* Chart specs shared by all options so numbers and framing never diverge. */
  const charts = {
    surge: (el, o = {}) => columns(el, { alt: 'CICC complaints: 3,317 in 2023, 10,004 in 2024, 18,633 in 2025', ...o,
      rows: [2023, 2024, 2025].map(y => ({ label: String(y), value: V('cicc.complaints.' + y), text: fmt(V('cicc.complaints.' + y)), hi: y === 2025 })) }),
    fraud: (el, o = {}) => hbars(el, { alt: 'CICC 2025 complaints by category, led by consumer fraud and online fraud', ...o, rows: [
      ['Consumer fraud', 'cicc.consumerfraud.2025', 1], ['Online fraud', 'cicc.onlinefraud.2025', 1], ['Other', 'cicc.othercategories.2025', 0],
      ['Harassment', 'cicc.harassment.2025', 0], ['Identity theft', 'cicc.identitytheft.2025', 0],
    ].map(([label, id, hi]) => ({ label, value: V(id), text: fmt(V(id)), hi: !!hi })) }),
    money: (el, o = {}) => hbars(el, { alt: '2024 reported losses by channel, led by GCash at 76.5 million pesos', ...o, rows: [
      { label: 'GCash', value: V('cicc.losses.gcash.2024'), hi: true }, { label: 'Not named', value: D.unattributed },
      { label: 'BPI', value: V('cicc.losses.bpi.2024') }, { label: 'GoTyme', value: V('cicc.losses.gotyme.2024') }, { label: 'Maya', value: V('cicc.losses.maya.2024') },
    ].map(r => ({ ...r, text: peso(r.value) })) }),
    police: (el, o = {}) => dumbbell(el, { alt: 'PNP-ACG recorded incidents fell in all four scam types between 2024 and 2025', aName: '2024', bName: '2025', ...o, rows: [
      ['Online selling', 'onlineselling'], ['Investment / task', 'investment'], ['Hijacked profile', 'hijacked'], ['Vishing', 'vishing'],
    ].map(([label, k]) => ({ label, a: V(`pnp.${k}.2024`), b: V(`pnp.${k}.2025`), text: pct(V(`pnp.${k}.2024`), V(`pnp.${k}.2025`), 0) })) }),
    mediation: (el, c, o = {}) => stack(el, { alt: '2025 mediation caseload of 1,188: 409 successful, 144 failed, 323 terminated, 312 open', ...o, segs: [
      { label: 'successful', value: V('bsp.mediation.successful.2025'), color: c[0] }, { label: 'failed', value: V('bsp.mediation.failed.2025'), color: c[1] },
      { label: 'terminated', value: V('bsp.mediation.terminated.2025'), color: c[2] }, { label: 'open', value: V('bsp.mediation.open.2025'), color: c[3] } ] }),
    adjudication: (el, c, o = {}) => stack(el, { alt: '2025 adjudication caseload of 68: 11 decided, 20 dismissed, 37 pending', ...o, segs: [
      { label: 'decided', value: V('bsp.adjudication.decided.2025'), color: c[0] }, { label: 'dismissed', value: V('bsp.adjudication.dismissed.2025'), color: c[2] },
      { label: 'pending', value: V('bsp.adjudication.pending.2025'), color: c[1] } ] }),
    gap: (el, colors, o = {}) => slope(el, { alt: 'Indexed to 2024: CICC complaints up 86 percent, BSP complaints up 73 percent, police records down 61 percent', ...o, series: [
      { name: 'CICC complaints', change: '+' + V('cicc.complaints.growth.2025').toFixed(0) + '%', value: 100 + V('cicc.complaints.growth.2025'), color: colors[0] },
      { name: 'BSP complaints', change: '+' + V('bsp.complaints.growth.2025').toFixed(0) + '%', value: 100 + V('bsp.complaints.growth.2025'), color: colors[1] },
      { name: 'Police records, 4 types', change: pct(D.pnp24, D.pnp25, 0), value: D.pnp25 / D.pnp24 * 100, color: colors[2] } ] }),
  };

  /* Runs fn now, when fonts settle, and after any window resize. */
  function responsive(fn) {
    let timer; fn();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fn);
    addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(fn, 120); });
  }

  window.SCAM = { responsive, V, D, fmt, pct, peso, charts, hbars, ledger, exportCSV, mount };
})();
