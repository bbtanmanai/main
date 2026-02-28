/* ===== Supabase 연동 ===== */
const SUPABASE_URL = 'https://fmjuhbcxkfuilvvdwvix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtanVoYmN4a2Z1aWx2dmR3dml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5Nzc2NDgsImV4cCI6MjA4NzU1MzY0OH0.HppuDhKiqTnXEjSWHneSYXzmPxVFL3HjcUnvOC4uMj4';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ===== Default Prompts (하드코딩 데이터) ===== */
const DEFAULT_PROMPTS = [
    {
        id: 'dp001',
        title: '기업 재무제표 포렌식 감사',
        category: '생산성',
        link: '',
        created: 1740916030000,
        content: `당신은 시니어 주식 리서치 애널리스트입니다. 모든 재무 지표는 정확한 출처(SEC 공시, 10-Q, 10-K, 실적 발표 자료)와 보고 날짜를 인용하십시오. 수치를 추정하거나 반올림하지 마십시오. 자료가 없는 경우 '공개 보고되지 않음'이라고 명확히 표시하십시오.

[회사명 / 티커]의 최신 재무제표를 분석하십시오.

■ 손익계산서 진단
- 지난 4분기 동안의 정확한 매출 수치 및 전년 대비(YoY) 성장률
- 각 분기별 매출총이익률, 영업이익률, 순이익률
- 마진 궤적: 확장 또는 축소 여부 수치화
- 매출 대비 R&D 비중

■ 재무상태표 강점
- 총자산 vs 총부채
- 유동비율 및 당좌비율
- 현금 및 단기 투자 자산
- 만기 구조를 포함한 총 부채; 자산 대비 영업권 비중(30% 이상 시 표시)

■ 현금흐름 검증
- 영업현금흐름(TTM)
- 자본 지출(TTM)
- 잉여현금흐름(FCF) 및 FCF 마진
- 자본 배분: 자사주 매입, 배당, M&A, 부채 상환, R&D
- YoY 현금흐름 추세

■ 위험 지표
- 매출 성장과 현금흐름의 괴리
- 부채 증가율이 매출 증가율 상회
- 매출채권 증가율이 매출 상회
- 매출 성장 없는 재고자산 축적
- 반복적인 일회성 조정 항목
- 감사인 변경 여부

■ 강점 지표
- 점진적 마진 확장
- 지속적인 FCF 성장
- 부채 감소
- GAAP 이익과 조정 이익의 일치 여부
- 경쟁사 벤치마킹: 상위 3개 경쟁사와의 마진 및 비율 비교표 작성

■ 결론 (쉬운 언어로 해석)
이 회사는 운영적으로 강화되고 있습니까, 아니면 악화되고 있습니까?`,
        usage: `기업의 재무제표를 분석, 감사하는 프롬프트입니다.

[회사명 / 티커] 부분을 수정 후 사용하세요.
상세한 설명은 참조 URL을 클릭하세요.`
    },
];

/* ===== App State ===== */
const state = {
    prompts: [],
    categories: ['콘텐츠제작', '생산성', '마케팅', 'SW개발', '직무특화', '챗봇지침', '교육/학습', '기타'],
    activeCategory: '전체',
    detailId: null,
    currentPage: 1,
    itemsPerPage: 12
};

const STORAGE_KEY = 'linkdrop_prompts_v2';

async function load() {
    try {
        // 1. Supabase DB에서 데이터 가져오기
        const { data, error } = await supabaseClient
            .from('work_prompts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            // DB의 created_at을 기존 코드와 호환되도록 created로 매핑
            state.prompts = data.map(item => ({
                ...item,
                created: item.created_at
            }));
            return;
        }

        // 데이터가 없는 경우 JSON 파일 시도
        const response = await fetch('data/work_content.json');
        if (response.ok) {
            const remoteData = await response.json();
            state.prompts = remoteData;
            return;
        }
    } catch (e) {
        console.warn('DB/JSON load failed, fallback to defaults:', e.message);
    }

    try {
        const p = localStorage.getItem(STORAGE_KEY);
        if (p) {
            state.prompts = JSON.parse(p);
        } else {
            state.prompts = DEFAULT_PROMPTS.map(d => Object.assign({}, d));
        }
    } catch (e) {
        state.prompts = DEFAULT_PROMPTS.map(d => Object.assign({}, d));
    }
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
// ── 카테고리: prompt_basic과 동일한 필터칩 방식 ──
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
            if (title) title.textContent = btn.dataset.cat === '전체' ? '전체 프롬프트' : btn.dataset.cat;
            renderCats();
            renderCards();
        });
    });
}

