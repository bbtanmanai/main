# LinkDrop V2 — 디자인 시스템

> **원칙**: 결정 사항과 토큰 값만 기록한다. CSS 구현은 `apps/web/src/app/globals.css` + `cinematic.css` 참조.
> 🔒 잠금 결정과 연동: LD-001 (다크 기본), LD-006 (ld-glass 단일 클래스), LD-007 (폰트).

---

## ⚠️ 테마 용어 정의 — 반드시 먼저 읽을 것

> 사용자가 **"다크 테마"** 또는 **"라이트 테마"**라고 할 때 = **blob scene + glass 표면**을 의미한다.
> **절대로 단색 배경(`#010828`, `rgba(1,8,40,0.96)` 등)으로 구현하지 말 것.**
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

---

## 1. 철학

- **Liquid Glass** — `backdrop-filter blur` 기반 반투명 유리 질감, CSS 변수 하나로 다크/라이트 전환
- **Dark-first** — `defaultTheme="dark"`, `enableSystem=false` (🔒 LD-001 잠금)
- **Springy motion** — `cubic-bezier(0.34, 1.2~1.56, 0.64, 1)` 탄성 easing 사용
- **Accessibility** — `prefers-reduced-motion` 완전 지원 (0.01ms 강제) / WCAG AA 대비 보장
- **Zero JS for glass** — glass 스타일 분기는 CSS 변수로만, JS 조건문 금지 (🔒 LD-006)
- 1개의 페이지는 1개의 콤보 색상을 갖는다
1. #0D0D0D - #00F5FF
2. #2B2D6E - #CDB4FF
3. #1C1C1C - #FF6A00
4. #0A1F44 - #D6F0FF
5. #FD802E - #233D4C
6. #CCDA47 - #0A3625
7. #000F08 - #FB3640
8. #222222 - #89E900
9. #2A2A2A - #CFFF04
10.  #5A0F2E - #F1E9E4

---

## 2. 브랜드 색상 토큰

### Tailwind `@theme` 등록값

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-neon` | `#6fff00` | 주 CTA / 강조색 (Tailwind: `text-neon`, `bg-neon`) |
| `--color-neon-dim` | `rgba(111,255,0,0.15)` | 네온 배경 틴트 |
| `--color-deep-navy` | `#010828` | 페이지 기본 배경 |
| `--color-surface-dark` | `#0a1540` | 카드/패널 표면 (다크) |
| `--color-cream` | `#eff4ff` | 라이트 텍스트 / 라이트 배경 |
| `--color-cream-dim` | `#8899cc` | 보조 텍스트 (라이트 톤) |

### 다크 테마 CSS 변수 (기본)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--bg-base` | `#010828` | 페이지 배경 |
| `--bg-surface` | `#0a1540` | 카드/패널 표면 |
| `--text-primary` | `#eff4ff` | 본문 텍스트 |
| `--text-secondary` | `#8899cc` | 보조 텍스트 |
| `--accent-neon` | `#6fff00` | 네온 그린 강조 |
| `--accent-neon-dim` | `rgba(111,255,0,0.15)` | 네온 배경 틴트 |
| `--accent-aqua` | `#22d3ee` | 청록 강조 |
| `--accent-amber` | `#fbbf24` | 주의/날짜 강조 |
| `--accent-rose` | `#fb7185` | 경고/삭제 |
| `--accent-lime` | `#a3e635` | 성공/완료 |

### 라이트 테마 CSS 변수 (`[data-theme="light"]`)

| 토큰 | 값 |
|------|-----|
| `--bg-base` | `#dce8f8` |
| `--bg-surface` | `#eef2ff` |
| `--text-primary` | `#0b1b3b` |
| `--text-secondary` | `#4a5a80` |
| `--accent-neon` | `#3aa800` (WCAG AA 보장) |
| `--accent-aqua` | `#0891b2` |
| `--accent-amber` | `#d97706` |
| `--accent-rose` | `#e11d48` |
| `--accent-lime` | `#65a30d` |

---

## 3. 유리 (Glass) 토큰

### glass-white (표면 배경)

| 토큰 | 다크 | 라이트 |
|------|------|--------|
| `--glass-white` | `rgba(255,255,255,0.12)` | `rgba(255,255,255,0.62)` |
| `--glass-white-md` | `rgba(255,255,255,0.20)` | `rgba(255,255,255,0.78)` |
| `--glass-white-lg` | `rgba(255,255,255,0.30)` | `rgba(255,255,255,0.90)` |

