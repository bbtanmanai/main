# LinkDrop V2 — GNB 설계 규칙

> 최종 확정: 2026-04-29
> 이 문서는 GNB의 유일한 진실(single source of truth)이다.

---

## 1. 구조 — 전역 단일 컴포넌트

```
apps/web/src/app/layout.tsx          ← 루트 레이아웃 (모든 라우터 포함)
  └─ LdGnbConditional                ← 라우터별 props 결정
       └─ LdCommonGnb                ← 실제 렌더링
```

- **GNB는 루트 레이아웃에서 단 한 번 렌더** — 예외 없음
- 높이: **60px** (fixed, `z-index: 80`)
- 페이지 콘텐츠는 반드시 **paddingTop: 64px 이상** 확보

---

## 2. 배경 — Glass (blob scene이 비쳐야 함)

이 프로젝트에서 "테마 배경" = **blob scene + glass 표면**이다.
GNB는 glass 표면으로 구현하여 뒤의 blob scene이 비쳐야 한다.

| 테마 | background | backdrop-filter |
|------|-----------|----------------|
| 다크 | `transparent` | `blur(20px)` |
| 라이트 | `transparent` | `blur(20px)` |

- 다크: blob의 청록·보라·앰버 빛이 GNB 뒤로 은은하게 비침
- 라이트: blob이 밝은 파스텔 분위기로 비침

**절대 금지**: `var(--bg-base)` 솔리드(`#010828`, `#dce8f8`), blob을 가리는 불투명 배경

---

## 3. 메뉴 텍스트 색상

### 다크 테마 (기본)

| 상태 | 색상 |
|------|------|
| 기본 | `rgba(255, 255, 255, 0.45)` |
| hover | `rgba(255, 255, 255, 0.88)` |
| active | `#6fff00` |
| active 하단 라인 | `#6fff00`, glow `rgba(111,255,0,0.55)` |

### 라이트 테마 `[data-theme="light"]`

| 상태 | 색상 |
|------|------|
| 기본 | `rgba(15, 23, 42, 0.60)` |
| hover | `rgba(15, 23, 42, 0.92)` |
| active | `#0891b2` |
| active 하단 라인 | `#0891b2`, glow `rgba(8,145,178,0.55)` |

---

## 4. 테두리 (border-bottom)

| 테마 | 색상 |
|------|------|
| 다크 | `rgba(111, 255, 0, 0.15)` |
| 라이트 | `rgba(15, 23, 42, 0.10)` |

---

## 5. 우측 버튼 색상

### 다크 테마

| 버튼 | 배경 | 텍스트 | 테두리 |
|------|------|--------|--------|
| 로그인 | transparent | `rgba(255,255,255,0.50)` | `rgba(255,255,255,0.18)` |
| 시작하기 | `#6fff00` | `#010828` | — |
| 마이페이지 | `rgba(111,255,0,0.07)` | `rgba(255,255,255,0.70)` | `rgba(111,255,0,0.22)` |

### 라이트 테마

| 버튼 | 배경 | 텍스트 | 테두리 |
|------|------|--------|--------|
| 로그인 | transparent | `rgba(15,23,42,0.62)` | `rgba(15,23,42,0.22)` |
| 시작하기 | `#6fff00` (변경 없음) | `#010828` | — |
| 마이페이지 | `rgba(8,145,178,0.07)` | `rgba(15,23,42,0.72)` | `rgba(8,145,178,0.28)` |

---

## 6. 드롭다운 패널

| 테마 | 배경 | 테두리 | 상단 라인 |
|------|------|--------|---------|
| 다크 | `#2A2A2A` | `rgba(111,255,0,0.22)` | `#6fff00` |
| 라이트 | `#f0f4ff` | `rgba(8,145,178,0.22)` | `#0891b2` |

---

## 7. 라우터별 props 규칙 (LdGnbConditional)

| 라우터 | showToggle | drawerVariant | 비고 |
|--------|-----------|---------------|------|
| `/` (index) | **false** | marketing | 다크 고정 디자인 (LD-001) |
| `/landing/*` (landing10 제외) | **false** | marketing | 랜딩 다크 고정 |
| `/landing/landing10` | true | marketing | 라이트/다크 공용 |
| `/member/*` `/partner/*` `/instructor/*` `/admin/*` | true | **user** | 유저 드로어 |
| 그 외 모든 라우터 | true | marketing | |

---

## 8. 콘텐츠 top padding 처리 현황

| 레이아웃/컴포넌트 | paddingTop | 파일 |
|-----------------|-----------|------|
| `LgShell` (member/partner/instructor/admin) | 64px | `components/lg/LgShell.tsx` |
| checkout | 64px | `app/checkout/layout.tsx` |
| `LdHeroSection` (랜딩 표준) | 80px | `components/landing/LdHeroSection.tsx` |
| index HERO 텍스트 블록 | 128px (`pt-32`) | `app/(public)/page.tsx` |

---

## 9. CSS 위치

`apps/web/src/app/globals.css` — 섹션: `Neo-Swiss Command Bar GNB`

```
.gnb-bar              배경·blur·border (기본 다크)
[data-theme="light"] .gnb-bar   라이트 배경·border
.gnb-btn              메뉴 버튼 (기본 다크)
[data-theme="light"] .gnb-btn   라이트 메뉴 색상
.gnb-login-btn        로그인 버튼 (다크)
.gnb-cta-primary      시작하기 (테마 무관)
.gnb-mypage-btn       마이페이지 (다크)
[data-theme="light"] .gnb-*     라이트 오버라이드 전체
.gnb-drop-panel/link  드롭다운 (다크)
[data-theme="light"] .gnb-drop-* 드롭다운 라이트
.gnb-bar .ld-ham-bar  햄버거 (다크)
[data-theme="light"] .gnb-bar .ld-ham-bar  햄버거 라이트
```

---

## 10. 절대 금지 사항

1. **페이지별 GNB 배경 오버라이드** — solid, gradient 모두 금지
2. **`gnb-dark` 클래스** — 영구 삭제됨, 부활 금지
3. **`LdNavHeader` 사용** — dead 컴포넌트, `LdCommonGnb`로 대체
4. **루트 레이아웃 외 별도 GNB 렌더링** — 이중 헤더 절대 금지
5. **Glass 제거** — 항상 `backdrop-filter: blur(20px)` 유지
6. **`[data-theme="light"] .gnb-bar` 오버라이드** — 페이지별 커스텀 금지

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|---------|
| 2026-04-29 | 2-layer(그라디언트+솔리드) → Glass 전환. 라이트 테마 색상 체계 추가. `gnb-dark` 클래스 폐기. |
| 2026-04-29 | Glass(rgba 반투명) → 완전 투명(transparent). backdrop-filter:blur(20px)만 유지. 모든 라우터 통일. |
