---
name: senior-frontend
description: React·Next.js 15·TypeScript·Tailwind CSS 기반 시니어급 프론트엔드 개발 스킬. 컴포넌트 생성, 번들 분석, 프로젝트 구조 점검을 지원합니다. 새 컴포넌트 설계, 성능 병목 분석, UI 구조 개선, 코딩 표준 점검 요청 시 사용합니다.
---

# 시니어 프론트엔드

React, Next.js 15 (App Router), TypeScript, Tailwind CSS v4 기반 시니어급 프론트엔드 개발 툴킷입니다.
V2 LinkDrop 프로젝트의 설계 원칙(LOCKED_DECISIONS, design-principles.md)에 최적화되어 있습니다.

## 빠른 시작

### 핵심 기능

세 가지 자동화 스크립트를 통해 프론트엔드 작업을 지원합니다:

```bash
# 스크립트 1: 컴포넌트 생성기
python scripts/component_generator.py <컴포넌트명> [--path <경로>] [--client] [--css]

# 스크립트 2: 번들 분석기
python scripts/bundle_analyzer.py <프로젝트경로> [--verbose]

# 스크립트 3: 프론트엔드 스캐폴더
python scripts/frontend_scaffolder.py <프로젝트경로> [--verbose]
```

---

## 핵심 기능

### 1. 컴포넌트 생성기 (component_generator.py)

Next.js + TypeScript 보일러플레이트를 자동 생성합니다.

**주요 기능:**
- Server/Client 컴포넌트 선택 (--client 플래그)
- TypeScript Props 인터페이스 자동 생성
- CSS Module 파일 동시 생성 (--css 플래그)
- V2 네이밍 컨벤션 적용 (PascalCase 강제)

**사용법:**
```bash
python scripts/component_generator.py LdPricingCard --path apps/web/src/components/landing
python scripts/component_generator.py LdAuthModal --client --css
```

---

### 2. 번들 분석기 (bundle_analyzer.py)

Next.js 프로젝트의 번들 구성을 정적 분석합니다.

**주요 기능:**
- "use client" 남용 감지 — 서버 컴포넌트로 전환 가능 여부 판단
- dynamic import 누락 대형 컴포넌트(200줄+) 탐지
- 무거운 third-party 의존성 경고 (lodash, moment 등)
- next.config 이미지 최적화 설정 점검

**사용법:**
```bash
python scripts/bundle_analyzer.py ./apps/web --verbose
```

---

### 3. 프론트엔드 스캐폴더 (frontend_scaffolder.py)

V2 프로젝트 구조를 분석하고 개선점을 리포트합니다.

**주요 기능:**
- 페이지·컴포넌트 목록 및 Server/Client 분류
- CSS 파일 구조 검사 (V2 CSS 아키텍처 §3 준수 여부)
- 라우트별 CSS 파일 매핑 점검
- 컴포넌트 크기(줄 수) 분포 리포트

**사용법:**
```bash
python scripts/frontend_scaffolder.py ./apps/web/src --verbose
```

---

## 참조 문서

### React 패턴 가이드
`references/react_patterns.md` — 성능 최적화 패턴, 상태 관리, 합성 패턴, 에러 바운더리, 안티패턴

### Next.js 최적화 가이드
`references/nextjs_optimization_guide.md` — Image/Font 최적화, Cache 전략, Server Component 데이터 패칭, Metadata API

### 프론트엔드 베스트 프랙티스
`references/frontend_best_practices.md` — V2 CSS 아키텍처, Glass/Blob 패턴, WCAG AA 접근성, TypeScript 전략

---

## 기술 스택

- **언어**: TypeScript, JavaScript
- **프레임워크**: Next.js 15 (App Router), React 18
- **스타일링**: Tailwind CSS v4, CSS Modules, CSS 변수 (토큰 기반)
- **인증**: Supabase Auth (OAuth 전용 — LD-009)
- **테마**: next-themes (다크 기본 — LD-001)
- **폰트**: Pretendard Variable / Anton (영문 헤딩 전용 — LD-007)

---

## 개발 워크플로우

### 1. 신규 컴포넌트 생성
```bash
# 서버 컴포넌트 (기본)
python scripts/component_generator.py LdNewSection --path apps/web/src/components/landing

# 클라이언트 컴포넌트 + CSS Module
python scripts/component_generator.py LdInteractiveCard --client --css
```

### 2. 성능 분석
```bash
python scripts/bundle_analyzer.py ./apps/web --verbose
```

### 3. 구조 점검
```bash
python scripts/frontend_scaffolder.py ./apps/web/src --verbose
```

---

## 코딩 표준 요약

### 컴포넌트 파일 순서
1. "use client" (필요 시)
2. 외부 라이브러리 import
3. 내부 컴포넌트·유틸 import
4. 타입 정의 (interface Props)
5. 컴포넌트 본체 (상태 → 훅 → 핸들러 → 렌더)

### CSS 작성 기준
- 라우트 전용 → `src/styles/pages/`
- 컴포넌트 전용 → `.module.css`
- `style={{ }}` 인라인 → JS 동적 값만 허용 (§3-A)
- glass 속성 → 반드시 `.ld-glass` 클래스 사용 (LD-006)

### 절대 금지
- `any` 타입 남용 → `unknown` + 타입 가드
- Left border accent → 뱃지·아이콘 조합으로 대체 (§7)
- 단색 배경으로 blob scene 차단 → `var(--glass-white)` 사용
- iframe → `window.open()` 팝업으로 대체

---

## 자주 쓰는 명령어

```bash
# 개발 서버
npm run dev

# 빌드·타입 체크
npm run build
npx tsc --noEmit

# 린트
npm run lint

# 분석
python scripts/bundle_analyzer.py ./apps/web --verbose
python scripts/frontend_scaffolder.py ./apps/web/src
```

## 문제 해결

- 빌드 오류 → `npx tsc --noEmit` 먼저 실행
- 하이드레이션 불일치 → Server/Client 경계 확인 (`references/react_patterns.md` §3)
- 번들 크기 급증 → `bundle_analyzer.py` 실행 후 dynamic import 적용
- CSS 적용 안 됨 → V2 CSS 아키텍처 §3 경로 규칙 확인
