// ===== EXPLORE MODULE =====

let explorePage = 1, exploreHasMore = true, exploreLoading = false;
let searchTimer = null;

async function loadExplore(reset = false) {
  if (exploreLoading) return;
  if (reset) { explorePage = 1; exploreHasMore = true; document.getElementById('explore-posts').innerHTML = ''; }
  if (!exploreHasMore) return;
  exploreLoading = true;
  document.getElementById('explore-loader').classList.remove('hidden');
  document.getElementById('explore-pagination').classList.add('hidden');
  try {
    const data = await api.get(`/posts/explore?page=${explorePage}&limit=12`);
    const grid = document.getElementById('explore-posts');
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
    exploreHasMore = explorePage < data.pagination.pages;
    if (exploreHasMore) document.getElementById('explore-pagination').classList.remove('hidden');
    explorePage++;
  } catch (err) {
    showToast('Failed to load explore', 'error');
  } finally {
    exploreLoading = false;
    document.getElementById('explore-loader').classList.add('hidden');
  }
}

document.getElementById('load-more-explore').addEventListener('click', () => loadExplore());

document.getElementById('search-input').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  if (!q) {
    document.getElementById('search-results').classList.add('hidden');
    document.getElementById('search-results').innerHTML = '';
    return;
  }
  searchTimer = setTimeout(() => searchUsers(q), 400);
});

async function searchUsers(q) {
  const container = document.getElementById('search-results');
  container.innerHTML = '<div class="loader-container" style="padding:20px"><div class="spinner"></div></div>';
  container.classList.remove('hidden');
  try {
    const data = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
    if (!data.users.length) {
      container.innerHTML = `<div class="empty-state" style="padding:30px"><p>No users found for "${escapeHtml(q)}"</p></div>`;
      return;
    }
    container.innerHTML = data.users.map(u => `
      <div class="search-user-card" data-username="${u.username}">
        <img src="${buildAvatarUrl(u)}" alt="${u.name}" class="avatar-md" />
        <div class="search-user-info">
          <div class="search-user-name">${escapeHtml(u.name)}</div>
          <div class="search-user-username">@${u.username} · ${u.followers?.length || 0} followers</div>
          ${u.bio ? `<div style="font-size:12px;color:var(--text3);margin-top:2px">${escapeHtml(u.bio.substring(0,60))}${u.bio.length>60?'…':''}</div>` : ''}
        </div>
      </div>
    `).join('');
    container.querySelectorAll('.search-user-card').forEach(card => {
      card.addEventListener('click', () => {
        document.getElementById('search-input').value = '';
        container.classList.add('hidden');
        showPage('profile', { username: card.dataset.username });
      });
    });
  } catch (err) {
    container.innerHTML = `<p style="color:var(--text2);padding:20px;text-align:center">${err.message}</p>`;
  }
}
