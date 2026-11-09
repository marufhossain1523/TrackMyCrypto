/* ---------- Login page ---------- */
function loginPage() {
  if (user()) return location.replace('market.html');
  let mode = 'in';
  const set = m => {
    mode = m; $('#nameWrap').hidden = m === 'in'; $('#go').textContent = m === 'in' ? 'Log in' : 'Create account'; $('#err').textContent = '';
    [['t-in', 'in'], ['t-up', 'up']].forEach(([id, k]) => $('#' + id).className = 'flex-1 py-2 rounded-lg text-sm font-semibold ' + (m === k ? 'bg-white shadow' : 'text-slate-500'));
  };
  $('#t-in').onclick = () => set('in'); $('#t-up').onclick = () => set('up'); set(location.hash === '#signup' ? 'up' : 'in');
  $('#form').onsubmit = async e => {
    e.preventDefault();
    const em = $('#email').value.trim().toLowerCase(), pw = $('#pass').value;
    try { mode === 'in' ? await signin(em, pw) : await signup($('#name').value.trim() || em.split('@')[0], em, pw); } catch (x) { $('#err').textContent = x; }
  };
  $('#demo').onclick = async () => { try { await signin(DEMO_EMAIL, DEMO_PASS); } catch (x) { $('#err').textContent = x; } };
}

loginPage();
