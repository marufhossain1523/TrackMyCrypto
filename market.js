/* ---------- Market page ---------- */
async function marketPage() {
  nav('market');
  let tab = 'top';
  let W = [];
  const watch = () => W;
  const rows = () => {
    let l = coins.filter(c => (c.name + c.sym).toLowerCase().includes($('#q').value.toLowerCase()));
    if (tab === 'gainers') l = [...l].sort((a, b) => (b.d1 ?? 0) - (a.d1 ?? 0));
    if (tab === 'losers') l = [...l].sort((a, b) => (a.d1 ?? 0) - (b.d1 ?? 0));
    if (tab === 'watch') l = l.filter(c => watch().includes(c.id));
    return l;
  };
  const th = (t, r) => `<th class="px-3 py-3 font-semibold ${r ? 'text-right' : 'text-left'} whitespace-nowrap">${t}</th>`;
  const draw = () => {
    $('#tabs').innerHTML = [['top', 'Top'], ['gainers', 'Gainers'], ['losers', 'Losers'], ['watch', 'Watchlist']]
      .map(([k, l]) => `<button data-tab="${k}" class="px-3 py-1.5 rounded-lg text-sm font-semibold ${tab === k ? 'bg-slate-100 text-ink' : 'text-slate-500'}">${l}</button>`).join('');
    const w = watch(), l = rows();
    $('#mk').innerHTML = `<thead class="text-xs text-slate-500 bg-slate-50"><tr>${th('')}${th('#')}${th('Name')}${th('Price', 1)}${th('1h %', 1)}${th('24h %', 1)}${th('7d %', 1)}${th('Market Cap', 1)}${th('Volume(24h)', 1)}${th('Circulating Supply', 1)}${th('Last 7 Days', 1)}</tr></thead><tbody>` +
      (l.length ? l.map(c => `<tr class="border-t hover:bg-slate-50">
        <td class="px-3 py-4"><button data-star="${esc(c.id)}" aria-label="Watch ${esc(c.name)}" class="text-lg ${w.includes(c.id) ? 'text-yellow-400' : 'text-slate-300'}">&#9733;</button>
        <td class="px-3 text-slate-500">${c.rank ?? ''}
        <td class="px-3 font-semibold whitespace-nowrap">${c.img ? `<img src="${esc(c.img)}" alt="" class="inline w-6 h-6 rounded-full mr-2">` : ''}${esc(c.name)}<span class="text-xs text-slate-400 font-normal ml-2">${esc(c.sym)}</span>
        <td class="px-3 text-right font-semibold ${c.flash ? 'f-' + c.dir : ''}">${usd(c.price)}
        <td class="px-3 text-right">${chg(c.h1)}<td class="px-3 text-right">${chg(c.d1)}<td class="px-3 text-right">${chg(c.d7)}
        <td class="px-3 text-right">${big(c.mcap)}<td class="px-3 text-right">${big(c.vol)}<td class="px-3 text-right whitespace-nowrap">${num(c.sup)} ${esc(c.sym)}
        <td class="px-3 text-right">${spark(c.spark, (c.d7 ?? c.d1) >= 0)}</tr>`).join('') : '<tr><td colspan="11" class="p-10 text-center text-slate-500">Nothing here yet. Tap the star on a coin to add it to your watchlist.</tr>') + '</tbody>';
  };
  document.addEventListener('click', async e => {
    const t = e.target;
    if (t.dataset.tab) { tab = t.dataset.tab; draw(); }
    if (t.dataset.star) { const id = t.dataset.star, has = W.includes(id); try { await db.toggleWatch(id, has); W = has ? W.filter(x => x !== id) : [...W, id]; draw(); } catch (x) { alert(x); } }
  });
  $('#q').oninput = draw;
  try { W = await db.watch(); } catch (e) {}
await loadCoins(); tick = draw; draw(); live(); setInterval(async () => { await loadCoins(); draw(); }, 300000);

  const g = await fetch(API + '/global').then(r => r.json()).then(r => r.data).catch(() => null);
  const f = await fetch('https://api.alternative.me/fng/').then(r => r.json()).then(r => r.data[0]).catch(() => null);
  const card = (t, v, s) => `<div class="border rounded-xl p-4"><p class="text-xs text-slate-500">${t}</p><p class="text-lg font-bold">${v}</p><p class="text-xs">${s}</p></div>`;
  const d = g?.market_cap_change_percentage_24h_usd;
  $('#stats').innerHTML = card('Market Cap', g ? big(g.total_market_cap.usd) : '-', chg(d)) + card('24h Trading Volume', g ? big(g.total_volume.usd) : '-', '&nbsp;') +
    card('Dominance', g ? `BTC ${g.market_cap_percentage.btc.toFixed(1)}%  ETH ${g.market_cap_percentage.eth.toFixed(1)}%` : '-', '&nbsp;') +
    card('Fear &amp; Greed', f ? f.value + ' / 100' : '-', f ? esc(f.value_classification) : '&nbsp;');
  if (g) $('#sub').innerHTML = `The global crypto market cap is ${big(g.total_market_cap.usd)}, a ${Math.abs(d).toFixed(2)}% ${d >= 0 ? 'increase' : 'decrease'} over the last day.`;
}

requireAuth().then(ok => ok && marketPage());
