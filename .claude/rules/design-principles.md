# V2 설계 원칙 — 항상 적용

---

## 1. 코드 설계 원칙

1. **Zero-API**: 마케팅 사이트는 외부 API 호출 없음 — 모든 콘텐츠는 `src/data/*.json`에서
2. **프론트 JSON 우선**: 코드 수정 없이 콘텐츠 편집 가능하도록 데이터 분리
3. **DB 최소화**: 마케팅 페이지에서 Supabase 직접 호출 금지
4. **iframe 절대 금지**: 외부 링크는 `window.open()` 팝업 또는 `<a target="_blank">`

---

## 2. UI/UX 원칙

| 항목 | 기준 |
|------|------|
| 테마 | 다크 기본 (`defaultTheme="dark"`, `enableSystem=false`) — LD-001 |
| 폰트 | Pretendard Variable (한글·영문 통합). Anton은 영문 대형 헤딩만 — LD-007 |
| 본문 최소 | 18px (시니어 가독성 — 이하 절대 금지) |
| 터치 최소 | 48×48dp / CTA는 56~64dp |
| 애니메이션 | 장식 모션 금지, `prefers-reduced-motion` 감지 시 즉시 정지 |

---

## 3. CSS 아키텍처 원칙

| 위치 | 용도 | 규칙 |
|------|------|------|
| `src/app/globals.css` | 5개 @import 인덱스만 | 직접 CSS 작성 금지 |
| `src/styles/` | 글로벌 5파일 (base/tokens/animations/layout/components) | 라우트 전용 규칙 금지 |
| `src/styles/pages/` | 라우트 1:1 전용 CSS (landing1~10, about, homepage) | @import 체인 금지 |
| `src/components/**/*.module.css` | 공통 컴포넌트 스코프 격리 | CSS Modules |
| `src/components/**/*.css` | 컴포넌트 동거 글로벌 CSS | 해당 컴포넌트 전용 |

**CSS 위치 결정**: 랜딩 전용 → `pages/landing{N}.css` / 공통 컴포넌트 → `.module.css` / 글로벌 → `styles/components.css`

---

## 3-A. 인라인 style={{ }} — 원칙적 금지

CSS 파일로 표현할 수 없는 **JS 변수·런타임 계산값**만 허용.

```tsx
// ✅ 허용 — JS 변수, 런타임 계산
style={{ color: accentColor, width: `${progress}%`, top: scrollY * 0.5 }}

// ❌ 금지 — 정적 값, CSS 변수 참조
style={{ fontSize: "clamp(28px, 4vw, 48px)", color: "var(--text-primary)" }}

// ❌ 금지 — LD-006 위반 (JS 분기로 glass 결정)
const glassStyle = isDark ? { background: 'rgba(255,255,255,0.06)' } : ...
```

glass 속성은 반드시 클래스 사용:
```tsx
// ✅ className="ld-glass-card"
// ❌ style={{ background: "var(--glass-white)", backdropFilter: "..." }}
```

---

## 4. 테마 용어 정의 — 반드시 준수

> **"다크 테마"** / **"라이트 테마"** = **blob scene + glass 표면**
> 단색 배경(`#010828` solid 등)으로 구현하는 것은 금지.

| 테마 | 베이스 | blob | 표면 |
|------|--------|------|------|
| 다크 | `#010828` | `.lg-bg` + 3 blob (진하게) | `rgba(255,255,255,0.06~0.12)` + blur |
| 라이트 | `#dce8f8` | `.lg-bg` + 3 blob (연하게) | `rgba(255,255,255,0.62~0.90)` + blur |

**절대 금지**: `background: rgba(1,8,40,0.96)` — blob 차단

---

## 5. 콤보 색상 — 포인트 전용 (3곳 이내)

**콤보 강조색 허용**: 주 CTA 버튼 1개, 챕터 뱃지, 특정 텍스트 강조 (span 한정)

**절대 금지**:
- 섹션 배경에 콤보 배경색 지정
- 오버레이·그라디언트에 콤보 색 사용
- glass 카드 배경에 콤보 색 하드코딩
- 모든 카드 테두리·아이콘에 일괄 적용

배경 순서: `var(--bg-base)` → `.lg-bg` blob → `var(--glass-white)` → 콤보 강조색 (포인트만)

---

## 6. ❌ Left Border Accent — 영구 금지

```css
/* ❌ 이 패턴 전면 금지 */
border-left: 4px solid #color;
borderLeft: "4px solid #color";
```

"AI가 만든 티" 1순위 패턴. 카드·박스·인용구 어디에도 사용 불가.

**대체**: Glass card + 강조 배지 + 아이콘 조합 / 배경색 틴트 + rounding

**PR 머지 전 확인**:
```
grep -r "border-left" src/components/landing/
grep -r "borderLeft" src/components/landing/
```
