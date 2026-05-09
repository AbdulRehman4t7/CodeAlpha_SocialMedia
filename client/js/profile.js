// ===== PROFILE MODULE =====

let currentProfileUser = null;

async function loadProfile(username) {
  const container = document.getElementById('profile-content');
  const loader = document.getElementById('profile-loader');
  container.innerHTML = '';
  loader.classList.remove('hidden');
  try {
    const data = await api.get(`/users/${username}`);
    currentProfileUser = data.user;
    loader.classList.add('hidden');
    renderProfile(data.user);
    loadUserPosts(data.user._id);
  } catch (err) {
    loader.classList.add('hidden');
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">❓</div><h3>User not found</h3></div>`;
  }
}

function renderProfile(user) {
  const me = api.getUser();
  const isMe = me && me._id === user._id;
  const isFollowing = user.followers?.some(f => (f._id || f) === me?._id);
  const container = document.getElementById('profile-content');
  container.innerHTML = `
    <div class="profile-header">
      <div class="profile-top">
        <img src="${buildAvatarUrl(user)}" alt="${user.name}" class="avatar-xl" />
        <div class="profile-info">
          <div class="profile-name">${escapeHtml(user.name)}</div>
          <div class="profile-username">@${user.username}</div>
          ${user.bio ? `<div class="profile-bio">${escapeHtml(user.bio)}</div>` : ''}
          <div class="profile-stats">
            <div class="stat-item" id="followers-btn">
              <span class="stat-value">${user.followers?.length || 0}</span>
              <span class="stat-label">Followers</span>
            </div>
            <div class="stat-item" id="following-btn">
              <span class="stat-value">${user.following?.length || 0}</span>
              <span class="stat-label">Following</span>
            </div>
          </div>
        </div>
      </div>
      <div class="profile-actions">
        ${isMe
          ? `<button class="btn btn-ghost" id="edit-profile-btn">✏️ Edit Profile</button>`
          : isFollowing
            ? `<button class="btn btn-ghost" id="follow-toggle-btn" data-user-id="${user._id}" data-action="unfollow">Unfollow</button>`
            : `<button class="btn btn-primary" id="follow-toggle-btn" data-user-id="${user._id}" data-action="follow">Follow</button>`
        }
      </div>
    </div>
    <div class="profile-posts-grid" id="profile-posts-grid"></div>
    <div id="profile-posts-loader" class="loader-container"><div class="spinner"></div></div>
    <div id="profile-posts-empty" class="empty-state hidden">
      <div class="empty-icon">📷</div>
      <h3>No posts yet</h3>
    </div>
  `;

  document.getElementById('followers-btn')?.addEventListener('click', () => showFollowersModal(user._id, 'followers'));
  document.getElementById('following-btn')?.addEventListener('click', () => showFollowersModal(user._id, 'following'));
  document.getElementById('edit-profile-btn')?.addEventListener('click', () => showPage('edit-profile'));
  document.getElementById('follow-toggle-btn')?.addEventListener('click', handleFollowToggle);
}