### glass-border (테두리)

| 토큰 | 다크 | 라이트 |
|------|------|--------|
| `--glass-border` | `rgba(255,255,255,0.25)` | `rgba(15,23,42,0.14)` |
| `--glass-border-subtle` | `rgba(255,255,255,0.12)` | `rgba(15,23,42,0.09)` |
| `--glass-border-bright` | `rgba(255,255,255,0.50)` | `rgba(15,23,42,0.22)` |

### blur / shadow

| 토큰 | 값 |
|------|-----|
| `--blur-sm` | `blur(8px)` |
| `--blur-md` | `blur(18px)` |
| `--blur-lg` | `blur(32px)` |
| `--shadow-glass` (dark) | `0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.3)` |
| `--shadow-float` (dark) | `0 20px 60px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)` |
| `--glass-blur` (다크) | `4px` (saturate 100%) |
| `--glass-blur` (라이트) | `10px` (saturate 140%) |

---

## 4. CSS 유리 클래스

| 클래스 | 용도 | 주의 |
|--------|------|------|
| `.ld-glass` | 마케팅 페이지 글래스 (🔒 LD-006) | JS 분기 없이 CSS 변수만으로 테마 전환 |
| `.glass` | 인증/회원/관리자 영역 카드 | `glass-card`, `glass-content` 조합 |
| `.lg-card` | 앱 Shell glass 카드 | `lg-bg` blob scene 위 |
| `.ld-surface-card` | 대시보드/패널 카드 | 다크: glass / 라이트: solid surface |
| `.lg-header` | 앱 Shell 헤더 | `rgba(255,255,255,0.04)` + blur 20px |
| `.lg-sidebar-glass` | 앱 Shell 사이드바 | |
| `.lg-tabbar-glass` | 모바일 탭바 | |

---

## 5. 배경 Blob Scene (`.lg-bg`)

배경은 **베이스 단색 + 3개 Blob 레이어** 합성이다. 단색만 쓰면 안 됨.

| 클래스 | 그라디언트 | 크기 | 위치 | 용도 |
|--------|-----------|------|------|------|
| `lg-blob-1` | `rgba(94,231,223,0.55) → rgba(59,130,246,0.45)` | 700px | 좌상단 (-180, -140) | cyan-blue |
| `lg-blob-2` | `rgba(180,144,245,0.50) → rgba(236,72,153,0.40)` | 600px | 우하단 (-180, -100) | violet-pink |
| `lg-blob-3` | `rgba(255,180,50,0.32) → rgba(247,168,196,0.28)` | 400px | 중앙 (40%, 50%) | amber-rose |

- `animation: blob-drift 18s ease-in-out infinite` (지연: -6s / -12s)
- `filter: blur(80px)`, `border-radius: 50%`
- 라이트 테마: 그라디언트 rgba 값을 소폭 감소 (0.48 / 0.45 / 0.25)
- `prefers-reduced-motion`: animation none

---

## 6. 타이포그래피 (🔒 LD-007)

| 폰트 | 용도 | 규칙 |
|------|------|------|
| `Pretendard Variable` | **한글·영문·숫자 전체 통합** (본문, UI) | weight 400–900 |
| `Anton` | **영문 대형 헤딩 전용** | 한글에 절대 금지 |
| `Condiment` | 커시브 액센트 (장식) | |
| `Montserrat` | 보조 영문 | |
| `SeoulAlrimHeavy` / `NanumKalguksu` | 특수 용도 디자인 | |

> 기본 sans: Pretendard Variable — 디자인 페이지는 인라인 스타일로 개별 지정
> 본문 최소 18px (시니어 가독성, 이하 절대 금지)

---

## 7. 반경 (Radius) 토큰

| 토큰 | 값 |
|------|-----|
| `--radius-xs` | `6px` |
| `--radius-sm` | `10px` |
| `--radius-md` | `14px` |
| `--radius-lg` | `20px` |
| `--radius-xl` | `24px` |
| `--radius-full` | `9999px` |

---

## 8. 스페이싱 토큰

| 토큰 | 값 |
|------|-----|
| `--space-xs` | `8px` |
| `--space-sm` | `12px` |
| `--space-md` | `16px` |
| `--space-lg` | `24px` |
| `--space-xl` | `32px` |

---

