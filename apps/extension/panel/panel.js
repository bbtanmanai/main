// LinkDrop 씬 패널 — panel.js

const API_BASE = 'http://localhost:8000';
const STORAGE_KEY = 'ld_panel_scene_idx';
const IMAGE_CACHE_KEY = 'ld_panel_image_cache';
const TAB_KEY = 'ld_panel_active_tab';
const POLL_INTERVAL = 5000; // 5초마다 자동 갱신

// ── 상태 ─────────────────────────────────────────────────────────────────────
let sessions = { scenes: [], prompts: [] };
let mp4Prompts = [];  // mp4_prompts from session
let activeTab = 'keyframe';
let currentIdx = 0;  // 0-based (두 탭 공유)
let pollTimer = null;

// ── DOM ───────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const statusDot     = $('statusDot');
const statusText    = $('statusText');
const emptyState    = $('emptyState');
const sceneContent  = $('sceneContent');
const sceneNum      = $('sceneNum');
const sceneTotal    = $('sceneTotal');
const sceneSelect   = $('sceneSelect');
const sceneTextEl   = $('sceneText');
const promptTextEl  = $('promptText');
const btnPrev       = $('btnPrev');
const btnNext       = $('btnNext');
const btnCopyPrompt = $('btnCopyPrompt');
const btnRefresh    = $('btnRefresh');
const fileInput     = $('fileInput');
const fileLabel     = $('fileLabel');
const uploadStatus   = $('uploadStatus');
const uploadSceneNum = $('uploadSceneNum');
const lastUpdated    = $('lastUpdated');
const thumbGrid      = $('thumbGrid');
const thumbGridCount = $('thumbGridCount');

// MP4 탭 DOM
const mp4BtnPrev       = $('mp4BtnPrev');
const mp4BtnNext       = $('mp4BtnNext');
const mp4SceneSelect   = $('mp4SceneSelect');
const mp4ThumbGrid     = $('mp4ThumbGrid');
const mp4ThumbGridCount = $('mp4ThumbGridCount');
const mp4FileInput     = $('mp4FileInput');
const mp4FileLabel     = $('mp4FileLabel');
const mp4UploadStatus  = $('mp4UploadStatus');
const mp4UploadSceneNum = $('mp4UploadSceneNum');

// ── 연결 상태 표시 ────────────────────────────────────────────────────────────
function setStatus(state, text) {
  statusDot.className = 'status-dot ' + state;
  statusText.textContent = text;
}

// ── 세션 데이터 로드 ──────────────────────────────────────────────────────────
function abortSignal(ms) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

