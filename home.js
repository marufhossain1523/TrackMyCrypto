/* ---------- Home page (public: works logged in or out) ---------- */
async function homePage() {
  const s = user();
  $('#nav').innerHTML = `<div class="max-w-7xl mx-auto flex items-center gap-6 px-4 h-16">
    <a href="index.html" class="text-xl font-extrabold text-brand">TrackMyCrypto</a>
    <a href="index.html" class="text-sm font-semibold text-brand">Home</a>
    <a href="market.html" class="text-sm font-semibold text-ink hover:text-brand">Cryptocurrencies</a>
    <div class="ml-auto flex items-center gap-2">${s
      ? `<a href="profile.html" class="text-sm font-semibold hover:text-brand">Profile</a><a href="profile.html" aria-label="Profile" class="w-9 h-9 rounded-full bg-brand text-white grid place-items-center font-bold">${esc(s.name[0].toUpperCase())}</a>`
      : '<a href="login.html" class="text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-100">Log in</a><a href="login.html#signup" class="text-sm font-semibold px-4 py-2 rounded-lg bg-brand text-white hover:opacity-90">Sign up</a>'}</div></div>`;
  if (s) { $('#cta').innerHTML = '<a href="market.html" class="bg-brand text-white font-semibold rounded-lg px-6 py-3 hover:opacity-90">Open the market</a><a href="profile.html" class="border font-semibold rounded-lg px-6 py-3 hover:bg-slate-50">My profile</a>'; }
  await loadCoins();
  const draw = () => $('#top').innerHTML = coins.slice(0, 4).map(c => `<a href="coin.html?id=${encodeURIComponent(c.id)}" class="block border rounded-xl p-4 bg-white hover:border-brand">

    <div class="flex items-center gap-2 font-semibold">${c.img ? `<img src="${esc(c.img)}" alt="" class="w-6 h-6 rounded-full">` : ''}${esc(c.name)}<span class="text-xs text-slate-400 font-normal">${esc(c.sym)}</span></div>
    <p class="text-xl font-bold mt-2 ${c.flash ? 'f-' + c.dir : ''}">${usd(c.price)}</p><p class="text-sm">${chg(c.d1)}</p></a>`).join('');
  tick = draw; draw(); live();
}

homePage();
