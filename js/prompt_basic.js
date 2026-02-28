/* ===== Supabase 연동 ===== */
const SUPABASE_URL = 'https://fmjuhbcxkfuilvvdwvix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtanVoYmN4a2Z1aWx2dmR3dml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5Nzc2NDgsImV4cCI6MjA4NzU1MzY0OH0.HppuDhKiqTnXEjSWHneSYXzmPxVFL3HjcUnvOC4uMj4';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_PROMPTS = [
  {
    "id": "tp007",
    "title": "Figma 왕초보 탈출 가이드 (PDF)",
    "category": "디자인 기초",
    "description": "피그마의 핵심 기능을 가장 쉽고 빠르게 익히는 실전 PDF 가이드입니다.",
    "callout": "💡 디자인의 시작, 피그마를 브라우저에서 바로 확인해 보세요.",
    "icon": "🎨",
    "theme": "indigo",
    "image": "",
    "link": "sub_pdf_figma.html",
    "created": 1772210000000
  }
];

/* ===== App State ===== */
const state = {
  prompts: [],
  categories: ['실무 기법', '기초 원리', '고급 기법', '직무특화', 'AI 활용', '디자인 기초'],
  activeCategory: '전체',
  editingId: null,
  detailId: null,
  currentPage: 1,
  itemsPerPage: 12
};

const STORAGE_KEY = 'linkdrop_topics_v7';

async function load() {
  try {
    // 1. Supabase DB에서 데이터 가져오기
    const { data, error } = await supabaseClient
      .from('basic_prompts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      // DB의 created_at을 기존 코드와 호환되도록 created로 매핑
      const dbPrompts = data.map(item => ({
        ...item,
        created: item.created_at
      }));

      // [핵심] DB 데이터와 로컬의 DEFAULT_PROMPTS(샘플)를 합칩니다.
      // 동일한 ID가 있을 경우 DB 데이터를 우선시합니다.
      const localPrompts = DEFAULT_PROMPTS.map(d => Object.assign({}, d));
      const merged = [...dbPrompts];

      localPrompts.forEach(lp => {
        if (!merged.some(dp => dp.id === lp.id)) {
          merged.push(lp);
        }
      });

      state.prompts = merged;
      return;
    }
    
    // 데이터가 없는 경우 로컬 스토리지 또는 기본 데이터 사용
    throw new Error('No data in DB');

  } catch (e) {
    console.warn('DB Load failed, falling back to LocalStorage:', e.message);
    const p = localStorage.getItem(STORAGE_KEY);
    if (p) {
      state.prompts = JSON.parse(p);
    } else {
      state.prompts = DEFAULT_PROMPTS.map(d => Object.assign({}, d));
    }
  }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.prompts));
}

/* ===== Helpers ===== */
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2200);
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function genTags(title, content) {
  const words = (title + ' ' + content).split(/[\s,.\-_/\\:;]+/).filter(w => w.length > 1);
  const stop = new Set(['the', 'a', 'an', 'and', 'or', 'is', 'are', 'of', 'to', 'in', 'for', 'with', 'that', 'this', 'it', 'be', 'as', 'on', 'by', 'at']);
  const freq = {};
  words.forEach(w => {
    const lw = w.toLowerCase();
    if (!stop.has(lw) && lw.length > 1) freq[lw] = (freq[lw] || 0) + 1;
  });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([w]) => '#' + w);
}

/* ===== Render ===== */
function renderCats() {
  const bar = document.getElementById('filterChipBar');
  if (!bar) return;
  const cats = ['전체', ...state.categories];
  bar.innerHTML = cats.map(c => {
    const count = c === '전체'
      ? state.prompts.length
      : state.prompts.filter(p => p.category === c).length;
    if (count === 0 && c !== '전체') return ''; // 콘텐츠 없는 카테고리 숨김
    const isActive = c === state.activeCategory;
    return `<button class="filter-chip ${isActive ? 'active' : ''}" data-cat="${c}">
      ${c} <span class="chip-count">${count}</span>
    </button>`;
  }).join('');
  bar.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeCategory = btn.dataset.cat;
      state.currentPage = 1;
      const title = document.getElementById('mainTitle');
      if (title) title.textContent = btn.dataset.cat === '전체' ? '전체 가이드' : btn.dataset.cat;
      renderCats();
      renderCards();
    });
  });
}

