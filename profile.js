/* ---------- Profile page ---------- */
async function profilePage() {
  nav('profile');
 const s = user();
 let H = [], W = [];
  $('#who').innerHTML = `<div class="w-16 h-16 rounded-full bg-brand text-white grid place-items-center text-2xl font-bold">${esc(s.name[0].toUpperCase())}</div>
    <div class="flex-1"><h1 class="text-xl font-bold">${esc(s.name)}</h1><p class="text-sm text-slate-500">${esc(s.email)}</p><p class="text-xs text-slate-400">Member since ${new Date(s.joined).toLocaleDateString()}</p></div>
    <button id="rename" class="border rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-50">Edit name</button><button id="out" class="bg-ink text-white rounded-lg px-3 py-2 text-sm font-semibold">Log out</button>`;
  $('#out').onclick = logout;
  $('#rename').onclick = async () => {
    const n = prompt('Your name', s.name); if (!n || !n.trim()) return;
    s.name = n.trim(); ls.set('lg:session', s);
    await sb.auth.updateUser({ data: { name: s.name } });
    location.reload();
  };
  await loadCoins();
const pick = c => { $('#coin').value = c.id; $('#coinSearch').value = `${c.name} (${c.sym})`; $('#coinList').hidden = true; $('#coinSearch').setCustomValidity(''); };
const showList = () => {
  const q = $('#coinSearch').value.toLowerCase();
  $('#coinList').innerHTML = coins.filter(c => (c.name + c.sym).toLowerCase().includes(q)).slice(0, 30).map(c =>
    `<li><button type="button" data-pick="${esc(c.id)}" class="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center gap-2">${c.img ? `<img src="${esc(c.img)}" alt="" class="w-5 h-5 rounded-full">` : ''}${esc(c.name)} <span class="text-slate-400">${esc(c.sym)}</span></button></li>`).join('')
    || '<li class="px-3 py-2 text-sm text-slate-500">No coin found</li>';
  $('#coinList').hidden = false;
};
$('#coinSearch').oninput = () => { $('#coin').value = ''; showList(); };
$('#coinSearch').onfocus = showList;
document.addEventListener('click', e => {
  const b = e.target.closest('[data-pick]');
  if (b) pick(coins.find(c => c.id === b.dataset.pick));
  else if (e.target.id !== 'coinSearch') $('#coinList').hidden = true;
});
  const draw = () => {
    const h = H, w = W;
    const r = h.map(x => { const c = coins.find(y => y.id === x.coin) || { name: x.coin, sym: '', price: x.buy }; return { id: x.id, c, amt: x.amt, v: x.amt * c.price, cost: x.amt * x.buy }; });
    const tv = r.reduce((a, x) => a + x.v, 0), tc = r.reduce((a, x) => a + x.cost, 0), pl = tv - tc;
    const card = (t, v) => `<div class="border rounded-xl p-4"><p class="text-xs text-slate-500">${t}</p><p class="text-xl font-bold">${v}</p></div>`;
    $('#cards').innerHTML = card('Portfolio balance', usd(tv)) + card('Total profit / loss', `<span class="${pl >= 0 ? 'text-up' : 'text-down'}">${usd(pl)}</span>`) + card('Holdings', r.length) + card('Watchlist', w.length);
    $('#hold').innerHTML = r.length ? '<thead class="text-xs text-slate-500 bg-slate-50"><tr><th class="p-3 text-left">Asset<th class="p-3 text-right">Amount<th class="p-3 text-right">Price<th class="p-3 text-right">Value<th class="p-3 text-right">Profit / loss<th></tr></thead><tbody>' +
      r.map(x => `<tr class="border-t"><td class="p-3 font-semibold">${esc(x.c.name)} <span class="text-xs text-slate-400">${esc(x.c.sym)}</span><td class="p-3 text-right">${x.amt}<td class="p-3 text-right">${usd(x.c.price)}<td class="p-3 text-right">${usd(x.v)}
        <td class="p-3 text-right ${x.v - x.cost >= 0 ? 'text-up' : 'text-down'}">${usd(x.v - x.cost)}<td class="p-3 text-right"><button data-del="${x.id}" class="text-xs text-slate-500 hover:text-down">Remove</button></tr>`).join('') + '</tbody>'
      : '<tbody><tr><td class="p-8 text-center text-slate-500">No holdings yet. Add your first coin above.</tr></tbody>';
    $('#wl').innerHTML = w.length ? w.map(id => { const c = coins.find(y => y.id === id); return c ? `<span class="border rounded-full px-3 py-1 text-sm">${esc(c.name)} <b>${usd(c.price)}</b> ${chg(c.d1)}</span>` : ''; }).join('') : '<span class="text-sm text-slate-500">Star coins on the Market page to see them here.</span>';
  };
  $('#add').onsubmit = async e => {
    e.preventDefault();
    if (!$('#coin').value) { $('#coinSearch').setCustomValidity('Pick a coin from the list'); $('#coinSearch').reportValidity(); return; }
    try { await db.addHolding($('#coin').value, +$('#amt').value, +$('#buy').value); H = await db.holdings(); e.target.reset(); $('#coin').value = ''; draw(); } catch (x) { alert(x); }
  };
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-del]');
    if (b) { try { await db.delHolding(+b.dataset.del); H = H.filter(x => x.id !== +b.dataset.del); draw(); } catch (x) { alert(x); } }
  });
  try { [H, W] = await Promise.all([db.holdings(), db.watch()]); } catch (x) { alert('Could not load your data: ' + x); }
  tick = draw; draw(); live();
}

requireAuth().then(ok => ok && profilePage());

