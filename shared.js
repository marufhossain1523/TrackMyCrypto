/* Ledgerly shared.js: helpers, auth, data and live prices used by every page. Login is a demo (browser storage only); use a real backend in production. */
tailwind.config = { theme: { extend: { colors: { up: '#16c784', down: '#ea3943', brand: '#3861fb', ink: '#0d1421' } } } };
document.head.insertAdjacentHTML('beforeend', '<style>@keyframes fu{from{background:#16c78440}}@keyframes fd{from{background:#ea394340}}.f-up{animation:fu 1s}.f-down{animation:fd 1s}@media(prefers-reduced-motion:reduce){.f-up,.f-down{animation:none}}</style>');

const $ = s => document.querySelector(s);
const API = 'https://api.coingecko.com/api/v3';
const ls = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set: (k, v) => localStorage.setItem(k, JSON.stringify(v)) };
const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const usd = n => n == null ? '-' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n < 1 ? 6 : 2 });
const big = n => n == null ? '-' : '$' + Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(n);
const num = n => n == null ? '-' : Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(n);
const chg = n => n == null ? '-' : `<span class="${n >= 0 ? 'text-up' : 'text-down'}">${n >= 0 ? '&#9650;' : '&#9660;'} ${Math.abs(n).toFixed(2)}%</span>`;
const user = () => ls.get('lg:session', null);
const setStatus = t => { const s = $('#status'); if (s) s.textContent = t; };
/* ---------- Auth (Supabase) ---------- */
// 1) Create a free project at https://supabase.com  2) Settings > API: copy the Project URL and the anon public key
const SUPABASE_URL = 'https://fmzuyjrngufxtaycmhky.supabase.co';
const SUPABASE_KEY = 'sb_publishable_A0vFv8-HoHn7zN6mQpXZZA_XY9PmRr_';
const DEMO_EMAIL = 'demo@example.com', DEMO_PASS = 'demo1234'; // create this user in Supabase > Authentication > Users (tick Auto Confirm)
const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Small cache so pages can read the user synchronously (the real session lives in Supabase)
const start = u => {
  ls.set('lg:session', { email: u.email, name: u.user_metadata?.name || u.email.split('@')[0], joined: Date.parse(u.created_at) });
  location.href = 'market.html';
};
async function signup(name, email, pass) {
  const { data, error } = await sb.auth.signUp({ email, password: pass, options: { data: { name } } });
  if (error) throw error.message;
  if (!data.session) throw 'Account created. Check your email to confirm it, then log in.';
  start(data.user);
}
async function signin(email, pass) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
  if (error) throw error.message;
  start(data.user);
}
async function logout() {
  await sb.auth.signOut();
  localStorage.removeItem('lg:session');
  location.href = 'login.html';
}
async function requireAuth() { // true only when Supabase has a valid session
  const { data } = sb ? await sb.auth.getSession() : { data: {} };
  if (data.session) return true;
  localStorage.removeItem('lg:session');
  location.replace('login.html');
  return false;
}

/* ---------- Cloud data (Supabase tables: holdings, watchlist) ---------- */
const db = {
  async holdings() { const { data, error } = await sb.from('holdings').select('*').order('created_at'); if (error) throw error.message; return data.map(r => ({ id: r.id, coin: r.coin_id, amt: +r.amount, buy: +r.buy_price })); },
  async addHolding(coin, amt, buy) { const { error } = await sb.from('holdings').insert({ coin_id: coin, amount: amt, buy_price: buy }); if (error) throw error.message; },
  async delHolding(id) { const { error } = await sb.from('holdings').delete().eq('id', id); if (error) throw error.message; },
  async watch() { const { data, error } = await sb.from('watchlist').select('coin_id'); if (error) throw error.message; return data.map(r => r.coin_id); },
  async toggleWatch(coin, remove) { const { error } = await (remove ? sb.from('watchlist').delete().eq('coin_id', coin) : sb.from('watchlist').insert({ coin_id: coin })); if (error) throw error.message; }
};