async function handleFollowToggle(e) {
  const btn = e.currentTarget;
  const userId = btn.dataset.userId;
  const action = btn.dataset.action;
  btn.disabled = true;
  try {
    const data = await api.post(`/users/${userId}/${action}`);
    const me = data.currentUser;
    api.setUser(me);
    updateSidebarUser(me);
    const targetUser = data.targetUser;
    currentProfileUser = targetUser;
    renderProfile(targetUser);
    loadUserPosts(targetUser._id);
    showToast(action === 'follow' ? 'Now following!' : 'Unfollowed', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
  }
}

async function loadUserPosts(userId) {
  const grid = document.getElementById('profile-posts-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const loader = document.getElementById('profile-posts-loader');
  const empty = document.getElementById('profile-posts-empty');
  if (loader) loader.classList.remove('hidden');
  if (empty) empty.classList.add('hidden');
  try {
    const data = await api.get(`/posts/user/${userId}`);
    if (loader) loader.classList.add('hidden');
    if (!data.posts.length) { if (empty) empty.classList.remove('hidden'); return; }
    data.posts.forEach(post => {
      const cell = document.createElement('div');
      cell.className = 'grid-post';
      cell.dataset.postId = post._id;
      if (post.image) {
        cell.innerHTML = `<img src="${post.image}" alt="post" loading="lazy" />`;
      } else {
        cell.innerHTML = `<div class="grid-post-placeholder">${escapeHtml(post.content.substring(0, 80))}${post.content.length > 80 ? '…' : ''}</div>`;
      }
      cell.addEventListener('click', () => showPage('post-detail', { postId: post._id }));
      grid.appendChild(cell);
    });
  } catch (err) {
    if (loader) loader.classList.add('hidden');
  }
}

async function showFollowersModal(userId, type) {
  const overlay = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const content = document.getElementById('modal-content');
  title.textContent = type === 'followers' ? 'Followers' : 'Following';
  content.innerHTML = '<div class="loader-container"><div class="spinner"></div></div>';
  overlay.classList.remove('hidden');
  try {
    const data = await api.get(`/users/${userId}/${type}`);
    const list = data.followers || data.following;
    if (!list.length) { content.innerHTML = `<div class="empty-state" style="padding:30px"><p>No ${type} yet</p></div>`; return; }
    content.innerHTML = list.map(u => `
      <div class="modal-user-item" data-username="${u.username}">
        <img src="${buildAvatarUrl(u)}" alt="${u.name}" class="avatar-sm" />
        <div>
          <div class="modal-user-name">${escapeHtml(u.name)}</div>
          <div class="modal-user-username">@${u.username}</div>
        </div>
      </div>
    `).join('');
    content.querySelectorAll('.modal-user-item').forEach(el => {
      el.addEventListener('click', () => {
        overlay.classList.add('hidden');
        showPage('profile', { username: el.dataset.username });
      });
    });
  } catch (err) {
    content.innerHTML = `<p style="color:var(--text2);text-align:center;padding:20px">${err.message}</p>`;
  }
}

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('modal-overlay').classList.add('hidden');
});
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
});

