// ===========================================================
// 匯洲工單系統 - 共用工具
// ===========================================================

// ===== PWA Service Worker 註冊（讓網站可被安裝為桌面 App）=====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err =>
      console.warn('Service Worker 註冊失敗:', err)
    );
  });
}

// ===== 常數 =====
const LOCATION_LABEL = {
  zhongli_cs: '中壢客服',
  longtan_cs: '龍潭客服',
  longtan_wh: '龍潭倉管',
  admin: '管理員'
};

const LOCATION_BADGE_CLASS = {
  zhongli_cs: 'badge-zhongli',
  longtan_cs: 'badge-longtan',
  longtan_wh: 'badge-warehouse',
  admin: 'badge-admin'
};

const LOCATION_ICON = {
  zhongli_cs: '🔵',
  longtan_cs: '🟢',
  longtan_wh: '🟡',
  admin: '🟣'
};

const CATEGORY_LABEL = {
  shipment: '出貨',
  return: '退換貨',
  inquiry: '查詢',
  review: '審核',
  other: '其他'
};

const CATEGORY_CLASS = {
  shipment: 'cat-shipment',
  return: 'cat-return',
  inquiry: 'cat-inquiry',
  review: 'cat-review',
  other: 'cat-other'
};

const STORAGE_KEY = 'huizhou_user_id';

// ===== 全域使用者狀態 =====
let currentUser = null;

// ===== 身份識別 =====
async function getUserIdentity(allowedLocations) {
  let userId = localStorage.getItem(STORAGE_KEY);

  if (userId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, location, active')
      .eq('id', userId)
      .maybeSingle();
    if (!error && data && data.active && allowedLocations.includes(data.location)) {
      currentUser = data;
      return data;
    }
    localStorage.removeItem(STORAGE_KEY);
  }

  // 從雲端撈出可選身份
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, location')
    .eq('active', true)
    .in('location', allowedLocations)
    .order('location', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    alert('無法連線到資料庫，請確認 config.js 設定是否正確：\n' + error.message);
    throw error;
  }
  if (!users || users.length === 0) {
    alert('資料庫中沒有可用的人員資料。\n請聯絡管理員（小瀾）新增員工。');
    throw new Error('No users available');
  }

  const selected = await showIdentityPicker(users);
  localStorage.setItem(STORAGE_KEY, selected.id);
  currentUser = selected;
  return selected;
}

function showIdentityPicker(users) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop open';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <h2>請選擇您的身份</h2>
          <p>選擇後系統會記住，下次開啟不用再選。換電腦時可重新選擇。</p>
        </div>
        <div class="modal-body">
          <div class="identity-list">
            ${users.map(u => `
              <button class="identity-option" data-id="${u.id}">
                <span class="badge ${LOCATION_BADGE_CLASS[u.location]}">${LOCATION_ICON[u.location]} ${LOCATION_LABEL[u.location]}</span>
                <span class="identity-name">${escapeHtml(u.name)}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('.identity-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const selected = users.find(u => u.id === id);
        modal.remove();
        resolve(selected);
      });
    });
  });
}

function changeIdentity() {
  if (!confirm('確定要切換身份嗎？\n（會回到身份選擇畫面）')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function renderUserChip(targetEl) {
  if (!currentUser) return;
  const icon = LOCATION_ICON[currentUser.location];
  const loc = LOCATION_LABEL[currentUser.location];
  targetEl.innerHTML = `
    <span>👤 ${icon} ${loc} ${escapeHtml(currentUser.name)}</span>
    <button class="change-btn" onclick="changeIdentity()">變更</button>
  `;
}

// ===== Toast 通知 =====
let toastStack = null;
function getToastStack() {
  if (!toastStack) {
    toastStack = document.createElement('div');
    toastStack.className = 'toast-stack';
    document.body.appendChild(toastStack);
  }
  return toastStack;
}

function showToast({ type = 'info', title, message, meta, taskId, durationMs = 10000 }) {
  const stack = getToastStack();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <button class="toast-close">×</button>
    <div class="toast-title">${escapeHtml(title || '')}</div>
    ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ''}
    ${meta ? `<div class="toast-meta">${escapeHtml(meta)}</div>` : ''}
  `;
  stack.appendChild(toast);

  const remove = () => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('.toast-close').addEventListener('click', (e) => {
    e.stopPropagation();
    remove();
  });
  toast.addEventListener('click', () => {
    if (taskId && typeof onToastClick === 'function') {
      onToastClick(taskId);
    }
    remove();
  });

  setTimeout(remove, durationMs);
}

// ===== 警報音 =====
let audioCtx = null;
function playAlert(urgent = false) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const times = urgent ? 5 : 3;
    for (let i = 0; i < times; i++) {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = urgent ? (i % 2 === 0 ? 880 : 440) : 660;
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      }, i * 600);
    }
  } catch (e) {
    console.warn('警報音播放失敗:', e);
  }
}