function renderCards() {
  const grid = document.getElementById('cardGrid');
  const pag = document.getElementById('pagination');
  if (!grid) return;
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  let filtered = state.prompts.filter(p => {
    const catOk = state.activeCategory === '전체' || p.category === state.activeCategory;
    const qOk = !query || p.title.toLowerCase().includes(query) || p.usage.toLowerCase().includes(query);
    return catOk && qOk;
  }).sort((a, b) => b.created - a.created);

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state">📭 등록된 주제가 없습니다.</div>';
    if (pag) pag.innerHTML = '';
    return;
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / state.itemsPerPage);
  if (state.currentPage > totalPages) state.currentPage = totalPages || 1;

  const start = (state.currentPage - 1) * state.itemsPerPage;
  const end = start + state.itemsPerPage;
  const paginated = filtered.slice(start, end);

  grid.innerHTML = paginated.map(p => {
    // ── 태그 라벨 색상 매핑 ──
    const tagColorMap = {
      '실무 기법': 'rose',
      '기초 원리': 'blue',
      '고급 기법': 'amber',
      '직무특화': 'green',
      'AI 활용': 'violet'
    };
    const tagColor = tagColorMap[p.category] || 'indigo';

    // ── 비주얼 영역: 이미지 있으면 썸네일, 없으면 그라데이션+이모지 ──
    const visual = p.image
      ? `<div class="bg-image-box">
           <img src="${p.image}" alt="${p.title}" loading="lazy">
           <span class="bg-tag-label ${tagColor}">${p.category}</span>
         </div>`
      : `<div class="bg-image-grad theme-${p.theme || 'indigo'}">
           <span class="bg-image-grad-icon">${p.icon || '📄'}</span>
           <span class="bg-tag-label ${tagColor}">${p.category}</span>
         </div>`;

    // ── 가이드 배지 ──
    const guideBadge = p.link
      ? `<span style="font-size:10px;font-weight:700;color:#3b82f6;">📖 전체 가이드</span>`
      : '';

    const preview = (p.description || '').slice(0, 90) + '...';

    // ── cus-btn 슬라이드 버튼 ──
    const btnLabel = p.link ? '전체 가이드 보기' : '내용 보기';
    const cusBtn = `<div class="cus-btn">
      <span class="cus-btn-parent">
        <span class="cus-btn-slide"></span>
        <span class="btn-text">${btnLabel} →</span>
      </span>
    </div>`;

    return `<div class="bg-card" data-id="${p.id}">
      ${visual}
      <div class="bg-content-box">
        ${guideBadge}
        <div class="bg-card-meta">${new Date(p.created).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        <div class="bg-card-title">${p.title}</div>
        <div class="bg-card-desc">${preview}</div>
        ${cusBtn}
      </div>
    </div>`;
  }).join('');


  if (pag) renderPagination(totalItems);

  grid.querySelectorAll('.bg-card').forEach(el => {
    el.addEventListener('click', e => {
      const id = e.currentTarget.dataset.id;
      const p = state.prompts.find(x => x.id === id);
      if (p && p.link) {
        window.open(p.link, '_blank');
      } else {
        openDetail(id);
      }
    });
  });
}

function renderPagination(totalItems) {
  const pag = document.getElementById('pagination');
  if (!pag) return;
  const totalPages = Math.ceil(totalItems / state.itemsPerPage);
  if (totalPages <= 1) {
    pag.innerHTML = '';
    return;
  }
  let html = '';
  html += `<button class="page-btn" ${state.currentPage === 1 ? 'disabled' : ''} data-page="${state.currentPage - 1}">&lt;</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= state.currentPage - 2 && i <= state.currentPage + 2)) {
      html += `<button class="page-btn ${i === state.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    } else if (i === state.currentPage - 3 || i === state.currentPage + 3) {
      html += `<span style="color:#94a3b8; padding:0 4px">...</span>`;
    }
  }
  html += `<button class="page-btn" ${state.currentPage === totalPages ? 'disabled' : ''} data-page="${state.currentPage + 1}">&gt;</button>`;
  pag.innerHTML = html;
  pag.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentPage = parseInt(btn.dataset.page);
      renderCards();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function render() { renderCats(); renderCards(); }

