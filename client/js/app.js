// ===== APP MODULE — Router & Init =====

let pageHistory = [];
let currentPage = null;
let currentPageParams = {};

function updateSidebarUser(user) {
  if (!user) return;
  document.getElementById('sidebar-name').textContent = user.name;
  document.getElementById('sidebar-username').textContent = '@' + user.username;
  const avatarEl = document.getElementById('sidebar-avatar');
  avatarEl.src = buildAvatarUrl(user);
  avatarEl.onerror = () => { avatarEl.src = `https://ui-avatars.com/api/?background=7c3aed&color=fff&name=${encodeURIComponent(user.name)}&size=80`; };
  document.getElementById('cp-avatar').src = avatarEl.src;
  document.getElementById('edit-avatar-preview').src = avatarEl.src;
}

function showPage(page, params = {}) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  // Update nav
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });

  pageHistory.push({ page: currentPage, params: currentPageParams });
  currentPage = page; currentPageParams = params;

  const pageEl = document.getElementById(`${page}-page`);
  if (pageEl) pageEl.classList.add('active-page');

  // Page-specific load
  if (page === 'home') loadFeed(true);
  else if (page === 'explore') { loadExplore(true); }
  else if (page === 'profile') {
    const me = api.getUser();
    const username = params.username || me?.username;
    loadProfile(username);
  }
  else if (page === 'edit-profile') loadEditProfile();
  else if (page === 'post-detail') loadPostDetail(params.postId);
  else if (page === 'notifications') { loadNotifications(); }

  window.scrollTo(0, 0);
}

function goBack() {
  const prev = pageHistory.pop();
  if (prev && prev.page) showPage(prev.page, prev.params);
  else showPage('home');
}

function initApp() {
  const token = api.getToken();
  const user = api.getUser();
  if (!token || !user) {
    document.getElementById('auth-section').style.display = '';
    document.getElementById('app-section').classList.add('hidden');
    return;
  }

  // Show app
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('app-section').classList.remove('hidden');

  updateSidebarUser(user);

  // Fetch fresh user data
  api.get('/auth/me').then(data => {
    api.setUser(data.user);
    updateSidebarUser(data.user);
  }).catch(() => {});

  // Nav event listeners
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      showPage(page);
    });
  });

  // Start on home
  showPage('home');

  // Poll notifications every 60s
  fetchUnreadCount();
  setInterval(fetchUnreadCount, 60000);
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  const token = api.getToken();
  if (token) {
    initApp();
  } else {
    document.getElementById('auth-section').style.display = '';
    document.getElementById('app-section').classList.add('hidden');
  }
});