// 第一次使用者互動時 unlock audio context（瀏覽器政策）
document.addEventListener('click', function unlock() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  document.removeEventListener('click', unlock);
}, { once: true });

// ===== 標題閃爍 =====
let blinkInterval = null;
const originalTitle = document.title;
function blinkTitle(prefix) {
  if (blinkInterval) return;
  blinkInterval = setInterval(() => {
    document.title = document.title.startsWith(prefix)
      ? originalTitle
      : `${prefix} ${originalTitle}`;
  }, 800);
}
function stopBlinkTitle() {
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
    document.title = originalTitle;
  }
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) stopBlinkTitle();
});

// ===== Windows 桌面通知 =====
function requestDesktopPermission() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function desktopNotify(title, body) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      requireInteraction: true,
      tag: 'huizhou-task-' + Date.now()
    });
  } catch (e) {
    console.warn('桌面通知失敗:', e);
  }
}

// ===== 通知清單 API =====
async function markRead(taskId, eventType) {
  if (!currentUser) return;
  const { error } = await supabase.from('notification_reads').upsert({
    user_id: currentUser.id,
    task_id: taskId,
    event_type: eventType
  }, { onConflict: 'user_id,task_id,event_type' });
  if (error) console.warn('標已讀失敗:', error);
}

async function markAllRead(eventTypes, opts = {}) {
  if (!currentUser) return;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const rows = [];

  // 對每個 event_type 分別用對應的時間欄位查
  // - 'new': 用 created_at（任何狀態的工單）
  // - 'completed': 用 completed_at（只看 status='done'）
  // - 'cancelled': 用 cancelled_at（只看 status='cancelled'）
  for (const evt of eventTypes) {
    let q = supabase.from('tasks').select('id, created_by_user_id, status');
    if (evt === 'new') {
      q = q.gte('created_at', sevenDaysAgo);
    } else if (evt === 'completed') {
      q = q.eq('status', 'done').gte('completed_at', sevenDaysAgo);
    } else if (evt === 'cancelled') {
      q = q.eq('status', 'cancelled').gte('cancelled_at', sevenDaysAgo);
      // 客服端只在乎自己開的單被作廢 — 由呼叫端透過 opts.onlyOwnCancelled 指定
      if (opts.onlyOwnCancelled) q = q.eq('created_by_user_id', currentUser.id);
    } else if (evt === 'comment') {
      // 撈出最近 7 天內有留言的工單，標記為「已讀到現在」
      const { data: recent } = await supabase
        .from('task_comments')
        .select('task_id')
        .gte('created_at', sevenDaysAgo);
      const uniqueTaskIds = [...new Set((recent || []).map(c => c.task_id))];
      uniqueTaskIds.forEach(tid => rows.push({
        user_id: currentUser.id,
        task_id: tid,
        event_type: 'comment'
      }));
      continue;
    } else {
      continue;
    }
    const { data, error } = await q;
    if (error) {
      console.warn('markAllRead 查詢失敗:', error);
      continue;
    }
    if (data) {
      data.forEach(t => rows.push({
        user_id: currentUser.id,
        task_id: t.id,
        event_type: evt
      }));
    }
  }

  if (rows.length === 0) return;
  // upsert 需要 notification_reads 的 UPDATE policy（已在 setup.sql 加入）
  const { error } = await supabase.from('notification_reads').upsert(rows, {
    onConflict: 'user_id,task_id,event_type'
  });
  if (error) console.warn('markAllRead upsert 失敗:', error);
}

