// ===========================================================
// 匯洲工單系統 - 共用工具
// ===========================================================

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
  other: '其他'
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

async function markAllRead(eventTypes) {
  if (!currentUser) return;
  // 撈出 7 天內可能未讀的 task
  let q = supabase.from('tasks').select('id, status, created_at, completed_at, cancelled_at')
    .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString());
  const { data: tasks } = await q;
  if (!tasks) return;

  const rows = [];
  for (const t of tasks) {
    if (eventTypes.includes('new')) {
      rows.push({ user_id: currentUser.id, task_id: t.id, event_type: 'new' });
    }
    if (eventTypes.includes('completed') && t.status === 'done') {
      rows.push({ user_id: currentUser.id, task_id: t.id, event_type: 'completed' });
    }
    if (eventTypes.includes('cancelled') && t.status === 'cancelled') {
      rows.push({ user_id: currentUser.id, task_id: t.id, event_type: 'cancelled' });
    }
  }
  if (rows.length === 0) return;
  await supabase.from('notification_reads').upsert(rows, {
    onConflict: 'user_id,task_id,event_type'
  });
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
  return `<span class="badge badge-category">${CATEGORY_LABEL[cat] || cat}</span>`;
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
