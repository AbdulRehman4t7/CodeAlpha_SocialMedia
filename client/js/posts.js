// ===== POSTS MODULE =====

let feedPage = 1, feedHasMore = true, feedLoading = false;

function getAvatarSrc(pic) {
  if (!pic) return `https://ui-avatars.com/api/?background=7c3aed&color=fff&name=U&size=80`;
  return pic.startsWith('http') ? pic : pic;
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function buildAvatarUrl(user) {
  if (!user) return getAvatarSrc('');
  if (user.profilePicture) return user.profilePicture;
  return `https://ui-avatars.com/api/?background=7c3aed&color=fff&name=${encodeURIComponent(user.name || 'U')}&size=80`;
}

function buildPostCard(post) {
  const me = api.getUser();
  const isLiked = post.likes && post.likes.some(l => (l._id || l) === me?._id);
  const isOwner = post.author?._id === me?._id;
  const card = document.createElement('div');
  card.className = 'post-card';
  card.dataset.postId = post._id;
  card.innerHTML = `
    <div class="post-header">
      <img src="${buildAvatarUrl(post.author)}" alt="${post.author?.name}" class="avatar-md" />
      <div class="post-author-info">
        <span class="post-author-name" data-username="${post.author?.username}">${post.author?.name}</span>
        <span class="post-author-username">@${post.author?.username}</span>
      </div>
      <span class="post-time">${timeAgo(post.createdAt)}</span>
    </div>
    <div class="post-content">${escapeHtml(post.content)}</div>
    ${post.image ? `<div class="post-image" data-post-id="${post._id}"><img src="${post.image}" alt="Post image" loading="lazy" /></div>` : ''}
    <div class="post-actions">
      <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post._id}">
        <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
        <span class="like-count">${post.likes?.length || 0}</span>
      </button>
      <button class="action-btn comment-btn" data-post-id="${post._id}">
        💬 <span>Comment</span>
      </button>
      ${isOwner ? `<button class="action-btn delete-post-btn" data-post-id="${post._id}">🗑️</button>` : ''}
    </div>
  `;
  return card;
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function attachPostEvents(container) {
  container.querySelectorAll('.post-author-name').forEach(el => {
    el.addEventListener('click', () => showPage('profile', { username: el.dataset.username }));
  });
  container.querySelectorAll('.post-image').forEach(el => {
    el.addEventListener('click', () => showPage('post-detail', { postId: el.dataset.postId }));
  });
  container.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleLike(btn));
  });
  container.querySelectorAll('.comment-btn').forEach(btn => {
    btn.addEventListener('click', () => showPage('post-detail', { postId: btn.dataset.postId }));
  });
  container.querySelectorAll('.delete-post-btn').forEach(btn => {
    btn.addEventListener('click', () => deletePost(btn));
  });
}

async function toggleLike(btn) {
  const postId = btn.dataset.postId;
  try {
    const data = await api.post(`/posts/${postId}/like`);
    btn.classList.toggle('liked', data.liked);
    btn.querySelector('.like-icon').textContent = data.liked ? '❤️' : '🤍';
    btn.querySelector('.like-count').textContent = data.likesCount;
    // Sync all like buttons for same post
    document.querySelectorAll(`.like-btn[data-post-id="${postId}"]`).forEach(b => {
      if (b !== btn) {
        b.classList.toggle('liked', data.liked);
        b.querySelector('.like-icon').textContent = data.liked ? '❤️' : '🤍';
        b.querySelector('.like-count').textContent = data.likesCount;
      }
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deletePost(btn) {
  if (!confirm('Delete this post?')) return;
  const postId = btn.dataset.postId;
  try {
    await api.delete(`/posts/${postId}`);
    document.querySelector(`.post-card[data-post-id="${postId}"]`)?.remove();
    showToast('Post deleted', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadFeed(reset = false) {
  if (feedLoading) return;
  if (reset) { feedPage = 1; feedHasMore = true; document.getElementById('feed-posts').innerHTML = ''; }
  if (!feedHasMore) return;
  feedLoading = true;
  document.getElementById('feed-loader').classList.remove('hidden');
  document.getElementById('feed-empty').classList.add('hidden');
  document.getElementById('feed-pagination').classList.add('hidden');
  try {
    const data = await api.get(`/posts/feed?page=${feedPage}&limit=10`);
    const container = document.getElementById('feed-posts');
    if (data.posts.length === 0 && feedPage === 1) {
      document.getElementById('feed-empty').classList.remove('hidden');
    } else {
      data.posts.forEach(post => {
        const card = buildPostCard(post);
        container.appendChild(card);
        attachPostEvents(card);
      });
      feedHasMore = feedPage < data.pagination.pages;
      if (feedHasMore) document.getElementById('feed-pagination').classList.remove('hidden');
      feedPage++;
    }
  } catch (err) {
    showToast('Failed to load feed', 'error');
  } finally {
    feedLoading = false;
    document.getElementById('feed-loader').classList.add('hidden');
  }
}

document.getElementById('load-more-feed').addEventListener('click', () => loadFeed());

// Create post
const postContent = document.getElementById('post-content');
const charCount = document.getElementById('char-count');
const postImageInput = document.getElementById('post-image-input');
let selectedPostFile = null;

postContent.addEventListener('input', () => {
  charCount.textContent = 2200 - postContent.value.length;
});

postImageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  selectedPostFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById('post-img-prev').src = ev.target.result;
    document.getElementById('post-image-preview').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

document.getElementById('remove-post-img').addEventListener('click', () => {
  selectedPostFile = null;
  postImageInput.value = '';
  document.getElementById('post-image-preview').classList.add('hidden');
  document.getElementById('post-img-prev').src = '';
});

document.getElementById('submit-post-btn').addEventListener('click', async () => {
  const content = postContent.value.trim();
  if (!content) { showToast('Please write something first', 'error'); return; }
  const btn = document.getElementById('submit-post-btn');
  btn.disabled = true; btn.textContent = '...';
  try {
    const formData = new FormData();
    formData.append('content', content);
    if (selectedPostFile) formData.append('image', selectedPostFile);
    const data = await api.postForm('/posts', formData);
    postContent.value = ''; charCount.textContent = '2200';
    selectedPostFile = null; postImageInput.value = '';
    document.getElementById('post-image-preview').classList.add('hidden');
    const container = document.getElementById('feed-posts');
    const card = buildPostCard(data.post);
    container.insertBefore(card, container.firstChild);
    attachPostEvents(card);
    document.getElementById('feed-empty').classList.add('hidden');
    showToast('Post created! 🎉', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Post';
  }
});
