# V2 설계 원칙 — 항상 적용

> 출처: CLAUDE.md 분리 (2026-05-02)

---

## 1. 코드 설계 원칙

1. **Zero-API**: 마케팅 사이트는 외부 API 호출 없음 — 모든 콘텐츠는 `src/data/*.json`에서
2. **프론트 JSON 우선**: 코드 수정 없이 콘텐츠 편집 가능하도록 데이터 분리
3. **DB 최소화**: 마케팅 페이지에서 Supabase 직접 호출 금지 — 정적 데이터만 사용
4. **iframe 절대 금지**: 외부 링크는 `window.open()` 팝업 또는 `<a target="_blank">`
5. **서킷 브레이커**: 외부 CTA 링크 실패 시 대체 연락처(전화·이메일) 노출

---

## 2. UI/UX 원칙

| 항목 | 기준 | 비고 |
|------|------|------|
| 테마 | 다크 기본 (`defaultTheme="dark"`, `enableSystem=false`) | LD-001 |
| index 페이지 | 디자인·애니메이션 완성도 최우선 | — |
| 폰트 | Pretendard Variable (한글·영문 통합) | Anton은 영문 대형 헤딩만 (LD-007) |
| 본문 최소 | 18px (시니어 가독성 — 이하 절대 금지) | — |
| 터치 최소 | 48×48dp / CTA는 56~64dp | — |
| 애니메이션 | 장식 모션 금지, `prefers-reduced-motion` 감지 시 즉시 정지 | — |

---

## 3. CSS 아키텍처 원칙

| 위치 | 용도 | 규칙 |
|------|------|------|
| `src/app/globals.css` | 5개 @import 인덱스만 | 직접 CSS 작성 금지 |
| `src/styles/` | 글로벌 5파일 (base/tokens/animations/layout/components) | 라우트 전용 규칙 작성 금지 |
| `src/styles/pages/` | 라우트 1:1 전용 CSS (landing1~10, about, homepage) | `@import` 체인 금지, 파일 간 공유 금지 |
| `src/components/**/*.module.css` | 공통 컴포넌트 스코프 격리 | CSS Modules — 라우트 CSS 영향 차단 |
| `src/components/**/*.css` | 컴포넌트 동거 글로벌 CSS | 해당 컴포넌트 전용, pages/ 이동 금지 |

**CSS 신규 작성 판단 기준:**
- 마케팅 랜딩 전용 → `src/styles/pages/landing{N}.css`에만 추가
- 여러 라우트에서 쓰이는 컴포넌트 → `.module.css` (CSS Modules)
- `globals.css`에 직접 추가 → **금지**
- 한 컴포넌트 파일에서만 쓰이는 CSS → 해당 컴포넌트 폴더에 동거

---

## 3-A. 인라인 style={{ }} — 원칙적 금지

> **디자인 관련 CSS 수정은 반드시 해당 라우트·컴포넌트의 전용 CSS 파일 1개에서만 한다.**
> TSX 파일에서 `style={{ }}` 로 디자인을 수정하는 것은 원칙적으로 금지한다.

### 유일한 허용 예외 — JS 런타임 동적 값

CSS 파일로 표현할 수 없는 **JS 변수·런타임 계산값**만 허용한다.

```tsx
// ✅ 허용 — props로 받은 JS 변수
style={{ color: accentColor, width: `${progress}%` }}

// ✅ 허용 — scroll·resize 등 런타임 계산
style={{ top: scrollY * 0.5 }}

// ❌ 금지 — 정적 값은 CSS 파일로
style={{ fontSize: "clamp(28px, 4vw, 48px)", padding: "32px 24px" }}

// ❌ 금지 — CSS 변수 참조도 CSS 파일로
style={{ color: "var(--text-primary)", background: "var(--glass-white)" }}

// ❌ 금지 — LD-006 위반 (JS 분기로 glass 스타일 결정)
const glassStyle = isDark ? { background: 'rgba(255,255,255,0.06)' } : { background: 'rgba(255,255,255,0.62)' };
```

### CSS 수정 위치 결정 흐름

```
디자인 수정 요청
  ↓
이 라우트 전용인가?
  ├─ YES → src/styles/pages/landing{N}.css  (또는 homepage.css, about.css)
  └─ NO (여러 라우트 공통)
       ↓
       컴포넌트 전용인가?
         ├─ YES → src/components/{컴포넌트}/*.css  (또는 .module.css)
         └─ NO (글로벌 패턴)
              ↓
              src/styles/components.css  (또는 layout.css)
```

### glass 속성은 반드시 클래스 사용

```tsx
// ❌ 금지 — glass 속성 인라인
style={{ background: "var(--glass-white)", backdropFilter: "var(--blur-sm)", border: "1px solid var(--glass-border)" }}

// ✅ 필수 — 전용 클래스 사용
className="ld-glass-card"
className="ld-glass-card ld-glass-card-md"  // 더 불투명한 경우
```

---

## 5. 테마 용어 정의 — 반드시 준수

> 사용자가 **"다크 테마"** 또는 **"라이트 테마"**라고 할 때 = **blob scene + glass 표면**을 의미한다.
> **단색 배경(`#010828`, `rgba(1,8,40,0.96)` 등)으로 구현하는 것은 금지.**
> 사용자가 단색이 필요한 경우 반드시 **"단색배경"**이라는 용어를 직접 사용한다.