function renderCards() {
    const grid = document.getElementById('cardGrid');
    const pag = document.getElementById('pagination');
    if (!grid) return;
    const query = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
    let filtered = state.prompts.filter(p => {
        const catOk = state.activeCategory === '전체' || p.category === state.activeCategory;
        const qOk = !query || p.title.toLowerCase().includes(query) || (p.content || '').toLowerCase().includes(query);
        return catOk && qOk;
    }).sort((a, b) => b.created - a.created);

    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state">📭 프롬프트가 없습니다.</div>';
        if (pag) pag.innerHTML = '';
        return;
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    if (state.currentPage > totalPages) state.currentPage = totalPages || 1;

    const start = (state.currentPage - 1) * state.itemsPerPage;
    const paginated = filtered.slice(start, start + state.itemsPerPage);

    // ── 태그 색상 매핑 ──
    const tagColorMap = {
        '콘텐츠제작': 'violet',
        '생산성': 'blue',
        '마케팅': 'rose',
        'SW개발': 'amber',
        '직무특화': 'green',
        '챗봇지침': 'indigo',
        '교육/학습': 'teal',
        '기타': 'gray'
    };

    grid.innerHTML = paginated.map(p => {
        const tagColor = tagColorMap[p.category] || 'indigo';
        const preview = (p.content || '').replace(/[`{}"]/g, ' ').slice(0, 100) + '…';
        const tags = genTags(p.title, p.content || '').map(t => `<span class="tag">${t}</span>`).join('');

        const visual = `<div class="bg-image-grad theme-${p.theme || 'indigo'}">
       <span class="bg-image-grad-icon">${p.icon || '📋'}</span>
       <span class="bg-tag-label ${tagColor}">${p.category}</span>
     </div>`;

        const cusBtn = `<div class="cus-btn">
      <span class="cus-btn-parent">
        <span class="cus-btn-slide"></span>
        <span class="btn-text">내용 보기 →</span>
      </span>
    </div>`;

        return `<div class="bg-card" data-id="${p.id}">
      ${visual}
      <div class="bg-content-box">
        <div class="bg-card-meta">${new Date(p.created).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        <div class="bg-card-title">${p.title}</div>
        <div class="bg-card-desc">${preview}</div>
        ${cusBtn}
      </div>
    </div>`;
    }).join('');

    if (pag) renderPagination(totalItems);

    grid.querySelectorAll('.bg-card').forEach(el => {
        el.addEventListener('click', () => openDetail(el.dataset.id));
    });
}

function renderPagination(totalItems) {
    const pag = document.getElementById('pagination');
    if (!pag) return;
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    if (totalPages <= 1) { pag.innerHTML = ''; return; }

    let html = `<button class="page-btn" ${state.currentPage === 1 ? 'disabled' : ''} data-page="${state.currentPage - 1}">&lt;</button>`;
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

    // 카테고리 배지
    const catBadge = document.getElementById('detailCatBadge');
    if (catBadge) catBadge.textContent = p.category || '';

    // 제목
    const titleEl = document.getElementById('detailTitle');
    if (titleEl) titleEl.textContent = p.title;

    // 프롬프트 내용
    const contentEl = document.getElementById('detailContent');
    if (contentEl) contentEl.textContent = p.content || '';

    // 사용 방법
    const usageWrap = document.getElementById('detailUsageWrap');
    const usageEl = document.getElementById('detailUsage');
    if (usageEl && usageWrap) {
        if (p.usage) {
            usageEl.textContent = p.usage;
            usageWrap.style.display = '';
        } else {
            usageWrap.style.display = 'none';
        }
    }

    // 패널 열기
    document.getElementById('detailOverlay').classList.add('open');
    document.getElementById('detailPanel').classList.add('open');
}

function closeDetail() {
    state.detailId = null;
    document.getElementById('detailOverlay').classList.remove('open');
    document.getElementById('detailPanel').classList.remove('open');
}

document.getElementById('detailClose').addEventListener('click', closeDetail);
document.getElementById('detailOverlay').addEventListener('click', closeDetail);

document.getElementById('detailCopyBtn').addEventListener('click', () => {
    const p = state.prompts.find(x => x.id === state.detailId);
    if (!p) { toast('복사할 내용이 없습니다.'); return; }
    const text = p.content || '';
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