async function loadSession() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/browser/session`, {
      signal: abortSignal(3000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const scenes  = data.scenes  || [];
    const prompts = data.prompts || [];
    mp4Prompts = data.mp4_prompts || [];

    if (scenes.length === 0) {
      setStatus('no-session', '세션 없음 — 키프레임 페이지에서 실행하세요');
      showEmpty();
      showMp4Empty();
      return;
    }

    // 데이터 변경 감지 (씬 수 변경 시 인덱스 리셋)
    const sizeChanged = scenes.length !== sessions.scenes.length;
    sessions = { scenes, prompts };

    if (sizeChanged) {
      currentIdx = Math.max(0, Math.min(currentIdx, scenes.length - 1));
      rebuildSelects();
    }

    setStatus('connected', `연결됨 · 씬 ${scenes.length}개`);
    renderScene();
    showContent();
    showMp4Content();
    lastUpdated.textContent = '갱신: ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    // 씬 수 변경 or 최초 로드 시만 전체 상태 갱신
    if (sizeChanged || Object.keys(imageStatusCache).length === 0) {
      refreshThumbGrid();
      refreshMp4ThumbGrid();
    } else {
      renderThumbGrid();
      renderMp4ThumbGrid();
    }

  } catch (err) {
    if (sessions.scenes.length > 0) {
      // 이전 데이터 유지 + 경고만
      setStatus('disconnected', '서버 응답 없음 (이전 데이터 표시 중)');
    } else {
      setStatus('disconnected', '서버 연결 실패 — localhost:8000 확인');
      showEmpty();
    }
  }
}

// ── 썸네일 그리드 ─────────────────────────────────────────────────────────────
// 씬별 이미지 상태 캐시 { sceneIdx: true/false }
const imageStatusCache = {};
// 씬별 썸네일 URL 캐시 { sceneIdx: objectURL }
const thumbUrlCache = {};
// 씬별 영상 상태 캐시 { sceneIdx: true/false }
const videoStatusCache = {};

async function checkImageExists(idx) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/browser/images/${idx}`, {
      method: 'HEAD',
      signal: abortSignal(2000),
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

function persistImageCache() {
  chrome.storage.local.set({ [IMAGE_CACHE_KEY]: { ...imageStatusCache } });
}

async function refreshThumbGrid() {
  const { scenes } = sessions;
  if (!scenes.length) { thumbGrid.innerHTML = ''; return; }

  // 캐시 없는 씬만 병렬 확인
  await Promise.all(
    scenes.map(async (_, i) => {
      if (imageStatusCache[i] === undefined) {
        imageStatusCache[i] = await checkImageExists(i);
      }
    })
  );
  persistImageCache();
  renderThumbGrid();
}

async function checkVideoExists(idx) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/browser/video/${idx}`, {
      method: 'HEAD',
      signal: abortSignal(2000),
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

async function refreshMp4ThumbGrid() {
  const { scenes } = sessions;
  if (!scenes.length) { mp4ThumbGrid.innerHTML = ''; return; }

  await Promise.all(
    scenes.map(async (_, i) => {
      if (videoStatusCache[i] === undefined) {
        videoStatusCache[i] = await checkVideoExists(i);
      }
    })
  );
  renderMp4ThumbGrid();
}

function renderMp4ThumbGrid() {
  const { scenes } = sessions;
  if (!scenes.length) return;

  const uploadedCount = Object.values(videoStatusCache).filter(Boolean).length;
  mp4ThumbGridCount.textContent = `${uploadedCount}/${scenes.length} 완료`;
  mp4ThumbGridCount.style.color = uploadedCount === scenes.length ? '#059669' : '#f59e0b';

  mp4ThumbGrid.innerHTML = '';
  scenes.forEach((_, i) => {
    const hasVideo = videoStatusCache[i];
    const slot = document.createElement('div');
    slot.className = 'thumb-slot' +
      (hasVideo ? ' has-image' : '') +
      (i === currentIdx ? ' active' : '');

    if (hasVideo) {
      const icon = document.createElement('span');
      icon.style.cssText = 'font-size:16px;line-height:1;';
      icon.textContent = '▶';
      slot.appendChild(icon);
    } else {
      const plus = document.createElement('span');
      plus.className = 'thumb-slot-empty';
      plus.textContent = '+';
      slot.appendChild(plus);
    }

    const num = document.createElement('span');
    num.className = 'thumb-slot-num';
    num.textContent = i + 1;
    slot.appendChild(num);

    slot.addEventListener('click', () => {
      currentIdx = i;
      renderScene();
      renderMp4ThumbGrid();
    });

    mp4ThumbGrid.appendChild(slot);
  });
}

function renderThumbGrid() {
  const { scenes } = sessions;
  if (!scenes.length) return;

  const uploadedCount = Object.values(imageStatusCache).filter(Boolean).length;
  thumbGridCount.textContent = `${uploadedCount}/${scenes.length} 완료`;
  thumbGridCount.style.color = uploadedCount === scenes.length ? '#059669' : '#f59e0b';

  thumbGrid.innerHTML = '';
  scenes.forEach((_, i) => {
    const hasImage = imageStatusCache[i];
    const slot = document.createElement('div');
    slot.className = 'thumb-slot' +
      (hasImage ? ' has-image' : '') +
      (i === currentIdx ? ' active' : '');

    if (hasImage) {
      const img = document.createElement('img');
      // 캐시된 blob URL 우선 사용, 없으면 서버 URL
      img.src = thumbUrlCache[i] || `${API_BASE}/api/v1/browser/images/${i}?t=${Date.now()}`;
      img.alt = `씬 ${i + 1}`;
      img.onerror = () => {
        imageStatusCache[i] = false;
        slot.classList.remove('has-image');
        slot.innerHTML = '<span class="thumb-slot-empty">+</span>';
        const num = document.createElement('span');
        num.className = 'thumb-slot-num';
        num.textContent = i + 1;
        slot.appendChild(num);
      };
      slot.appendChild(img);
    } else {
      const plus = document.createElement('span');
      plus.className = 'thumb-slot-empty';
      plus.textContent = '+';
      slot.appendChild(plus);
    }

    const num = document.createElement('span');
    num.className = 'thumb-slot-num';
    num.textContent = i + 1;
    slot.appendChild(num);

    slot.addEventListener('click', () => {
      currentIdx = i;
      renderScene();
      renderThumbGrid();
    });

    thumbGrid.appendChild(slot);
  });
}

// ── 씬 렌더링 (두 탭 공통) ───────────────────────────────────────────────────
function renderScene() {
  const { scenes, prompts } = sessions;
  if (!scenes.length) return;

  const idx = currentIdx;
  const rawText = scenes[idx] || '';
  const cleanText = rawText.replace(/\[씬\s*\d+\]/g, '').trim();

  // ── 키프레임 탭 ──
  sceneNum.textContent     = `씬 ${idx + 1}`;
  sceneTotal.textContent   = `/ ${scenes.length}`;
  sceneTextEl.textContent  = cleanText;
  promptTextEl.textContent = prompts[idx] || '(프롬프트 없음)';
  btnPrev.disabled = idx <= 0;
  btnNext.disabled = idx >= scenes.length - 1;
  sceneSelect.value = String(idx);
  if (uploadSceneNum) uploadSceneNum.textContent = String(idx + 1);

  // ── MP4 탭 ──
  $('mp4SceneNum').textContent   = `씬 ${idx + 1}`;
  $('mp4SceneTotal').textContent = `/ ${scenes.length}`;
  $('mp4SceneText').textContent  = cleanText;
  $('mp4PromptText').textContent = mp4Prompts[idx] || '(프롬프트 없음)';
  mp4BtnPrev.disabled = idx <= 0;
  mp4BtnNext.disabled = idx >= scenes.length - 1;
  mp4SceneSelect.value = String(idx);
  if (mp4UploadSceneNum) mp4UploadSceneNum.textContent = String(idx + 1);

  chrome.storage.local.set({ [STORAGE_KEY]: idx });
}

// ── select 드롭다운 재구성 (두 탭 공통) ──────────────────────────────────────
function rebuildSelects() {
  const { scenes } = sessions;
  const makeOptions = (select) => {
    select.innerHTML = '';
    scenes.forEach((text, i) => {
      const clean = text.replace(/\[씬\s*\d+\]/g, '').trim().slice(0, 24);
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `씬 ${i + 1}  ${clean}…`;
      select.appendChild(opt);
    });
  };
  makeOptions(sceneSelect);
  makeOptions(mp4SceneSelect);
}

// ── 표시 전환 ─────────────────────────────────────────────────────────────────
function showEmpty()   { emptyState.style.display = 'flex'; sceneContent.style.display = 'none'; }
function showContent() { emptyState.style.display = 'none'; sceneContent.style.display = 'block'; }

function showMp4Empty()   {
  document.getElementById('mp4EmptyState').style.display = 'flex';
  document.getElementById('mp4Content').style.display = 'none';
}
function showMp4Content() {
  document.getElementById('mp4EmptyState').style.display = 'none';
  document.getElementById('mp4Content').style.display = 'block';
}

// ── 탭 전환 ──────────────────────────────────────────────────────────────────
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.getElementById('tabContentKeyframe').style.display = tab === 'keyframe' ? 'block' : 'none';
  document.getElementById('tabContentMp4').style.display = tab === 'mp4' ? 'block' : 'none';
  chrome.storage.local.set({ [TAB_KEY]: tab });
}

// ── 복사 ─────────────────────────────────────────────────────────────────────
function copyToClipboard(text, btn, label) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✓ 복사됨';
    btn.style.background = '#059669';
    btn.style.borderColor = '#059669';
    setTimeout(() => {
      btn.textContent = label;
      btn.style.background = '';
      btn.style.borderColor = '';
    }, 1500);
  }).catch(err => {
    console.warn('[LinkDrop] 클립보드 복사 실패:', err);
  });
}

// ── 이미지 업로드 ─────────────────────────────────────────────────────────────
function setUploadStatus(type, msg) {
  uploadStatus.className = 'upload-status ' + type;
  uploadStatus.textContent = msg;
}

async function uploadImage(file) {
  const sceneIdx = currentIdx;
  setUploadStatus('loading', `씬 ${sceneIdx + 1} 업로드 중...`);

  try {
    const formData = new FormData();
    formData.append('scene_idx', String(sceneIdx));
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/api/v1/browser/upload-image`, {
      method: 'POST',
      body: formData,
      signal: abortSignal(15000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.success) {
      setUploadStatus('success', `✓ 씬 ${sceneIdx + 1} 업로드 완료`);
      fileInput.value = '';
      fileLabel.textContent = `파일 선택 — 씬 ${currentIdx + 1}에 즉시 업로드`;
      fileLabel.classList.remove('has-file');
      // 썸네일 즉시 갱신 (blob URL 캐시)
      imageStatusCache[sceneIdx] = true;
      thumbUrlCache[sceneIdx] = URL.createObjectURL(file);
      persistImageCache();
      renderThumbGrid();
      setTimeout(() => { uploadStatus.className = 'upload-status'; }, 3000);
    } else {
      throw new Error('서버 응답 오류');
    }
  } catch (err) {
    setUploadStatus('error', `업로드 실패: ${err.message}`);
  }
}

