# GNB 설계 규칙

## 구조
`layout.tsx → LdGnbConditional → LdCommonGnb` — 루트 레이아웃에서 단 한 번 렌더
높이 **60px** / fixed / `z-index: 80` / 콘텐츠 paddingTop: **64px 이상**

## 배경 — 항상 Glass (blob scene이 비쳐야 함)
`background: transparent` + `backdrop-filter: blur(20px)` — 다크·라이트 동일
**절대 금지**: `var(--bg-base)` solid, gradient, 불투명 배경

## forceDarkGnb 페이지 (GNB 다크 강제)
`landing1`, `landing2`, `landing3`, `landing4`, `landing7`
→ `LdGnbConditional.tsx`에서 `forceDarkGnb=true` 전달
→ 추가 시 `LdGnbConditional.tsx`의 `forceDarkGnb` 조건에 pathname 추가

## 라우터별 props (LdGnbConditional)

| 라우터 | showToggle | drawerVariant |
|--------|-----------|---------------|
| `/`, `/landing/*` (landing10 제외) | false | marketing |
| `/landing/landing10` | true | marketing |
| `/member/*` `/partner/*` `/instructor/*` `/admin/*` | true | user |
| 그 외 | true | marketing |

## 콘텐츠 top padding

| 레이아웃 | paddingTop | 파일 |
|---------|-----------|------|
| LgShell (member/partner/admin) | 64px | `components/lg/LgShell.tsx` |
| checkout | 64px | `app/checkout/layout.tsx` |
| LdHeroSection (랜딩 표준) | 80px | `components/landing/LdHeroSection.tsx` |
| index HERO | 128px (`pt-32`) | `app/(public)/page.tsx` |

## CSS 위치
`src/app/globals.css` — 섹션: `Neo-Swiss Command Bar GNB`
색상·버튼·드롭다운 스펙은 해당 CSS 파일에서 확인

## 절대 금지
1. 페이지별 GNB 배경 오버라이드 (solid·gradient 모두)
2. `gnb-dark` 클래스 (폐기됨)
3. `LdNavHeader` 사용 (dead 컴포넌트, `LdCommonGnb` 사용)
4. 루트 레이아웃 외 별도 GNB 렌더링
5. Glass 제거 (`backdrop-filter: blur(20px)` 항상 유지)
6. `[data-theme="light"] .gnb-bar` 페이지별 커스텀
