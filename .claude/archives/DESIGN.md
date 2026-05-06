# LinkDrop V2 — 디자인 시스템

> 토큰 실제 값: `src/styles/tokens.css` 참조. 이 파일은 토큰 명칭·역할·행동 규칙만 기록.
> 🔒 연동: LD-001 (다크 기본), LD-006 (ld-glass 단일 클래스), LD-007 (폰트).

---

## 1. 철학

- **Liquid Glass** — `backdrop-filter blur` 기반 반투명 유리 질감, CSS 변수로 다크/라이트 자동 전환
- **Dark-first** — `defaultTheme="dark"`, `enableSystem=false` (🔒 LD-001)
- **Springy motion** — 탄성 easing `cubic-bezier(0.34, 1.2~1.56, 0.64, 1)` 사용
- **Zero JS for glass** — glass 스타일 분기는 CSS 변수로만, JS 조건문 금지 (🔒 LD-006)

---

## 2. 브랜드 색상 토큰

| 토큰 | 다크 | 라이트 | 용도 |
|------|------|--------|------|
| `--bg-base` | `#010828` | `#dce8f8` | 페이지 배경 |
| `--bg-surface` | `#0a1540` | `#eef2ff` | 카드/패널 표면 |
| `--text-primary` | `#eff4ff` | `#0b1b3b` | 본문 텍스트 |
| `--text-secondary` | `#8899cc` | `#4a5a80` | 보조 텍스트 |
| `--accent-neon` | `#6fff00` | `#3aa800` | 주 CTA·강조 (WCAG AA) |
| `--accent-aqua` | `#22d3ee` | `#0891b2` | 청록 강조 |
| `--accent-amber` | `#fbbf24` | `#d97706` | 주의/날짜 |
| `--accent-rose` | `#fb7185` | `#e11d48` | 경고/삭제 |

Tailwind 직접 사용: `text-neon`, `bg-neon` (`--color-neon: #6fff00`)

### --color-text 계열 (CSS 파일 전용)

TSX 인라인 스타일에서는 `--text-primary` / `--text-secondary` 사용.
CSS 파일(Guide·landing·homepage)에서는 `--color-text` 계열 사용.

| 토큰 | 용도 |
|------|------|
| `--color-text` | glass 표면 위 주 텍스트 |
| `--color-text-muted` | 보조 설명·캡션 |
| `--color-text-subtle` | 부가 정보·힌트 |

---

## 3. 유리 (Glass) 토큰

토큰명만 기록. 실제 rgba 값은 `tokens.css` 참조.

| 토큰 | 용도 |
|------|------|
| `--glass-white` | glass 카드 기본 배경 |
| `--glass-white-md` | 더 불투명한 glass |
| `--glass-white-lg` | 가장 불투명 glass |
| `--glass-border` | glass 테두리 |
| `--glass-border-subtle` | 약한 테두리 |
| `--glass-border-bright` | 강한 테두리 |
| `--blur-sm` / `--blur-md` / `--blur-lg` | backdrop-filter 값 |
| `--shadow-glass` / `--shadow-float` | glass 그림자 |

---

## 4. CSS 유리 클래스

| 클래스 | 사용 영역 | 주의 |
|--------|---------|------|
| `.ld-glass` | 마케팅 랜딩 (🔒 LD-006) | JS 분기 금지 |
| `.glass` + `.glass-card` | 인증/회원/관리자 카드 | |
| `.lg-card` | 앱 Shell glass 카드 | |
| `.ld-surface-card` | 대시보드/패널 카드 | |
| `.lg-header` | 앱 Shell 헤더 | |
| `.lg-sidebar-glass` | 사이드바 | |
| `.lg-tabbar-glass` | 모바일 탭바 | |

---

## 5. 배경 Blob Scene (`.lg-bg`)

베이스 단색 + 3개 Blob 레이어 합성. 단색만 쓰면 안 됨.

```html
<div class="lg-bg" style="position:fixed">
  <div class="lg-blob lg-blob-1" />  <!-- cyan-blue 좌상단 -->
  <div class="lg-blob lg-blob-2" />  <!-- violet-pink 우하단 -->
  <div class="lg-blob lg-blob-3" />  <!-- amber-rose 중앙 -->
</div>
```

- `animation: blob-drift 18s ease-in-out infinite` / `filter: blur(80px)` / `border-radius: 50%`
- 라이트: rgba opacity 소폭 감소 | `prefers-reduced-motion`: animation none