// ===== POST DETAIL MODULE =====
async function loadPostDetail(postId) {
  const container = document.getElementById('post-detail-content');
  const loader = document.getElementById('post-detail-loader');
  container.innerHTML = '';
  loader.classList.remove('hidden');
  try {
    const [postData, commentsData] = await Promise.all([
      api.get(`/posts/${postId}`),
      api.get(`/comments/${postId}`)
    ]);
    loader.classList.add('hidden');
    renderPostDetail(postData.post, commentsData.comments);
  } catch (err) {
    loader.classList.add('hidden');
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><h3>Post not found</h3></div>`;
  }
}

function renderPostDetail(post, comments) {
  const me = api.getUser();
  const isLiked = post.likes?.some(l => (l._id || l) === me?._id);
  const isOwner = post.author?._id === me?._id;
  const container = document.getElementById('post-detail-content');
  container.innerHTML = `
    <div class="post-detail-card post-card" data-post-id="${post._id}">
      <div class="post-header">
        <img src="${buildAvatarUrl(post.author)}" alt="${post.author?.name}" class="avatar-md" />
        <div class="post-author-info">
          <span class="post-author-name" data-username="${post.author?.username}" style="cursor:pointer">${escapeHtml(post.author?.name)}</span>
          <span class="post-author-username">@${post.author?.username}</span>
        </div>
        <span class="post-time">${timeAgo(post.createdAt)}</span>
      </div>
      <div class="post-content" style="font-size:16px">${escapeHtml(post.content)}</div>
      ${post.image ? `<div class="post-image"><img src="${post.image}" alt="Post" /></div>` : ''}
      <div class="post-actions">
        <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post._id}">
          <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
          <span class="like-count">${post.likes?.length || 0}</span> Likes
        </button>
        ${isOwner ? `<button class="action-btn delete-post-btn" data-post-id="${post._id}">🗑️ Delete</button>` : ''}
      </div>
    </div>
    <div class="comments-section" style="padding:0 4px">
      <h3>Comments (${comments.length})</h3>
      <div class="comment-input-row">
        <img src="${buildAvatarUrl(me)}" alt="You" class="avatar-sm" />
        <textarea id="detail-comment-input" placeholder="Add a comment..." rows="2"></textarea>
        <button class="btn btn-primary btn-sm" id="submit-comment-btn" style="align-self:flex-end">Post</button>
      </div>
      <div id="comments-list"></div>
    </div>
  `;

  container.querySelector('.post-author-name').addEventListener('click', () => showPage('profile', { username: post.author?.username }));
  container.querySelector('.like-btn')?.addEventListener('click', (e) => toggleLike(e.currentTarget));
  container.querySelector('.delete-post-btn')?.addEventListener('click', async (e) => {
    await deletePost(e.currentTarget);
    goBack();
  });

  const submitBtn = document.getElementById('submit-comment-btn');
  submitBtn.addEventListener('click', () => submitComment(post._id));
  document.getElementById('detail-comment-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(post._id); }
  });

  renderComments(comments, post._id);
}

function renderComments(comments, postId) {
  const list = document.getElementById('comments-list');
  if (!list) return;
  if (!comments.length) { list.innerHTML = '<p style="color:var(--text3);font-size:13px;text-align:center;padding:20px">No comments yet. Be the first!</p>'; return; }
  list.innerHTML = comments.map(c => buildCommentHtml(c)).join('');
  list.querySelectorAll('.comment-author').forEach(el => {
    el.addEventListener('click', () => showPage('profile', { username: el.dataset.username }));
  });
  list.querySelectorAll('.comment-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await api.delete(`/comments/${btn.dataset.id}`);
        btn.closest('.comment-card').remove();
        showToast('Comment deleted', 'success');
      } catch (err) { showToast(err.message, 'error'); }
    });
  });
}

function buildCommentHtml(c) {
  const me = api.getUser();
  const canDelete = me && (c.author?._id === me._id);
  return `
    <div class="comment-card">
      <img src="${buildAvatarUrl(c.author)}" alt="${c.author?.name}" class="avatar-sm" />
      <div class="comment-body">
        <span class="comment-author" data-username="${c.author?.username}">${escapeHtml(c.author?.name)}</span>
        <div class="comment-text">${escapeHtml(c.text)}</div>
        <div class="comment-time">${timeAgo(c.createdAt)}</div>
      </div>
      ${canDelete ? `<button class="comment-delete" data-id="${c._id}">🗑️</button>` : ''}
    </div>
  `;
}

async function submitComment(postId) {
  const input = document.getElementById('detail-comment-input');
  const text = input.value.trim();
  if (!text) return;
  const btn = document.getElementById('submit-comment-btn');
  btn.disabled = true;
  try {
    const data = await api.post(`/comments/${postId}`, { text });
    input.value = '';
    const list = document.getElementById('comments-list');
    if (list.querySelector('p')) list.innerHTML = '';
    const div = document.createElement('div');
    div.innerHTML = buildCommentHtml(data.comment);
    const card = div.firstElementChild;
    card.querySelector('.comment-author')?.addEventListener('click', () => showPage('profile', { username: data.comment.author?.username }));
    card.querySelector('.comment-delete')?.addEventListener('click', async (e) => {
      try {
        await api.delete(`/comments/${e.currentTarget.dataset.id}`);
        card.remove();
        showToast('Comment deleted', 'success');
      } catch (err) { showToast(err.message, 'error'); }
    });
    list.appendChild(card);
    showToast('Comment added', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// Edit Profile
function loadEditProfile() {
  const me = api.getUser();
  if (!me) return;
  document.getElementById('edit-name').value = me.name || '';
  document.getElementById('edit-bio').value = me.bio || '';
  document.getElementById('edit-avatar-preview').src = buildAvatarUrl(me);
}

let editAvatarFile = null;
document.getElementById('edit-avatar-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  editAvatarFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => { document.getElementById('edit-avatar-preview').src = ev.target.result; };
  reader.readAsDataURL(file);
});

document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('edit-error');
  const successEl = document.getElementById('edit-success');
  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');
  const btn = document.getElementById('save-profile-btn');
  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    const formData = new FormData();
    formData.append('name', document.getElementById('edit-name').value.trim());
    formData.append('bio', document.getElementById('edit-bio').value.trim());
    const pwd = document.getElementById('edit-password').value;
    if (pwd) {
      if (pwd.length < 6) throw new Error('Password must be at least 6 characters');
      formData.append('password', pwd);
    }
    if (editAvatarFile) formData.append('profilePicture', editAvatarFile);
    const data = await api.putForm('/users/update', formData);
    api.setUser(data.user);
    updateSidebarUser(data.user);
    editAvatarFile = null;
    document.getElementById('edit-password').value = '';
    successEl.textContent = 'Profile updated successfully!';
    successEl.classList.remove('hidden');
    showToast('Profile updated! ✅', 'success');
    setTimeout(() => successEl.classList.add('hidden'), 3000);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled = false; btn.textContent = 'Save Changes';
  }
});
