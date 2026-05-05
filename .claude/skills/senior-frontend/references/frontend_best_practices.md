# 프론트엔드 베스트 프랙티스

## 개요

React·Next.js·TypeScript 기반 프로젝트에서 시니어 수준의 코드 품질을 유지하기 위한 실천 지침입니다.
V2 LinkDrop 설계 원칙(design-principles.md, LOCKED_DECISIONS.md)과 연동됩니다.

---

## 1. TypeScript 전략

### 1-A: 타입 정의 원칙

```typescript
// ✅ 인터페이스 — 객체 형태
interface UserProfile {
  id: string;
  role: "guest" | "partner" | "gold_partner" | "instructor" | "admin";
  email: string;
  created_at: string;
}

// ✅ 타입 — 유니온·교차·조건부
type ButtonVariant = "primary" | "secondary" | "ghost";
type Nullable<T> = T | null;
type isBuyer = UserProfile["role"] extends "guest" ? false : true;

// ❌ 금지 — any 남용
const data: any = fetchData();
```

### 1-B: 타입 단언 (Type Assertion)

```typescript
// ✅ 타입 가드로 안전하게 좁히기
function isApiError(error: unknown): error is { message: string; code: number } {
  return typeof error === "object" && error !== null && "message" in error;
}

// ⚠️ 불가피한 경우만 허용
const el = document.getElementById("modal-root") as HTMLElement;

// ❌ 절대 금지 — 이중 단언
const val = (someValue as unknown) as SpecificType;
```

### 1-C: 런타임 타입 검증 (외부 데이터)

```typescript
// 외부 API 응답·URL params 등 시스템 경계에서 검증
function parseUserRole(raw: unknown): UserProfile["role"] {
  const VALID = ["guest", "partner", "gold_partner", "instructor", "admin"] as const;
  if (typeof raw === "string" && VALID.includes(raw as typeof VALID[number])) {
    return raw as UserProfile["role"];
  }
  return "guest";
}
```

---

## 2. CSS 아키텍처 (V2 기준)

### 2-A: 파일 위치 결정 흐름

```
디자인 수정 요청
  ↓
이 라우트 전용인가?
  ├─ YES → src/styles/pages/landing{N}.css  (또는 homepage.css, about.css)
  └─ NO (여러 라우트 공통)
       ↓
       컴포넌트 전용인가?
         ├─ YES → src/components/{컴포넌트}/*.module.css
         └─ NO (글로벌 패턴)
              ↓
              src/styles/components.css  (또는 layout.css)
```

### 2-B: 인라인 style 허용/금지 기준 (§3-A)

```typescript
// ✅ 허용 — JS 런타임 동적 값만
style={{ opacity: isVisible ? 1 : 0 }}
style={{ transform: `translateY(${scrollY * 0.5}px)` }}
style={{ width: `${progress}%` }}

// ❌ 금지 — 정적 값은 CSS 파일로
style={{ fontSize: "18px", padding: "24px" }}
style={{ color: "var(--accent-neon)" }}
style={{ background: "var(--glass-white)", backdropFilter: "blur(18px)" }}
```

### 2-C: CSS 변수 토큰 사용

```css
/* ✅ 올바름 — 설계 토큰 사용 */
.my-card {
  background: var(--glass-white);
  border: 1px solid var(--glass-border);
  backdrop-filter: var(--blur-md);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
}

/* ❌ 금지 — 하드코딩 */
.my-card {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 20px;
}
```

---

## 3. Glass / Blob 디자인 시스템 (V2 전용)

### 3-A: Glass 클래스 사용 원칙 (LD-006)

```typescript
// ✅ 올바름 — 전용 클래스 사용
<div className="ld-glass rounded-xl p-6">...</div>
<div className="ld-glass ld-glass-card-md">...</div>

// ❌ 금지 — glass 속성 인라인 직접 작성
<div style={{
  background: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.25)"
}}>
```

### 3-B: 테마 = blob scene + glass

```typescript
// ✅ 올바름 — blob scene 위에 glass 표면
<div className="lg-bg" style={{ position: "fixed", inset: 0, zIndex: 0 }}>
  <div className="lg-blob lg-blob-1" />
  <div className="lg-blob lg-blob-2" />
  <div className="lg-blob lg-blob-3" />
</div>
<main className="relative z-10">
  <div className="ld-glass rounded-xl p-8">콘텐츠</div>
</main>

// ❌ 금지 — 단색 배경으로 blob 차단
<main style={{ background: "rgba(1,8,40,0.96)" }}>
```

### 3-C: Left Border Accent 금지 (§7)

```css
/* ❌ 영구 금지 — "AI가 만든 티" 1순위 패턴 */
.card { border-left: 4px solid var(--accent-neon); }

/* ✅ 대체 — 뱃지 + 아이콘 조합 */
.card { /* 테두리 없음 — 내부 뱃지로 강조 */ }
```

---