// ===== 照片上傳 =====
async function uploadPhotos(files, taskIdForPath) {
  if (!files || files.length === 0) return [];
  const urls = [];
  for (const file of files) {
    const ext = file.name.split('.').pop();
    const safeName = file.name.replace(/[^\w.-]/g, '_');
    const path = `${taskIdForPath}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage
      .from('task-photos')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) {
      throw new Error(`照片「${file.name}」上傳失敗：${error.message}`);
    }
    const { data: pub } = supabase.storage.from('task-photos').getPublicUrl(path);
    urls.push(pub.publicUrl);
  }
  return urls;
}

// ===== Lightbox =====
let lightbox = null;
function openLightbox(url) {
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = '<img>';
    lightbox.addEventListener('click', () => lightbox.classList.remove('open'));
    document.body.appendChild(lightbox);
  }
  lightbox.querySelector('img').src = url;
  lightbox.classList.add('open');
}

// ===== Helpers =====
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '剛剛';
  if (min < 60) return `${min} 分鐘前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小時前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 天前`;
  return formatDateTime(iso);
}

function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth() === now.getMonth() &&
         d.getDate() === now.getDate();
}

function sourceBadgeHtml(source, name) {
  const cls = LOCATION_BADGE_CLASS[source];
  const icon = LOCATION_ICON[source];
  const loc = LOCATION_LABEL[source];
  return `<span class="badge ${cls}">${icon} ${loc} ${escapeHtml(name)}</span>`;
}

function categoryBadgeHtml(cat) {
  const cls = CATEGORY_CLASS[cat] || 'cat-other';
  return `<span class="badge badge-${cls}">${CATEGORY_LABEL[cat] || cat}</span>`;
}

// ===== 通知面板開合 =====
function setupNotifPanelToggle(bellBtn, panel) {
  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !bellBtn.contains(e.target)) {
      panel.classList.remove('open');
    }
  });
}

// ===== 工單對話（task_comments）=====
// 渲染對話區塊（包含 toggle、訊息列表、輸入區）
function renderCommentsSection(task, commentCount = 0) {
  const locked = task.status === 'cancelled';
  const hasComments = commentCount > 0;
  const labelText = hasComments
    ? `對話討論 <span class="comments-count">${commentCount}</span> 則`
    : `<span class="comments-label">點我對話討論</span><span class="comments-hint">— 客服 ⇄ 倉管 可即時互傳訊息與照片</span> <span class="comments-count">0</span>`;
  return `
    <div class="comments-section" data-task-id="${task.id}">
      <button type="button" class="comments-toggle">
        ${labelText}
      </button>
      <div class="comments-body">
        <div class="comment-list">
          <div class="text-muted text-center" style="font-size:12px;padding:8px">載入中...</div>
        </div>
        ${locked ? `
          <div class="comments-locked">🚫 此工單已作廢，無法繼續留言</div>
        ` : `
          <div class="comment-input-row">
            <textarea class="comment-input" placeholder="輸入訊息（Enter 送出，Shift+Enter 換行）" rows="1"></textarea>
            <input type="file" class="comment-photos-input" multiple accept="image/*" hidden>
            <label class="file-label" title="附加照片">📎<span class="file-count"></span></label>
            <button type="button" class="btn btn-accent btn-sm comment-send-btn">送出</button>
          </div>
        `}
      </div>
    </div>
  `;
}

// 取出某些工單的留言數量（一次查多筆）
async function fetchCommentCounts(taskIds) {
  if (!taskIds || taskIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('task_comments')
    .select('task_id')
    .in('task_id', taskIds);
  const counts = new Map();
  if (error) {
    console.warn('fetchCommentCounts 失敗:', error);
    return counts;
  }
  for (const row of data || []) {
    counts.set(row.task_id, (counts.get(row.task_id) || 0) + 1);
  }
  return counts;
}

// 載入單一工單的留言列表
async function loadCommentsForCard(cardEl) {
  const taskId = cardEl.querySelector('.comments-section')?.getAttribute('data-task-id');
  if (!taskId) return;
  const listEl = cardEl.querySelector('.comment-list');
  if (!listEl) return;

  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    listEl.innerHTML = `<div class="text-muted text-center" style="padding:8px;color:var(--urgent)">載入失敗：${escapeHtml(error.message)}</div>`;
    return;
  }
  if (!data || data.length === 0) {
    listEl.innerHTML = '';
    return;
  }
  listEl.innerHTML = data.map(renderCommentBubble).join('');
  listEl.querySelectorAll('img[data-url]').forEach(img => {
    img.addEventListener('click', () => openLightbox(img.getAttribute('data-url')));
  });
  // 捲到底
  listEl.scrollTop = listEl.scrollHeight;
}

function renderCommentBubble(c) {
  const isSelf = currentUser && c.user_id === currentUser.id;
  const photos = (c.photos || []).map(url =>
    `<img src="${escapeHtml(url)}" data-url="${escapeHtml(url)}" alt="留言照片">`
  ).join('');
  const icon = LOCATION_ICON[c.user_location] || '👤';
  const locLabel = LOCATION_LABEL[c.user_location] || '';
  return `
    <div class="comment-bubble bubble-${c.user_location} ${isSelf ? 'is-self' : ''}" data-comment-id="${c.id}">
      <div class="comment-head">
        <span class="comment-author">${icon} ${locLabel} ${escapeHtml(c.user_name)}</span>
        <span>${relativeTime(c.created_at)}</span>
      </div>
      ${c.content ? `<div class="comment-content">${escapeHtml(c.content)}</div>` : ''}
      ${photos ? `<div class="comment-photos">${photos}</div>` : ''}
    </div>
  `;
}

// 送出新留言
async function sendComment(taskId, content, files) {
  if (!currentUser) throw new Error('尚未取得身份');
  content = (content || '').trim();
  if (!content && (!files || files.length === 0)) {
    throw new Error('請輸入文字或附加照片');
  }
  let photoUrls = [];
  if (files && files.length > 0) {
    // 用 task_id/comments 路徑，跟工單照片分開
    photoUrls = await uploadPhotos(files, `${taskId}/comments`);
  }
  const { data, error } = await supabase.from('task_comments').insert({
    task_id: taskId,
    user_id: currentUser.id,
    user_name: currentUser.name,
    user_location: currentUser.location,
    content: content || null,
    photos: photoUrls
  }).select().single();
  if (error) throw error;
  return data;
}

// 綁定對話區的事件（toggle、送出、上傳照片、Enter 送出）
function bindCommentsEvents(cardEl, opts = {}) {
  const section = cardEl.querySelector('.comments-section');
  if (!section) return;

  const toggle = section.querySelector('.comments-toggle');
  const body = section.querySelector('.comments-body');
  const sendBtn = section.querySelector('.comment-send-btn');
  const textarea = section.querySelector('.comment-input');
  const photoInput = section.querySelector('.comment-photos-input');
  const fileLabel = section.querySelector('.file-label');
  const fileCount = section.querySelector('.file-count');

  let loaded = false;

  toggle?.addEventListener('click', async () => {
    body.classList.toggle('open');
    const isOpen = body.classList.contains('open');
    toggle.classList.toggle('is-open', isOpen);
    if (isOpen) {
      if (!loaded) {
        loaded = true;
        await loadCommentsForCard(cardEl);
      }
      // 標記此 task 留言為已讀（清掉 has-unread 樣式 + 同步雲端 + 更新鈴鐺）
      const taskId = section.getAttribute('data-task-id');
      if (currentUser && taskId) {
        toggle.classList.remove('has-unread');
        await markRead(taskId, 'comment');
        if (typeof window.refreshNotifications === 'function') {
          window.refreshNotifications();
        }
      }
    }
  });

  if (photoInput) {
    photoInput.addEventListener('change', () => {
      const n = photoInput.files.length;
      fileCount.textContent = n > 0 ? ` ${n}` : '';
    });
    fileLabel?.addEventListener('click', (e) => {
      e.preventDefault();
      photoInput.click();
    });
  }

  async function doSend() {
    if (!sendBtn || sendBtn.disabled) return;
    const content = textarea.value;
    const files = photoInput.files;
    sendBtn.disabled = true;
    sendBtn.textContent = '送出中...';
    try {
      await sendComment(section.getAttribute('data-task-id'), content, files);
      textarea.value = '';
      photoInput.value = '';
      fileCount.textContent = '';
      // 不在這裡 append — 等 Realtime 推回來統一處理（避免重複）
    } catch (err) {
      alert('送出失敗：' + err.message);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = '送出';
    }
  }

  sendBtn?.addEventListener('click', doSend);

  textarea?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      doSend();
    }
  });

  // 自動展開（例如新留言來時頁面可以叫展開）
  if (opts.autoOpen) {
    toggle?.click();
  }
}

// Realtime 收到新留言時：若該卡片的對話區已展開，append 到列表；無論如何，count +1
function handleIncomingComment(comment, container = document) {
  const card = container.querySelector(`[data-task-id="${comment.task_id}"]`);
  if (!card) return;
  const section = card.querySelector('.comments-section');
  if (!section) return;

  // dedupe — 若已存在不重複
  if (section.querySelector(`[data-comment-id="${comment.id}"]`)) return;

  const countEl = section.querySelector('.comments-count');
  if (countEl) {
    countEl.textContent = String((parseInt(countEl.textContent, 10) || 0) + 1);
  }

  const body = section.querySelector('.comments-body');
  const listEl = section.querySelector('.comment-list');
  const isSelf = currentUser && comment.user_id === currentUser.id;

  // 自己送的訊息：append 並標已讀
  // 其他人送的訊息：append + 若關閉中則 toggle 加 has-unread 樣式
  if (listEl && body.classList.contains('open')) {
    // 清空空狀態文字
    if (listEl.children.length === 1 && listEl.firstElementChild?.classList?.contains('text-muted')) {
      listEl.innerHTML = '';
    }
    listEl.insertAdjacentHTML('beforeend', renderCommentBubble(comment));
    listEl.querySelectorAll('img[data-url]').forEach(img => {
      if (!img._bound) {
        img.addEventListener('click', () => openLightbox(img.getAttribute('data-url')));
        img._bound = true;
      }
    });
    listEl.scrollTop = listEl.scrollHeight;
  } else if (!isSelf) {
    section.querySelector('.comments-toggle')?.classList.add('has-unread');
  }
}

// ===== 預設 onToastClick（頁面可覆寫）=====
window.onToastClick = (taskId) => {
  const el = document.querySelector(`[data-task-id="${taskId}"]`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.transition = 'background 0.3s';
    el.style.background = 'rgba(201,169,97,0.2)';
    setTimeout(() => { el.style.background = ''; }, 1500);
  }
};