| 테마 | 베이스 배경 | blob | 표면 처리 |
|------|------------|------|---------|
| **다크** | `#010828` body | `.lg-bg` + 3 blob (청록·보라·앰버, 진하게) | `rgba(255,255,255,0.06~0.12)` + `backdrop-filter: blur` |
| **라이트** | `#dce8f8` body | `.lg-bg` + 3 blob (청록·보라·앰버, 연하게) | `rgba(255,255,255,0.62~0.90)` + `backdrop-filter: blur` |

```tsx
// ✅ 다크/라이트 테마 — 항상 이 구조
<div className="lg-bg" style={{ position: 'fixed' }}>
  <div className="lg-blob lg-blob-1" />
  <div className="lg-blob lg-blob-2" />
  <div className="lg-blob lg-blob-3" />
</div>
// 표면: glass (--glass-white 토큰)

// ❌ 절대 금지 — 단색 배경으로 blob을 덮는 행위
background: 'rgba(1,8,40,0.96)'   // 96% 불투명 → blob 완전 차단
background: '#010828'              // solid
```

---

## 6. 콤보 색상 사용 원칙 — 포인트 전용

각 랜딩페이지에 배정된 콤보 색상(배경색 + 강조색)은 **포인트 개념으로만** 사용한다.

### 절대 금지

| 금지 항목 | 이유 |
|-----------|------|
| 섹션 배경에 콤보 배경색 직접 지정 | DESIGN.md §5 위반 (단색 배경 금지) |
| 오버레이·그라디언트에 콤보 배경색 사용 | 라이트 테마 전환 시 붕괴 |
| 이미지 캡션 그라디언트에 콤보 색 사용 | `rgba(0,0,0,0.72)` 중립만 허용 |
| glass 카드 배경에 콤보 색 하드코딩 | CSS 변수(`var(--glass-white)`) 위반 |
| 콤보 강조색을 모든 카드 테두리·텍스트에 범용 적용 | 포인트 효과 소멸 |

### 콤보 배경색 허용 범위 (좁음)

```
✅ 작은 뱃지 배경 (인라인 블록 한정)
✅ 테이블 헤더 배경 (대신 var(--bg-surface) 우선 검토)
❌ section background
❌ 오버레이 배경
❌ glass 카드 베이스
❌ border-left accent — 절대 금지 (§7 참조)
```

### 콤보 강조색 허용 범위 (포인트 3곳 이내)

```
✅ 주 CTA 버튼 1개 background
✅ 챕터/섹션 뱃지 background
✅ 특정 단어·수치 텍스트 강조 (span 한정)
✅ border-left accent (선택)
❌ 섹션 전체 링크 색상
❌ 이미지 캡션 전체 색상
❌ 모든 아이콘·번호 색상
❌ 카드 테두리 전체에 일괄 적용
```

### 배경은 항상 이 순서

```
1. var(--bg-base)           — 전역 CSS 변수 (테마 자동 전환)
2. .lg-bg + .lg-blob-1/2/3  — blob scene 합성 (DESIGN.md §5)
3. var(--glass-white)       — glass 카드 표면 (CSS 변수)
4. 콤보 강조색              — 포인트 요소만 (3곳 이내)
```

---

## 7. ❌ Left Border Accent — 링크드랍 영구 금지

> **"가장 AI스럽다"고 사용자들이 기피하는 1순위 디자인 패턴.**
> 링크드랍의 모든 UI에서 절대 사용하지 않는다.

### 정의

```css
/* ❌ 이 패턴 전면 금지 */
border-left: 4px solid #FB3640;
border-left: 3px solid var(--accent-aqua);
borderLeft: "4px solid #color";
```

카드·박스·인용구·알림·팁 박스 등 어떤 컴포넌트에도 사용 불가.

### 왜 금지인가

- ChatGPT·Claude·Notion AI 등이 생성한 문서·UI에서 반복되어 **"AI가 만든 티"** 의 대표 징표가 됨
- 사용자 리서치에서 **"밋밋하다", "어디서 많이 본 것 같다"** 반응 1위
- 디자인 개성이 전혀 없는 **기본값 패턴** — 링크드랍 프리미엄 이미지와 충돌

### 대체 방법

| 목적 | Left Border 대신 사용할 것 |
|------|--------------------------|
| 정보 강조 카드 | Glass card + 강조색 배지(뱃지) + 아이콘 조합 |
| 인용구·팁 박스 | 배경색 틴트(`rgba`) + 모서리 rounding |
| 섹션 구분 | 수평 구분선 또는 여백(spacing)으로 해결 |
| 상태 표시 | 색상 dot · 뱃지 · 아이콘으로 대체 |

### 코드 리뷰 체크리스트

PR 머지 전 반드시 확인:
```
grep -r "border-left" src/components/landing/
grep -r "borderLeft" src/components/landing/
```
매칭 결과가 있으면 반드시 제거 후 머지.

---

## 4. V3 참조 규칙

- `C:\LinkDropV3` 파일은 **Read만 허용** (설계 참고용)
- V3 코드 수정·V3 모듈 import 절대 금지 (LD-003)
- V3 LOCKED_DECISIONS(LD-001~016)는 V2와 무관 — 참조 금지
