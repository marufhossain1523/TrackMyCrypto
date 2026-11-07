/* ---------- Profile page ---------- */
async function profilePage() {
  nav('profile');
  const s = user(), hk = 'lg:h:' + s.email, wk = 'lg:w:' + s.email;
  $('#who').innerHTML = `<div class="w-16 h-16 rounded-full bg-brand text-white grid place-items-center text-2xl font-bold">${esc(s.name[0].toUpperCase())}</div>
    <div class="flex-1"><h1 class="text-xl font-bold">${esc(s.name)}</h1><p class="text-sm text-slate-500">${esc(s.email)}</p><p class="text-xs text-slate-400">Member since ${new Date(s.joined).toLocaleDateString()}</p></div>
    <button id="rename" class="border rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-50">Edit name</button><button id="out" class="bg-ink text-white rounded-lg px-3 py-2 text-sm font-semibold">Log out</button>`;
  $('#out').onclick = () => { localStorage.removeItem('lg:session'); location.href = 'login.html'; };
  $('#rename').onclick = () => {
    const n = prompt('Your name', s.name); if (!n || !n.trim()) return;
    s.name = n.trim(); ls.set('lg:session', s);
    const u = ls.get('lg:users', {}); if (u[s.email]) { u[s.email].name = s.name; ls.set('lg:users', u); }
    location.reload();
  };
  await loadCoins();
  $('#coin').innerHTML = coins.map(c => `<option value="${esc(c.id)}">${esc(c.name)} (${esc(c.sym)})</option>`).join('');
  const draw = () => {
    const h = ls.get(hk, []), w = ls.get(wk, []);
    const r = h.map((x, i) => { const c = coins.find(y => y.id === x.id) || { name: x.id, sym: '', price: x.buy }; return { i, c, amt: x.amt, v: x.amt * c.price, cost: x.amt * x.buy }; });
    const tv = r.reduce((a, x) => a + x.v, 0), tc = r.reduce((a, x) => a + x.cost, 0), pl = tv - tc;
    const card = (t, v) => `<div class="border rounded-xl p-4"><p class="text-xs text-slate-500">${t}</p><p class="text-xl font-bold">${v}</p></div>`;
    $('#cards').innerHTML = card('Portfolio balance', usd(tv)) + card('Total profit / loss', `<span class="${pl >= 0 ? 'text-up' : 'text-down'}">${usd(pl)}</span>`) + card('Holdings', r.length) + card('Watchlist', w.length);
    $('#hold').innerHTML = r.length ? '<thead class="text-xs text-slate-500 bg-slate-50"><tr><th class="p-3 text-left">Asset<th class="p-3 text-right">Amount<th class="p-3 text-right">Price<th class="p-3 text-right">Value<th class="p-3 text-right">Profit / loss<th></tr></thead><tbody>' +
      r.map(x => `<tr class="border-t"><td class="p-3 font-semibold">${esc(x.c.name)} <span class="text-xs text-slate-400">${esc(x.c.sym)}</span><td class="p-3 text-right">${x.amt}<td class="p-3 text-right">${usd(x.c.price)}<td class="p-3 text-right">${usd(x.v)}
        <td class="p-3 text-right ${x.v - x.cost >= 0 ? 'text-up' : 'text-down'}">${usd(x.v - x.cost)}<td class="p-3 text-right"><button data-del="${x.i}" class="text-xs text-slate-500 hover:text-down">Remove</button></tr>`).join('') + '</tbody>'
      : '<tbody><tr><td class="p-8 text-center text-slate-500">No holdings yet. Add your first coin above.</tr></tbody>';
    $('#wl').innerHTML = w.length ? w.map(id => { const c = coins.find(y => y.id === id); return c ? `<span class="border rounded-full px-3 py-1 text-sm">${esc(c.name)} <b>${usd(c.price)}</b> ${chg(c.d1)}</span>` : ''; }).join('') : '<span class="text-sm text-slate-500">Star coins on the Market page to see them here.</span>';
  };
  $('#add').onsubmit = e => { e.preventDefault(); const h = ls.get(hk, []); h.push({ id: $('#coin').value, amt: +$('#amt').value, buy: +$('#buy').value }); ls.set(hk, h); e.target.reset(); draw(); };
  document.addEventListener('click', e => { if (e.target.dataset.del !== undefined) { const h = ls.get(hk, []); h.splice(+e.target.dataset.del, 1); ls.set(hk, h); draw(); } });
  tick = draw; draw(); live();
}

if (!user()) location.replace('login.html'); else profilePage();