---

## 6. 타이포그래피 (🔒 LD-007)

| 폰트 | 용도 | 규칙 |
|------|------|------|
| `Pretendard Variable` | 한글·영문·숫자 전체 (본문, UI) | weight 400–900 |
| `Anton` | **영문 대형 헤딩 전용** | 한글 절대 금지 |
| `Condiment` | 커시브 액센트 (장식) | |
| `NanumKalguksu` | 특수 용도 한글 디자인 | |

본문 최소 18px (시니어 가독성 — 이하 절대 금지)

---

## 7. 토큰 이름 (값은 tokens.css 참조)

**Radius**: `--radius-xs` / `--radius-sm` / `--radius-md` / `--radius-lg` / `--radius-xl` / `--radius-full`

**Spacing**: `--space-xs` / `--space-sm` / `--space-md` / `--space-lg` / `--space-xl`

**Motion Duration**: `--dur-fast` (180ms) / `--dur-mid` (360ms)

**주요 @keyframes**: `blob-drift`, `countup-fade`, `scroll-bounce`, `condiment-fadein`, `ld-slide-up`, `ld-stepper-pulse`, `progress-grow`, `pulse-badge`

---

## 8. LdStatusStepper 색상 (🔒 LD-004)

| 상태 | 색상값 |
|------|------|
| 완료 (success) | `#10b981` |
| 진행중 (active) | `#6366f1` |
| 대기 (pending) | `#eab308` |
| 오류 (error) | `#ef4444` |

이 4색 이외의 상태 색상 추가 금지.

---

## 9. Z-index 계층

| 계층 | 값 | 예시 |
|------|-----|------|
| base | `0` | 배경, blob |
| content | `1–5` | glass ::before |
| raised | `10` | GNB |
| drawer-overlay | `88` | 드로어 오버레이 |
| drawer-panel | `89` | 드로어 패널 |
| modal | `200` | 인증 모달 |

---

## 10. 시네마틱 랜딩 (`LdCinematicLanding.css`)

| 클래스 | 역할 |
|--------|------|
| `.ld-cine-section` | 100lvh 비디오 히어로. `background: #000000` 필수 |
| `.ld-cine-video-bg` | `position: absolute; inset: 0; z-index: 0` |
| `.ld-cine-vignette` | 방사형 어둠 비네트 |
| `.ld-cine-content` | 콘텐츠 레이어 (z-index 2, max-width 1400px) |
| `.ld-cine-heading` | `clamp(3rem, 8vw, 7.5rem)`, weight 900, #ffffff |

`.ld-cine-section { background: #000000 }` — 테마 무관 항상 어둠. 오버레이는 `rgba(0,0,0,0.45)` 중립만.
비디오 소스: `LdCinematicVideoBg` 컴포넌트 (`playbackId` prop)

---

## 11. 접근성

- `prefers-reduced-motion`: 모든 transition/animation → `0.01ms, iteration 1`
- `backdrop-filter` 미지원 폴백: `.glass` → `rgba(20,25,45,0.88)` solid
- 터치 최소: `48×48dp` (`.ld-touch`) / CTA 최소: `56px` (`.ld-cta-target`)

---

## 12. 혼합 레이아웃 (Hybrid Layout)

사이드바=다크, 메인=라이트인 좌우 분할. blob scene은 `position: fixed` 전역 단일이라 부분 테마 적용 불가.

**라이트 영역 구현**: `backdropFilter` 금지 → 정적 radial-gradient CSS 사용

```
라이트 영역 기준 그래디언트:
radial-gradient(ellipse at 10% 65%, rgba(180,144,245,0.45) → transparent)
radial-gradient(ellipse at 92% 12%, rgba(94,231,223,0.35)  → transparent)
radial-gradient(ellipse at 52% 98%, rgba(247,168,196,0.22) → transparent)
#f0f4ff  ← 베이스
```

---

## 13. 랜딩 vs 앱 영역 구분

| 영역 | 배경 | Glass 클래스 |
|------|------|-------------|
| 마케팅 랜딩 (`/landing/*`) | `var(--bg-base)` + `.lg-bg` blob | `.ld-glass` |
| 앱 Shell (member/partner/admin) | `.lg-bg` + `.lg-blob` | `.lg-card`, `.lg-header` |
| 인증 (auth) | `.lg-bg` blob | `.glass.glass-card` |