## 9. 모션 토큰

### Easing

| 토큰 | 곡선 | 성격 |
|------|------|------|
| `--ease-liquid` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 오버슈트 탄성 (액체감) |
| `--ease-glass` | `cubic-bezier(0.22, 0.68, 0, 1.2)` | 약한 탄성 |
| GNB pill | `cubic-bezier(0.34, 1.2, 0.64, 1)` | 스프링 |

**Duration**: `--dur-fast: 180ms` / `--dur-mid: 360ms`

### 주요 애니메이션

| 이름 | 설명 |
|------|------|
| `blob-drift` | Blob 배경 유영 (18s) |
| `countup-fade` | 숫자 카운트업 등장 (0.6s) |
| `scroll-bounce` | 스크롤 인디케이터 (1.8s loop) |
| `condiment-fadein` | Condiment 텍스트 letter-spacing 전개 (1.2s) |
| `ld-slide-up` | 모달/바텀시트 등장 (220–260ms) |
| `ld-stepper-pulse` | LdStatusStepper 활성 상태 펄스 |
| `progress-grow` | 프로그레스 바 채우기 (1.2s spring) |
| `pulse-badge` | 뱃지 dot 펄스 (2s loop) |

---

## 10. GNB Liquid Nav 토큰 (`--lnav-*`)

### 다크 기본

| 토큰 | 값 |
|------|-----|
| `--lnav-glass-bg` | `rgba(127,167,182,0.5)` |
| `--lnav-glass-border` | `rgba(255,255,255,0.15)` |
| `--lnav-pill-bg` | `rgba(255,255,255,0.22)` |
| `--lnav-icon-color` | `#dddddd` |
| `--lnav-icon-active` | `#ffffff` |

### 라이트 오버라이드

| 토큰 | 값 |
|------|-----|
| `--lnav-glass-bg` | `rgba(255,255,255,0.15)` |
| `--lnav-pill-bg` | `rgba(255,255,255,0.7)` |
| `--lnav-icon-color` | `#222222` |
| `--lnav-icon-active` | `rgba(0,0,0,0.95)` |

### isDarkHero 페이지 (GNB 다크 유리 강제)

`landing1`, `landing7` — `LdCommonGnb.tsx`에서 `isDarkHero` 분기로 별도 인라인 변수 주입.
다른 페이지 추가 시 `isDarkHero` 조건에 pathname 추가 필요.

---

## 11. 시네마틱 랜딩 시스템 (`cinematic.css`)

| 클래스 | 역할 |
|--------|------|
| `.ld-cine-section` | 전체 높이(100lvh) 비디오 히어로 컨테이너 |
| `.ld-cine-video-bg` | `position: absolute; inset: 0; z-index: 0` |
| `.ld-cine-vignette` | 방사형 어둠 비네트 오버레이 |
| `.ld-cine-content` | 콘텐츠 레이어 (z-index 2, max-width 1400px) |
| `.ld-cine-heading` | `clamp(3rem, 8vw, 7.5rem)`, weight 900, color #ffffff |
| `.ld-cine-btn` | 시네마틱 CTA 버튼 |

비디오 소스: Mux HLS (`LdCinematicVideoBg` 컴포넌트, `playbackId` prop)

---

## 12. LdStatusStepper 색상 (🔒 LD-004)

| 상태 | 색상 | 값 |
|------|------|-----|
| 완료 (success) | emerald | `#10b981` |
| 진행중 (active) | indigo | `#6366f1` |
| 대기 (pending) | yellow | `#eab308` |
| 오류 (error) | red | `#ef4444` |

이 4색 이외의 상태 색상 추가 금지.

---

## 13. Z-index 계층

| 계층 | 값 | 예시 |
|------|-----|------|
| base | `0` | 배경, blob scene |
| content | `1–5` | glass ::before 반사 레이어 |
| raised | `10` | GNB liquid-nav |
| drawer-overlay | `88` | 햄버거 드로어 오버레이 |
| drawer-panel | `89` | 햄버거 드로어 패널 |
| modal | `200` | 인증 모달/바텀시트 오버레이 |

---

## 14. 접근성 규칙

- `prefers-reduced-motion`: 모든 transition/animation → `0.01ms, iteration 1` 강제 비활성
- `backdrop-filter` 미지원 폴백: `.glass` → `rgba(20,25,45,0.88)` solid
- 라이트 테마 accent: WCAG AA 충족을 위해 다크 테마보다 어둡게 조정
- 터치 최소: `48×48dp` (`.ld-touch`), CTA 최소: `56px` (`.ld-cta-target`)