## 4. 접근성 (WCAG AA)

### 4-A: 색상 대비

```typescript
// ✅ 다크 테마 기준
// --text-primary: #eff4ff on --bg-base: #010828 → 14.5:1 (AAA)
// --accent-neon: #6fff00 on --bg-base: #010828 → 6.2:1 (AA)

// ✅ 라이트 테마 기준 (V2 별도 조정)
// --accent-neon: #3aa800 (다크 #6fff00 대비 어둡게 조정 — WCAG AA 보장)
```

### 4-B: 인터랙티브 요소

```typescript
// ✅ 아이콘 전용 버튼에 aria-label
<button onClick={handleClose} aria-label="닫기">
  <XIcon size={20} aria-hidden="true" />
</button>

// ✅ 터치 최소 크기 — 48×48dp
<button className="ld-touch"> {/* min-h-12 min-w-12 */}
  버튼
</button>

// ✅ focus-visible 상태
<button className="focus-visible:ring-2 focus-visible:ring-neon focus-visible:outline-none">
  버튼
</button>
```

### 4-C: prefers-reduced-motion

```css
/* globals.css — 이미 설정됨 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. 보안 베스트 프랙티스

### 5-A: 환경변수 분리

```typescript
// ✅ 클라이언트 공개 — NEXT_PUBLIC_ 접두사
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// ✅ 서버 전용 — 접두사 없음 (클라이언트 번들 노출 방지)
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ❌ 금지 — 서버 전용 변수를 클라이언트 컴포넌트에서 직접 사용
```

### 5-B: 오픈 리다이렉트 방지

```typescript
// ❌ 위험 — 외부 URL 리다이렉트 가능
const next = searchParams.get("next");
redirect(next!);

// ✅ 내부 경로만 허용
const next = searchParams.get("next") ?? "/";
const safePath = next.startsWith("/") && !next.startsWith("//") ? next : "/";
redirect(safePath);
```

### 5-C: dangerouslySetInnerHTML 처리

```typescript
// ❌ 금지 — 사용자 입력 무검증 HTML 삽입
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ 텍스트는 React 텍스트 노드로
<p>{userContent}</p>

// ✅ HTML이 반드시 필요한 경우 DOMPurify
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(trustedContent) }} />
```

---

## 6. 코딩 컨벤션

### 6-A: 네이밍 규칙

| 대상 | 형식 | 예시 |
|------|------|------|
| React 컴포넌트 | PascalCase | `LdPricingCard.tsx` |
| 훅 | camelCase + use 접두사 | `useAuthModal.ts` |
| 유틸 함수 | camelCase | `formatPrice.ts` |
| 타입/인터페이스 | PascalCase (I 접두사 금지) | `UserProfile`, `ButtonVariant` |
| CSS 클래스 | kebab-case | `ld-glass-card`, `gnb-bar` |
| 상수 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

### 6-B: 컴포넌트 파일 구조

```typescript
"use client"; // 1. 필요한 경우만

// 2. 외부 라이브러리
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// 3. 내부 컴포넌트·유틸
import LdButton from "@/components/ui/LdButton";
import { formatPrice } from "@/utils/format";

// 4. 타입
interface Props {
  price: number;
  onSubmit: () => void;
}

// 5. 컴포넌트 본체
export default function PriceCard({ price, onSubmit }: Props) {
  // 5a. 상태
  const [isLoading, setIsLoading] = useState(false);
  // 5b. 훅
  const router = useRouter();
  // 5c. 핸들러
  const handleClick = useCallback(async () => {
    setIsLoading(true);
    await onSubmit();
    setIsLoading(false);
  }, [onSubmit]);
  // 5d. 렌더
  return (
    <div className="ld-glass rounded-xl p-6">
      <span>{formatPrice(price)}</span>
      <LdButton onClick={handleClick} disabled={isLoading}>구매하기</LdButton>
    </div>
  );
}
```

---

## 7. 금지 패턴 총정리

| 금지 항목 | 이유 | 대안 |
|-----------|------|------|
| `any` 타입 | 타입 안전성 소멸 | `unknown` + 타입 가드 |
| 이중 단언 `as unknown as T` | 런타임 오류 위험 | 타입 가드 함수 |
| 정적 인라인 `style={}` | CSS 아키텍처 위반 (§3-A) | CSS 클래스 |
| `console.log` 잔류 | 정보 노출 | 삭제 또는 logger 유틸 |
| Left border accent | AI 생성 티 1순위 (§7) | 뱃지·아이콘 조합 |
| `iframe` | 보안·UX 문제 | `window.open()` |
| 단색 배경으로 blob 차단 | 디자인 시스템 위반 | `var(--glass-white)` |
| `supabase` 마케팅 페이지 호출 | 정적 빌드 원칙 위반 (LD-005) | `src/data/*.json` |
| 이메일+비밀번호 인증 | LD-009 폐기됨 | Google/Kakao OAuth만 |