/* ===== Detail Panel ===== */
function openDetail(id) {
  const p = state.prompts.find(x => x.id === id);
  if (!p) return;

  state.detailId = id;

  // 선택된 카드 하이라이트
  document.querySelectorAll('.prompt-card').forEach(c => c.classList.remove('selected'));
  const selectedCard = document.querySelector(`.prompt-card[data-id="${id}"]`);
  if (selectedCard) selectedCard.classList.add('selected');

  // 카테고리 배지
  document.getElementById('detailCatBadge').textContent = p.category || '';

  // 본문 렌더링
  let html = '';

  // 제목
  html += `<div class="detail-title">${p.title}</div>`;

  // 1. Callout (가이드 전용 요약)
  if (p.callout) {
    html += `<div class="detail-callout">${p.callout}</div>`;
  }

  // 2. 내용 (content) - 박스 제거 및 전체 너비 활용
  if (p.content) {
    html += `
      <div class="detail-section" style="margin-top:20px; font-size:1rem; color:#334155; line-height:1.8; white-space:pre-wrap;">
        ${escapeHtml(p.content)}
      </div>`;
  }

  // 4. 섹션 목록 (sections)
  if (p.sections && p.sections.length > 0) {
    p.sections.forEach(sec => {
      if (sec.type === 'content-box') {
        const items = (sec.content || []).map(li => `<li>${li}</li>`).join('');
        html += `
          <div class="detail-section-item">
            <h4>${sec.title}</h4>
            <ul>${items}</ul>
          </div>`;
      }
    });
  }

  // 5. VS 테이블 (vs_table)
  if (p.vs_table) {
    const beforeItems = p.vs_table.before.items.map(li => `<li>${li}</li>`).join('');
    const afterItems = p.vs_table.after.items.map(li => `<li>${li}</li>`).join('');
    html += `
      <div>
        <div class="detail-section-label">비교</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="detail-section-item">
            <h4>${p.vs_table.before.title}</h4>
            <ul>${beforeItems}</ul>
          </div>
          <div class="detail-section-item">
            <h4>${p.vs_table.after.title}</h4>
            <ul>${afterItems}</ul>
          </div>
        </div>
      </div>`;
  }

  // 설명 (description) fallback
  if (!p.content && (!p.sections || !p.sections.length) && p.description) {
    html += `<div style="font-size:.88rem;color:#475569;line-height:1.7;white-space:pre-wrap;">${p.description}</div>`;
  }

  document.getElementById('detailBody').innerHTML = html;

  // 6. 외부 링크 버튼 (전체 가이드 보기) - 2단계 이동 방식 강화
  const linkArea = document.createElement('div');
  linkArea.className = 'detail-footer';
  linkArea.style.marginTop = '30px';
  linkArea.style.paddingTop = '20px';
  linkArea.style.borderTop = '1px solid #e2e8f0';

  if (p.link) {
    linkArea.innerHTML = `
      <a href="${p.link}" target="_blank" class="btn-save" style="display:flex; align-items:center; justify-content:center; gap:10px; width:100%; text-decoration:none; background:#0f172a; color:white; padding:15px; border-radius:12px; font-weight:bold; font-size:1.1rem; transition:transform 0.2s;">
        📖 전체 가이드 보기 (새 창)
      </a>
      <p style="text-align:center; font-size:0.85rem; color:#64748b; margin-top:10px;">프리미엄 전체 화면 가이드가 새 탭에서 열립니다.</p>`;
  } else {
    // 링크가 없는 경우 일반 프롬프트 복사 버튼 등 추가 가능 (필요 시)
  }
  document.getElementById('detailBody').appendChild(linkArea);

  // 패널 열기
  document.getElementById('detailOverlay').classList.add('open');
  document.getElementById('detailPanel').classList.add('open');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function closeDetail() {
  state.detailId = null;
  document.getElementById('detailOverlay').classList.remove('open');
  document.getElementById('detailPanel').classList.remove('open');
  document.querySelectorAll('.prompt-card').forEach(c => c.classList.remove('selected'));
}

document.getElementById('detailClose').addEventListener('click', closeDetail);
document.getElementById('detailOverlay').addEventListener('click', closeDetail);


/* ===== 외부 클릭 시 패널 닫기 ===== */
document.addEventListener('click', (e) => {
  if (!state.detailId) return;
  const panel = document.getElementById('detailPanel');
  const isInsidePanel = panel.contains(e.target);
  const isInsideCard = e.target.closest('.prompt-card');
  if (!isInsidePanel && !isInsideCard) {
    closeDetail();
  }
});

document.getElementById('detailCopyBtn').addEventListener('click', () => {
  const p = state.prompts.find(x => x.id === state.detailId);
  if (!p) { toast('복사할 내용이 없습니다.'); return; }
  const text = p.content || p.usage || '';
  if (text) {
    navigator.clipboard.writeText(text).then(() => toast('📋 복사 완료!'));
  } else {
    toast('복사할 내용이 없습니다.');
  }
});

/* ===== Search ===== */
document.getElementById('searchInput').addEventListener('input', () => {
  state.currentPage = 1;
  renderCards();
});

/* ===== Init ===== */
load().then(render);