---

## 15. 혼합 레이아웃 (Hybrid Layout)

> **정의**: 사이드바는 다크 테마, 메인 콘텐츠는 라이트 테마인 좌우 분할 레이아웃.

### 왜 blob scene을 쓸 수 없는가

blob scene은 `position: fixed; z-index: 0`으로 **전역 단일 opacity**를 가진다.
라이트 테마에서 blob opacity를 낮추려면 `[data-theme="light"]`를 전체 페이지에 적용해야 하는데,
사이드바(다크)가 같은 페이지에 공존하므로 **부분 적용 불가**.

### 혼합 레이아웃 라이트 영역 구현 규칙

| 항목 | 금지 | 허용 |
|------|------|------|
| 메인 배경 | `backdropFilter` + 반투명 rgba — 다크 blob이 회색 블러로 변질 | 정적 `radial-gradient` CSS |
| 베이스색 | `#e8f0fa` solid 단색만 사용 — blob 없이 평평하게 보임 | `#f0f4ff` + radial-gradient 합성 |
| 카드 | `backdropFilter` + 이중 투명 — 회색 이중 배경 발생 | `rgba(255,255,255,0.48~0.60)` border/shadow만 |

### 라이트 영역 기준 그래디언트

blob-1(cyan-blue) / blob-2(violet-pink) / blob-3(rose)의 위치·색을 CSS로 수동 재현:

```
radial-gradient(ellipse at 10% 65%,  rgba(180,144,245,0.45) → transparent)  ← violet
radial-gradient(ellipse at 92% 12%,  rgba(94,231,223,0.35)  → transparent)  ← cyan
radial-gradient(ellipse at 52% 98%,  rgba(247,168,196,0.22) → transparent)  ← rose
#f0f4ff  ← 베이스 (불투명)
```

### 전체 페이지 라이트 테마 전환 시 (미래)

페이지 전체가 라이트일 때는 blob scene 방식으로 돌아간다:
- `[data-theme="light"] .lg-blob { opacity: 0.30 }`
- 메인 배경: `rgba(232,240,250,0.60)` + `backdropFilter: blur(48px)`
- 정적 radial-gradient 제거

---

## 16. 랜딩 vs 앱 영역 구분

| 영역 | 배경 | Glass 클래스 | 폰트 지정 방식 |
|------|------|-------------|--------------|
| 마케팅 랜딩 (`/landing/*`) | `var(--bg-base)` + `.lg-bg` blob scene | `.ld-glass` | 인라인 스타일 개별 지정 |
| 앱 Shell (member/partner/admin) | `.lg-bg` + `.lg-blob` | `.lg-card`, `.lg-header` | Pretendard 기본 (body) |
| 인증 (auth) | `.lg-bg` blob | `.glass.glass-card` | Pretendard 기본 |

---

## 17. 동영상 배경 섹션 — 라이트 테마 대비 규칙

`.ld-cine-section` (시네마틱 비디오 커버)은 **테마와 완전히 독립된 레이어**여야 한다.

```css
/* cinematic.css — 확정 규칙 */
.ld-cine-section {
  background: #000000; /* 라이트/다크 무관 항상 어둠. 전역 bg-base 차단. */
}
```

**이유**: 동영상 로드 전·실패 시 전역 `--bg-base`(라이트: `#dce8f8`)가 그대로 비침.
`position: relative + overflow: hidden` 만으로는 배경색 차단 불가.
`#000000`은 중립 어둠 — 어떤 테마·어떤 콤보 색상과도 충돌 없음.

**오버레이 규칙**: 커버 섹션 반투명 오버레이는 반드시 중립 어둠 사용.
```
✅ rgba(0,0,0,0.45)     — 중립 어둠 오버레이
❌ rgba(90,15,46,0.45)  — 콤보 색상 오버레이 금지
```

---

## 18. 콤보 색상 사용 원칙 — 포인트 전용

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
✅ border-left: 4px solid {콤보배경색}   — accent 바
✅ 작은 뱃지 배경 (인라인 블록 한정)
✅ 테이블 헤더 배경 (대신 var(--bg-surface) 우선 검토)
❌ section background
❌ 오버레이 배경
❌ glass 카드 베이스
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
