// ===== AUTH MODULE =====

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

function setButtonLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  if (loading) { btn.disabled = true; text?.classList.add('hidden'); loader?.classList.remove('hidden'); }
  else { btn.disabled = false; text?.classList.remove('hidden'); loader?.classList.add('hidden'); }
}

function switchAuthPage(page) {
  document.querySelectorAll('.auth-page').forEach(p => p.classList.remove('active-page'));
  document.getElementById(`${page}-page`).classList.add('active-page');
}

document.getElementById('go-register').addEventListener('click', (e) => { e.preventDefault(); switchAuthPage('register'); });
document.getElementById('go-login').addEventListener('click', (e) => { e.preventDefault(); switchAuthPage('login'); });

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.classList.add('hidden');
  setButtonLoading('login-btn', true);
  try {
    const data = await api.post('/auth/login', { email, password });
    api.setToken(data.token);
    api.setUser(data.user);
    initApp();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    setButtonLoading('login-btn', false);
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('register-error');
  errorEl.classList.add('hidden');
  if (password.length < 6) { errorEl.textContent = 'Password must be at least 6 characters'; errorEl.classList.remove('hidden'); return; }
  setButtonLoading('register-btn', true);
  try {
    const data = await api.post('/auth/register', { name, username, email, password });
    api.setToken(data.token);
    api.setUser(data.user);
    initApp();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    setButtonLoading('register-btn', false);
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  api.removeToken();
  api.removeUser();
  document.getElementById('app-section').classList.add('hidden');
  document.getElementById('auth-section').style.display = '';
  document.querySelectorAll('.auth-page').forEach(p => p.classList.remove('active-page'));
  document.getElementById('login-page').classList.add('active-page');
  document.getElementById('login-form').reset();
});
