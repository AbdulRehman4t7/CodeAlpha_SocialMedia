// ===== NOTIFICATIONS MODULE =====

async function loadNotifications() {
  const list = document.getElementById('notifications-list');
  const loader = document.getElementById('notifications-loader');
  const empty = document.getElementById('notifications-empty');
  list.innerHTML = '';
  loader.classList.remove('hidden');
  empty.classList.add('hidden');
  try {
    const data = await api.get('/notifications');
    loader.classList.add('hidden');
    if (!data.notifications.length) { empty.classList.remove('hidden'); return; }
    list.innerHTML = data.notifications.map(n => buildNotifHtml(n)).join('');
    list.querySelectorAll('.notif-item[data-post-id]').forEach(el => {
      el.addEventListener('click', () => showPage('post-detail', { postId: el.dataset.postId }));
    });
    list.querySelectorAll('.notif-item[data-username]').forEach(el => {
      el.addEventListener('click', () => showPage('profile', { username: el.dataset.username }));
    });
    // Update badge
    document.getElementById('notif-badge').classList.add('hidden');
  } catch (err) {
    loader.classList.add('hidden');
    list.innerHTML = `<p style="color:var(--text2);text-align:center;padding:20px">${err.message}</p>`;
  }
}

function buildNotifHtml(n) {
  const icons = { like: '❤️', comment: '💬', follow: '👤' };
  const texts = {
    like: `<strong>${escapeHtml(n.sender?.name)}</strong> liked your post`,
    comment: `<strong>${escapeHtml(n.sender?.name)}</strong> commented on your post`,
    follow: `<strong>${escapeHtml(n.sender?.name)}</strong> started following you`
  };
  const dataAttr = n.post ? `data-post-id="${n.post._id}"` : `data-username="${n.sender?.username}"`;
  return `
    <div class="notif-item ${n.read ? '' : 'unread'}" ${dataAttr}>
      <img src="${buildAvatarUrl(n.sender)}" alt="${n.sender?.name}" class="avatar-sm" />
      <span class="notif-icon">${icons[n.type] || '🔔'}</span>
      <span class="notif-text">${texts[n.type] || 'New notification'}</span>
      <span class="notif-time">${timeAgo(n.createdAt)}</span>
    </div>
  `;
}

document.getElementById('mark-read-btn').addEventListener('click', async () => {
  try {
    await api.put('/notifications/markread');
    document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
    document.getElementById('notif-badge').classList.add('hidden');
    showToast('All notifications marked as read', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

async function fetchUnreadCount() {
  try {
    const data = await api.get('/notifications');
    const unread = data.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    if (unread > 0) { badge.textContent = unread > 9 ? '9+' : unread; badge.classList.remove('hidden'); }
    else { badge.classList.add('hidden'); }
  } catch { /* silent */ }
}