function nav(active) {
  const s = user(), link = (h, k, t) => `<a href="${h}" class="text-sm font-semibold ${active === k ? 'text-brand' : 'text-ink hover:text-brand'}">${t}</a>`;
  $('#nav').innerHTML = `<div class="max-w-7xl mx-auto flex items-center gap-6 px-4 h-16">
    <a href="index.html" class="text-xl font-extrabold text-brand">Ledgerly</a>${link('index.html', 'home', 'Home')}${link('market.html', 'market', 'Cryptocurrencies')}${link('profile.html', 'profile', 'Profile')}
    <div class="ml-auto flex items-center gap-3"><span id="status" class="hidden sm:block text-xs text-slate-500"></span>
    <a href="profile.html" aria-label="Profile" class="w-9 h-9 rounded-full bg-brand text-white grid place-items-center font-bold">${esc(s.name[0].toUpperCase())}</a></div></div>`;
}

/* ---------- Data ---------- */
let coins = [], wsOk = false, dirty = false, tick = () => {};
const norm = c => ({ id: c.id, sym: c.symbol.toUpperCase(), name: c.name, img: c.image, rank: c.market_cap_rank, price: c.current_price,
  h1: c.price_change_percentage_1h_in_currency, d1: c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h,
  d7: c.price_change_percentage_7d_in_currency, mcap: c.market_cap, vol: c.total_volume, sup: c.circulating_supply, spark: c.sparkline_in_7d?.price || [] });
const SAMPLE = [['bitcoin', 'btc', 'Bitcoin', 76098, -5.2, 1.5e12, 5e10, 19.9e6], ['ethereum', 'eth', 'Ethereum', 2242, -7.2, 2.7e11, 3e10, 120e6],
  ['tether', 'usdt', 'Tether', 1, 0, 1.8e11, 8e10, 180e9], ['binancecoin', 'bnb', 'BNB', 696, -3, 1e11, 1e9, 145e6],
  ['ripple', 'xrp', 'XRP', 1.19, -9.4, 7e10, 4e9, 58e9], ['solana', 'sol', 'Solana', 140, -6.1, 6e10, 3e9, 430e6]
].map(([id, symbol, name, p, d, m, v, s], i) => norm({ id, symbol, name, current_price: p, price_change_percentage_24h: d, market_cap_rank: i + 1, market_cap: m, total_volume: v, circulating_supply: s,
  sparkline_in_7d: { price: Array.from({ length: 42 }, (_, k) => p * (1 + Math.sin(k / 4 + i) * .02 + (k - 21) * d / 4000)) } }));

async function loadCoins() {
  try {
    const r = await fetch(`${API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=true&price_change_percentage=1h,24h,7d`);
    if (!r.ok) throw 0;
    coins = (await r.json()).map(norm);
    if (!wsOk) setStatus('Prices from CoinGecko');
  } catch (e) { coins = SAMPLE; if (!wsOk) setStatus('Offline: sample prices'); }
}
function live() { // real-time prices from Binance public stream
  const ws = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');
  ws.onopen = () => { wsOk = true; setStatus('Live: real-time prices'); };
  ws.onmessage = e => {
    const m = {}; JSON.parse(e.data).forEach(t => m[t.s] = t);
    coins.forEach(c => {
      const t = m[c.sym + 'USDT']; if (!t) return;
      const p = +t.c;
      if (p !== c.price) { c.dir = p > c.price ? 'up' : 'down'; c.flash = true; c.price = p; c.d1 = (p - +t.o) / +t.o * 100; dirty = true; }
    });
  };
  ws.onclose = ws.onerror = () => { wsOk = false; setStatus('Reconnecting...'); setTimeout(live, 3000); ws.onclose = ws.onerror = null; };
}
setInterval(() => { if (!dirty) return; dirty = false; tick(); coins.forEach(c => c.flash = false); }, 1000);
const spark = (d, up) => {
  d = d.filter((_, i) => i % 4 === 0); if (d.length < 2) return '';
  const mn = Math.min(...d), mx = Math.max(...d);
  return `<svg viewBox="0 0 100 32" class="w-28 h-8" aria-hidden="true"><polyline fill="none" stroke="${up ? '#16c784' : '#ea3943'}" stroke-width="2" points="${d.map((v, i) => `${(i / (d.length - 1) * 100).toFixed(1)},${(30 - (v - mn) / (mx - mn || 1) * 28).toFixed(1)}`).join(' ')}"/></svg>`;
};