// ── 영상(MP4) 업로드 ─────────────────────────────────────────────────────────
function setMp4UploadStatus(type, msg) {
  mp4UploadStatus.className = 'upload-status ' + type;
  mp4UploadStatus.textContent = msg;
}

async function uploadVideo(file) {
  const sceneIdx = currentIdx;
  setMp4UploadStatus('loading', `씬 ${sceneIdx + 1} 업로드 중...`);

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/api/v1/browser/video/${sceneIdx}`, {
      method: 'POST',
      body: formData,
      signal: abortSignal(30000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.success) {
      setMp4UploadStatus('success', `✓ 씬 ${sceneIdx + 1} 업로드 완료`);
      mp4FileInput.value = '';
      mp4FileLabel.textContent = `파일 선택 — 씬 ${currentIdx + 1}에 즉시 업로드`;
      mp4FileLabel.classList.remove('has-file');
      videoStatusCache[sceneIdx] = true;
      renderMp4ThumbGrid();
      setTimeout(() => { mp4UploadStatus.className = 'upload-status'; }, 3000);
    } else {
      throw new Error('서버 응답 오류');
    }
  } catch (err) {
    setMp4UploadStatus('error', `업로드 실패: ${err.message}`);
  }
}

// ── 폴링 ─────────────────────────────────────────────────────────────────────
function startPolling() {
  stopPolling();
  pollTimer = setInterval(loadSession, POLL_INTERVAL);
}
function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

// ── 이벤트 바인딩 ─────────────────────────────────────────────────────────────
document.getElementById('tabBar').addEventListener('click', e => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  switchTab(btn.dataset.tab);
});

$('btnCopyMp4Prompt').addEventListener('click', () => {
  copyToClipboard(mp4Prompts[currentIdx] || '', $('btnCopyMp4Prompt'), '복사');
});

// MP4 탭 네비게이션
mp4BtnPrev.addEventListener('click', () => {
  if (currentIdx > 0) { currentIdx--; renderScene(); renderMp4ThumbGrid(); renderThumbGrid(); }
});
mp4BtnNext.addEventListener('click', () => {
  if (currentIdx < sessions.scenes.length - 1) { currentIdx++; renderScene(); renderMp4ThumbGrid(); renderThumbGrid(); }
});
mp4SceneSelect.addEventListener('change', e => {
  currentIdx = parseInt(e.target.value, 10);
  renderScene();
  renderMp4ThumbGrid();
  renderThumbGrid();
});
mp4FileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) {
    mp4FileLabel.textContent = file.name;
    mp4FileLabel.classList.add('has-file');
    mp4UploadStatus.className = 'upload-status';
    uploadVideo(file);
  }
});

btnPrev.addEventListener('click', () => {
  if (currentIdx > 0) { currentIdx--; renderScene(); }
});
btnNext.addEventListener('click', () => {
  if (currentIdx < sessions.scenes.length - 1) { currentIdx++; renderScene(); }
});
sceneSelect.addEventListener('change', e => {
  currentIdx = parseInt(e.target.value, 10);
  renderScene();
});
btnCopyPrompt.addEventListener('click', () => {
  copyToClipboard(sessions.prompts[currentIdx] || '', btnCopyPrompt, '복사');
});
btnRefresh.addEventListener('click', () => {
  // 캐시 초기화 → 강제 HEAD 재요청
  Object.keys(imageStatusCache).forEach(k => delete imageStatusCache[k]);
  Object.keys(thumbUrlCache).forEach(k => delete thumbUrlCache[k]);
  Object.keys(videoStatusCache).forEach(k => delete videoStatusCache[k]);
  loadSession();
  startPolling();
});
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) {
    fileLabel.textContent = file.name;
    fileLabel.classList.add('has-file');
    uploadStatus.className = 'upload-status';
    uploadImage(file);
  }
});

// 키보드 단축키: ← → 씬 이동 / Ctrl+C 현재 탭 프롬프트 복사
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowLeft' && currentIdx > 0) {
    currentIdx--; renderScene(); renderThumbGrid(); renderMp4ThumbGrid();
  }
  if (e.key === 'ArrowRight' && currentIdx < sessions.scenes.length - 1) {
    currentIdx++; renderScene(); renderThumbGrid(); renderMp4ThumbGrid();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'c' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    if (activeTab === 'mp4') {
      copyToClipboard(mp4Prompts[currentIdx] || '', $('btnCopyMp4Prompt'), '복사');
    } else {
      copyToClipboard(sessions.prompts[currentIdx] || '', btnCopyPrompt, '복사');
    }
  }
});

// ── 테마 ─────────────────────────────────────────────────────────────────────
const THEME_KEY = 'ld_panel_theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

document.getElementById('themeToggle').addEventListener('click', e => {
  const btn = e.target.closest('.theme-btn');
  if (!btn) return;
  const theme = btn.dataset.theme;
  applyTheme(theme);
  chrome.storage.local.set({ [THEME_KEY]: theme });
});

// ── 초기화 ────────────────────────────────────────────────────────────────────
async function init() {
  // 저장된 테마 복원
  const storedTheme = await chrome.storage.local.get(THEME_KEY);
  applyTheme(storedTheme[THEME_KEY] || 'system');

  // 저장된 탭 복원
  const storedTab = await chrome.storage.local.get(TAB_KEY);
  if (storedTab[TAB_KEY]) switchTab(storedTab[TAB_KEY]);

  // 저장된 씬 인덱스 복원
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  if (stored[STORAGE_KEY] !== undefined) {
    currentIdx = stored[STORAGE_KEY];
  }

  // 이미지 상태 캐시 복원 → 새로고침 후 썸네일 즉시 표시
  const storedCache = await chrome.storage.local.get(IMAGE_CACHE_KEY);
  if (storedCache[IMAGE_CACHE_KEY]) {
    Object.assign(imageStatusCache, storedCache[IMAGE_CACHE_KEY]);
  }

  setStatus('', '연결 확인 중...');
  await loadSession();
  startPolling();
}

init();
