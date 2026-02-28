(async function () {
    const loader = document.getElementById('loader');
    const contentArea = document.getElementById('content-area');
    const mainContainer = document.getElementById('main-container');

    // 1. Get ID from URL
    const params = new URLSearchParams(window.location.search);
    const contentId = params.get('id');

    if (!contentId) {
        loader.textContent = '❌ 유효한 콘텐츠 ID가 없습니다.';
        return;
    }

    try {
        // 2. Fetch Data (dp* → work_content.json, 그 외 → basic_content.json)
        const jsonFile = contentId.startsWith('dp') ? 'data/work_content.json' : 'data/basic_content.json';
        const response = await fetch(jsonFile);
        if (!response.ok) throw new Error('Data fetch failed');
        const data = await response.json();

        // 3. Find Item
        const item = data.find(p => p.id === contentId);
        if (!item) {
            loader.textContent = '🔍 요청하신 콘텐츠를 찾을 수 없습니다.';
            return;
        }

        // 4. Render
        document.title = `${item.title} - LinkDrop`;
        document.getElementById('title').textContent = item.title;
        document.getElementById('category').textContent = item.category;

        let html = '';

        // 1. Callout (Guide style)
        if (item.callout) {
            html += `
            <div class="callout highlight-blue_background" style="margin-bottom: 2rem;">
                <p>${item.callout}</p>
            </div>`;
        }

        // 2. Usage/Instructions (Optional section)
        if (item.usage) {
            html += `
            <div class="usage-section" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom:0.5rem;">💡 활용 방법</h3>
                <div style="background:#f0f9ff; padding:1rem; border-radius:8px; line-height:1.7; color:#0369a1;">
                    ${item.usage.replace(/\n/g, '<br>')}
                </div>
            </div>`;
        }

        // 3. VS Table (Guide style)
        if (item.vs_table) {
            html += `
            <div class="vs-table" style="margin-bottom: 3rem;">
                <div class="vs-col vs-before">
                    <div class="vs-header">${item.vs_table.before.title}</div>
                    <ul>
                        ${item.vs_table.before.items.map(li => `<li>${li}</li>`).join('')}
                    </ul>
                </div>
                <div class="vs-col vs-after">
                    <div class="vs-header">${item.vs_table.after.title}</div>
                    <ul>
                        ${item.vs_table.after.items.map(li => `<li>${li}</li>`).join('')}
                    </ul>
                </div>
            </div>`;
        }

        // 4. Content (Prompt Box style - Primary for prompt_work)
        if (item.content) {
            html += `
            <div class="prompt-section">
                <h3 style="margin-bottom:0.5rem;">📋 프롬프트 내용</h3>
                <div class="prompt-container" id="prompt-text">${item.content}
                    <div class="copy-badge" onclick="copyPrompt()">복사하기</div>
                </div>
            </div>`;
        }

        // 5. Sections (Guide style - Primary for prompt_basic)
        if (item.sections && item.sections.length > 0) {
            item.sections.forEach(sec => {
                if (sec.type === 'content-box') {
                    html += `
                    <div class="slide" style="margin-top:2rem;">
                        <h3 style="margin-top:0;">${sec.title}</h3>
                        <ul>
                            ${sec.content.map(li => `<li>${li}</li>`).join('')}
                        </ul>
                        ${sec.image ? `<figure><img src="${sec.image}" alt="${sec.title}"></figure>` : ''}
                    </div>`;
                }
            });
        }

        // 6. Description fallback if nothing else exists
        if (!item.content && (!item.sections || item.sections.length === 0) && item.description) {
            html += `
            <div class="slide">
                <div style="white-space: pre-wrap; line-height: 1.8;">${item.description}</div>
            </div>`;
        }

        mainContainer.innerHTML = html;
        loader.style.display = 'none';
        contentArea.style.display = 'block';

    } catch (e) {
        console.error(e);
        loader.textContent = '🛑 데이터를 불러오는 중 오류가 발생했습니다.';
    }
})();

// Global copy function
function copyPrompt() {
    const text = document.getElementById('prompt-text').innerText.replace('복사하기', '').trim();
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    });
}
