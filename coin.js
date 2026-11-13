/* coin.js - public coin detail page. Usage: coin.html?id=bitcoin (any CoinGecko coin id) */
async function coinPage() {
  nav('market');
  const id = new URLSearchParams(location.search).get('id') || 'bitcoin';
  const page = $('#coin');
  let d;
  try {
    const r = await fetch(`${API}/coins/${encodeURIComponent(id)}?localization=false&tickers=false&community_data=false&developer_data=false`);
    if (!r.ok) throw 0;
    d = await r.json();
  } catch (e) {
    page.innerHTML = '<p class="py-20 text-center text-slate-500">Could not load this coin. The data provider may be busy, so try again in a minute. <a class="text-brand font-semibold" href="market.html">Back to market</a></p>';
    return;
  }
  const m = d.market_data, sym = d.symbol.toUpperCase();
  let P = m.current_price.usd, W = [];
  document.title = `${d.name} (${sym}) Price - Ledgerly`;
  if (user()) { try { W = await db.watch(); } catch (e) {} }

  const row = (k, v) => `<div class="flex justify-between gap-4 py-3 border-t text-sm"><span class="text-slate-500">${k}</span><span class="font-semibold text-right">${v}</span></div>`;
  const pill = (u, t) => u && /^https?:/.test(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer" class="border rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-slate-50">${t}</a>` : '';
  const L = d.links || {};
  const links = [pill(L.homepage?.[0], 'Website'), ...(L.blockchain_site || []).slice(0, 2).map(u => pill(u, 'Explorer')), pill(L.subreddit_url, 'Reddit'),
    L.twitter_screen_name ? pill('https://x.com/' + encodeURIComponent(L.twitter_screen_name), 'X / Twitter') : '', pill(L.repos_url?.github?.[0], 'GitHub')].join('');
  const about = (d.description?.en || '').replace(/<[^>]+>/g, '').trim();
  const periods = [['1h', m.price_change_percentage_1h_in_currency?.usd], ['24h', m.price_change_percentage_24h], ['7d', m.price_change_percentage_7d],
    ['30d', m.price_change_percentage_30d], ['1y', m.price_change_percentage_1y]];
  const bar = () => Math.min(100, Math.max(0, (P - m.low_24h.usd) / ((m.high_24h.usd - m.low_24h.usd) || 1) * 100));
  const starCls = () => 'text-2xl ' + (W.includes(id) ? 'text-yellow-400' : 'text-slate-300');
  const tag = t => `<span class="bg-slate-100 rounded px-2 py-0.5 text-xs font-semibold text-slate-600">${t}</span>`;

  page.innerHTML = `
    <nav class="text-sm text-slate-500 mb-4"><a class="hover:text-brand" href="market.html">Cryptocurrencies</a> / <span class="text-ink">${esc(d.name)}</span></nav>
    <div class="flex flex-wrap items-center gap-3 mb-2">
      <img src="${esc(d.image?.large || '')}" alt="" class="w-9 h-9 rounded-full"><h1 class="text-2xl font-bold">${esc(d.name)}</h1>${tag(esc(sym))}${tag('Rank #' + (d.market_cap_rank ?? '-'))}
      <button id="star" aria-label="Add to watchlist" class="${starCls()}">&#9733;</button>
    </div>
    <div class="flex flex-wrap items-end gap-3">
      <p id="price" class="text-4xl font-extrabold">${usd(P)}</p><p id="chg" class="text-lg font-semibold pb-1">${chg(m.price_change_percentage_24h)}</p>
    </div>
    <div class="grid lg:grid-cols-3 gap-6 mt-6">
      <aside class="space-y-6">
        <div class="border rounded-xl p-5">
          <h2 class="font-bold mb-3">${esc(d.name)} statistics</h2>
          <div class="text-xs text-slate-500 flex justify-between"><span>24h Low ${usd(m.low_24h.usd)}</span><span>24h High ${usd(m.high_24h.usd)}</span></div>
          <div class="relative h-1.5 bg-slate-200 rounded my-2"><div id="mark" class="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 rounded-full bg-brand" style="left:${bar()}%"></div></div>
          ${row('Market cap', big(m.market_cap.usd))}
          ${row('Fully diluted valuation', big(m.fully_diluted_valuation?.usd))}
          ${row('Volume (24h)', big(m.total_volume.usd))}
          ${row('Volume / Market cap', m.market_cap.usd ? (m.total_volume.usd / m.market_cap.usd).toFixed(4) : '-')}
          ${row('Circulating supply', `${num(m.circulating_supply)} ${esc(sym)}`)}
          ${row('Total supply', m.total_supply ? `${num(m.total_supply)} ${esc(sym)}` : '&infin;')}
          ${row('Max supply', m.max_supply ? `${num(m.max_supply)} ${esc(sym)}` : '&infin;')}
          ${row('All-time high', `${usd(m.ath.usd)} ${chg(m.ath_change_percentage.usd)}<br><span class="text-xs text-slate-400 font-normal">${new Date(m.ath_date.usd).toLocaleDateString()}</span>`)}
          ${row('All-time low', `${usd(m.atl.usd)} ${chg(m.atl_change_percentage.usd)}<br><span class="text-xs text-slate-400 font-normal">${new Date(m.atl_date.usd).toLocaleDateString()}</span>`)}
        </div>
        <div class="border rounded-xl p-5">
          <h2 class="font-bold mb-1">Price performance</h2>
          ${periods.map(([k, v]) => row(k, chg(v))).join('')}
        </div>
        ${links ? `<div class="border rounded-xl p-5"><h2 class="font-bold mb-3">Links</h2><div class="flex flex-wrap gap-2">${links}</div></div>` : ''}
      </aside>

      <section class="lg:col-span-2 space-y-6">
        <div class="border rounded-xl p-5">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="font-bold">${esc(d.name)} price chart (USD)</h2>
            <div class="flex bg-slate-100 rounded-lg p-1 gap-1">${[['1D', 1], ['7D', 7], ['1M', 30], ['3M', 90], ['1Y', 365]].map(([l, v]) => `<button data-range="${v}">${l}</button>`).join('')}</div>
          </div>
          <div id="chart" class="relative"></div>
        </div>

        <div class="border rounded-xl p-5">
          <h2 class="font-bold mb-3">${esc(sym)} to USD converter</h2>
          <div class="flex flex-wrap items-center gap-3">
            <input id="cv-coin" type="number" min="0" step="any" value="1" aria-label="${esc(sym)} amount" class="border rounded-lg px-3 py-2.5 w-40"> <span class="font-semibold">${esc(sym)}</span>
            <span class="text-slate-400">=</span>
            <input id="cv-usd" type="number" min="0" step="any" value="${+P.toPrecision(8)}" aria-label="USD amount" class="border rounded-lg px-3 py-2.5 w-40"> <span class="font-semibold">USD</span>
          </div>
        </div>

        ${about ? `<div class="border rounded-xl p-5"><h2 class="font-bold mb-3">About ${esc(d.name)}</h2>
          <p id="about" class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">${esc(about.slice(0, 900))}${about.length > 900 ? '...' : ''}</p>
          ${about.length > 900 ? '<button id="more" class="text-brand font-semibold text-sm mt-2">Read more</button>' : ''}</div>` : ''}
      </section>
    </div>`;

  // Watchlist star (login needed)
  $('#star').onclick = async () => {
    if (!user()) return location.href = 'login.html';
    const has = W.includes(id);
    try { await db.toggleWatch(id, has); W = has ? W.filter(x => x !== id) : [...W, id]; $('#star').className = starCls(); } catch (x) { alert(x); }
  };
  if ($('#more')) $('#more').onclick = e => { $('#about').textContent = about; e.target.remove(); };

  // Converter
  $('#cv-coin').oninput = e => { $('#cv-usd').value = e.target.value ? +(e.target.value * P).toPrecision(8) : ''; };
  $('#cv-usd').oninput = e => { $('#cv-coin').value = e.target.value ? +(e.target.value / P).toPrecision(8) : ''; };

  // Price chart (SVG, no library)
  const cache = {};
  let days = 1;
  const drawChart = pts => {
    const w = 800, h = 300, pad = 8, ys = pts.map(p => p[1]);
    const x0 = pts[0][0], x1 = pts[pts.length - 1][0], mn = Math.min(...ys), mx = Math.max(...ys);
    const X = t => (t - x0) / (x1 - x0 || 1) * w, Y = v => h - pad - (v - mn) / (mx - mn || 1) * (h - 2 * pad);
    const col = ys[ys.length - 1] >= ys[0] ? '#16c784' : '#ea3943';
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('');
    const c = $('#chart');
    c.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="w-full h-72 touch-none" role="img" aria-label="Price chart">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".25"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
      <path d="${line}L${w},${h}L0,${h}Z" fill="url(#g)"/><path d="${line}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/>
      <line id="vl" y1="0" y2="${h}" stroke="#94a3b8" stroke-dasharray="4" vector-effect="non-scaling-stroke" style="display:none"/></svg>
      <div id="tip" class="absolute top-1 pointer-events-none bg-ink text-white text-xs rounded px-2 py-1 whitespace-nowrap" hidden></div>`;
    c.onpointermove = e => {
      const r = c.getBoundingClientRect(), f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), p = pts[Math.round(f * (pts.length - 1))];
      const vl = $('#vl'); vl.setAttribute('x1', X(p[0])); vl.setAttribute('x2', X(p[0])); vl.style.display = '';
      const tip = $('#tip'); tip.hidden = false;
      tip.textContent = `${new Date(p[0]).toLocaleString([], { dateStyle: 'medium', timeStyle: days <= 7 ? 'short' : undefined })}  |  ${usd(p[1])}`;
      tip.style.left = Math.min(Math.max(0, r.width - 190), Math.max(0, f * r.width - 90)) + 'px';
    };
    c.onpointerleave = () => { $('#vl').style.display = 'none'; $('#tip').hidden = true; };
  };
  const showChart = async n => {
    days = n;
    document.querySelectorAll('[data-range]').forEach(b => b.className = 'px-3 py-1 rounded-md text-sm font-semibold ' + (+b.dataset.range === n ? 'bg-white shadow' : 'text-slate-500'));
    $('#chart').innerHTML = '<p class="h-72 grid place-items-center text-slate-400 text-sm">Loading chart...</p>';
    try {
      if (!cache[n]) { const r = await fetch(`${API}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${n}`); if (!r.ok) throw 0; cache[n] = (await r.json()).prices; }
      if (days === n) drawChart(cache[n]);
    } catch (e) { if (days === n) $('#chart').innerHTML = '<p class="h-72 grid place-items-center text-slate-400 text-sm">Chart unavailable right now. Try again in a minute.</p>'; }
  };
  document.querySelectorAll('[data-range]').forEach(b => b.onclick = () => showChart(+b.dataset.range));
  showChart(1);

  // Real-time price for this coin (Binance stream; silent if the pair does not exist)
  const stream = () => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${d.symbol.toLowerCase()}usdt@ticker`);
    ws.onmessage = e => {
      const t = JSON.parse(e.data), p = +t.c; if (!p) return;
      const dir = p >= P ? 'up' : 'down'; P = p;
      const el = $('#price'); el.textContent = usd(p); el.classList.remove('f-up', 'f-down'); void el.offsetWidth; el.classList.add('f-' + dir);
      $('#chg').innerHTML = chg(+t.P); $('#mark').style.left = bar() + '%';
    };
    ws.onclose = () => setTimeout(stream, 5000);
  };
  stream();
}

coinPage();
