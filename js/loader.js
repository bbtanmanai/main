/**
 * loader.js — LinkDrop 공통 헤더·푸터 동적 삽입
 *
 * 사용법:
 *   1. body 안에 <div id="gnb-placeholder"></div> 추가
 *   2. body 안에 <div id="footer-placeholder"></div> 추가
 *   3. <script src="js/loader.js" defer></script> 추가
 *
 * 현재 페이지 파일명을 기준으로 GNB 링크에
 * active(홈 링크) / current(드롭다운 링크) 클래스를 자동으로 적용합니다.
 */

(function () {
    'use strict';

    // ── 현재 페이지 파일명 (예: "prompt_work.html") ──────────────────────
    const currentPage = location.pathname.split('/').pop() || 'index.html';

    // ── components 폴더 경로 (loader.js 위치 기준 상대 경로) ─────────────
    // js/loader.js → ../components/
    const base = (function () {
        const scripts = document.querySelectorAll('script[src*="loader.js"]');
        if (scripts.length) {
            const src = scripts[scripts.length - 1].getAttribute('src');
            return src.replace(/js\/loader\.js.*$/, '');
        }
        return '';
    })();

    /** fetch로 HTML 파편을 가져와 placeholder에 삽입 */
    async function loadComponent(placeholderId, filePath) {
        const placeholder = document.getElementById(placeholderId);
        if (!placeholder) return;

        try {
            // 캐시 방지를 위해 타임스탬프 추가
            const res = await fetch(`${base}${filePath}?v=${new Date().getTime()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const html = await res.text();
            placeholder.outerHTML = html; // placeholder를 컴포넌트로 완전 교체
        } catch (e) {
            console.warn(`[loader.js] ${filePath} 로드 실패:`, e.message);
        }
    }

    /** GNB 링크에 active / current 클래스 적용 */
    function applyActiveClasses() {
        // 1) 홈 링크: .gnb-link[href*="index.html"]
        const homeLink = document.querySelector('.gnb-nav a.gnb-link[href]');
        if (homeLink) {
            if (currentPage === 'index.html' || currentPage === '') {
                homeLink.classList.add('active');
            }
        }

        // 2) data-page 속성이 있는 모든 드롭다운 링크
        document.querySelectorAll('.gnb-dropdown a[data-page]').forEach(a => {
            if (a.dataset.page === currentPage) {
                a.classList.add('current');
            }
        });

        // 3) 홈 링크도 data-page 처리 (gnb 최상위 홈 링크)
        document.querySelectorAll('.gnb-nav > .gnb-item > a.gnb-link[data-page]').forEach(a => {
            if (a.dataset.page === currentPage) {
                a.classList.add('active');
            }
        });
    }

    /** 설정 모달 공통 초기화 (settings-btn이 있는 페이지에서만 동작) */
    function initSettings() {
        const settingsBtn = document.getElementById('settings-btn');
        const modal = document.getElementById('settings-modal');
        const dot = document.getElementById('api-status-dot');
        const keyInput = document.getElementById('api-key-input');
        const closeBtn = document.getElementById('close-settings');
        const saveBtn = document.getElementById('save-settings');

        // settings-modal이 없는 페이지(index.html 등)는 건너뜀
        if (!settingsBtn || !modal) return;

        const maskKey = k => (!k || k.length < 8) ? k : `${k.slice(0, 4)}-${k.slice(-4)}`;
        let apiKey = sessionStorage.getItem('gemini_api_key') || '';

        function setDot(s) {
            if (!dot) return;
            dot.style.background = s === 'valid' ? '#22c55e' : s === 'invalid' ? '#ef4444' : '#64748b';
        }

        async function checkKey(k) {
            if (!k) { setDot('idle'); return; }
            try {
                const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${k}`);
                setDot(r.ok ? 'valid' : 'invalid');
            } catch { setDot('invalid'); }
        }

        settingsBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
            if (keyInput) {
                keyInput.value = apiKey ? maskKey(apiKey) : '';
                if (apiKey) keyInput.dataset.fullKey = apiKey;
            }
        });

        window.settingsKeyBlur = el => {
            el.style.borderColor = 'rgba(255,255,255,.12)';
            const v = el.value.trim();
            if (v && v.length > 20) { el.dataset.fullKey = v; el.value = maskKey(v); }
        };

        if (keyInput) {
            keyInput.addEventListener('focus', () => {
                const f = keyInput.dataset.fullKey;
                if (f && keyInput.value === maskKey(f)) keyInput.value = f;
            });
        }

        if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
        modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                let nk = keyInput ? keyInput.value.trim() : '';
                const f = keyInput ? keyInput.dataset.fullKey : '';
                if (nk === maskKey(f)) nk = f;
                if (nk && nk !== apiKey) {
                    apiKey = nk;
                    sessionStorage.setItem('gemini_api_key', apiKey);
                    checkKey(apiKey);
                } else if (!nk) {
                    apiKey = '';
                    sessionStorage.removeItem('gemini_api_key');
                    setDot('idle');
                }
                modal.style.display = 'none';
                alert('API 설정이 저장됐습니다.');
            });
        }

        if (apiKey) {
            if (keyInput) { keyInput.value = maskKey(apiKey); keyInput.dataset.fullKey = apiKey; }
            checkKey(apiKey);
        } else {
            setDot('idle');
        }
    }

    // ── 실행 ─────────────────────────────────────────────────────────────
    async function init() {
        await Promise.all([
            loadComponent('gnb-placeholder', 'components/gnb.html'),
            loadComponent('footer-placeholder', 'components/footer.html')
        ]);
        applyActiveClasses();
        initSettings();
    }

    // DOM 준비 후 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
