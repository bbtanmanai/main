# 코딩 표준

## 개요

TypeScript, React, Next.js 기반 프로젝트의 코딩 표준과 컨벤션을 정의합니다.

---

## 1. 네이밍 규칙

### 컴포넌트 / 파일

| 대상 | 형식 | 예시 |
|------|------|------|
| React 컴포넌트 | PascalCase | `UserProfile.tsx` |
| 훅 | camelCase + use 접두사 | `useAuthModal.ts` |
| 유틸 함수 | camelCase | `formatPrice.ts` |
| 타입/인터페이스 | PascalCase + I 접두사 금지 | `UserRole`, `PricingData` |
| 상수 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| CSS 클래스 | kebab-case | `ld-glass-card`, `gnb-bar` |

### 변수 / 함수

```typescript
// ✅ 좋음 — 명확하고 구체적
const isUserAuthenticated = false;
const handleSubmitPayment = () => {};
const formatKoreanPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

// ❌ 나쁨 — 모호하고 축약
const flag = false;
const fn = () => {};
const fmt = (p: number) => p;
```

---

## 2. TypeScript 규칙

### 타입 정의

```typescript
// ✅ 인터페이스 — 객체 형태에 사용
interface UserProfile {
  id: string;
  role: 'guest' | 'partner' | 'gold_partner' | 'instructor' | 'admin';
  email: string;
}

// ✅ 타입 — 유니온, 교차, 조건부 타입에 사용
type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type Nullable<T> = T | null;

// ❌ 금지 — any 남용
const data: any = fetchData();  // unknown 또는 구체적 타입 사용
```

### 타입 단언

```typescript
// ✅ 허용 — 타입 가드로 안전하게 좁히기
if (error instanceof Error) {
  console.error(error.message);
}

// ⚠️ 주의 — 불가피한 경우만
const el = document.getElementById('root') as HTMLElement;

// ❌ 금지 — 이중 단언
const val = (someValue as unknown) as SpecificType;
```

---

## 3. React / Next.js 컴포넌트 구조

### 컴포넌트 파일 순서

```typescript
"use client"; // 필요한 경우만

// 1. 외부 라이브러리 import
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. 내부 컴포넌트·유틸 import
import LdButton from "@/components/ui/LdButton";
import { formatPrice } from "@/utils/format";

// 3. 타입 정의
interface Props {
  price: number;
  onSubmit: () => void;
}

// 4. 컴포넌트 본체
export default function PriceCard({ price, onSubmit }: Props) {
  // 4a. 상태 선언
  const [isLoading, setIsLoading] = useState(false);

  // 4b. 훅 호출
  const router = useRouter();

  // 4c. 이벤트 핸들러
  const handleClick = async () => {
    setIsLoading(true);
    await onSubmit();
    setIsLoading(false);
  };

  // 4d. 렌더
  return (
    <div className="ld-glass ld-price-card">
      <span>{formatPrice(price)}</span>
      <button onClick={handleClick} disabled={isLoading}>
        구매하기
      </button>
    </div>
  );
}
```

### Server Component vs Client Component

```typescript
// ✅ Server Component — 데이터 패칭, 정적 렌더링
// app/landing/[slug]/page.tsx
import landingsData from "@/data/landings.json";

export default function LandingPage({ params }: { params: { slug: string } }) {
  const landing = landingsData.find(l => l.slug === params.slug);
  return <LandingContent data={landing} />;
}

// ✅ Client Component — 인터랙션, 브라우저 API, 상태 관리
// "use client" 최상단에 선언
"use client";
export default function PricingCountup({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  // ...
}
```

---

## 4. CSS 아키텍처 (V2 프로젝트)

### 파일 위치 결정 규칙

```
디자인 수정 요청
  ↓
이 라우트 전용인가?
  ├─ YES → src/styles/pages/landing{N}.css
  └─ NO (여러 라우트 공통)
       ↓
       컴포넌트 전용인가?
         ├─ YES → src/components/{컴포넌트}/*.css
         └─ NO (글로벌 패턴)
              ↓
              src/styles/components.css
```

### 인라인 스타일 규칙

```typescript
// ✅ 허용 — JS 런타임 동적 값
style={{ opacity: visibleSteps[idx] ? 1 : 0 }}
style={{ transform: `translateY(${scrollY * 0.5}px)` }}
style={{ width: `${progress}%` }}

// ❌ 금지 — 정적 값은 CSS 파일로
style={{ fontSize: "18px", padding: "24px" }}
style={{ color: "var(--accent-neon)" }}
style={{ background: "var(--glass-white)", backdropFilter: "blur(18px)" }}
```

---

## 5. 에러 처리

```typescript
// ✅ 비동기 처리 — try/catch + 사용자 친화적 메시지
async function submitOrder(orderId: string) {
  try {
    const result = await createOrder(orderId);
    return result;
  } catch (error) {
    // 로깅 (프로덕션에서는 Sentry 등 외부 서비스)
    console.error('[submitOrder]', error);
    // 사용자에게는 친화적 메시지
    throw new Error('주문 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
  }
}

// ✅ 경계 처리 — 외부 데이터 검증
function parseUserRole(raw: unknown): UserRole {
  if (raw === 'partner' || raw === 'gold_partner' || raw === 'instructor' || raw === 'admin') {
    return raw;
  }
  return 'guest'; // 안전한 기본값
}
```

---

## 6. 커밋 메시지 형식

```
<type>(<scope>): <요약>

<상세 설명 (선택)>
```

**타입:**
| 타입 | 용도 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 리팩터링 (기능 변화 없음) |
| `style` | CSS/스타일 변경 |
| `perf` | 성능 개선 |
| `test` | 테스트 추가/수정 |
| `docs` | 문서 수정 |
| `chore` | 빌드·설정 변경 |

**예시:**
```
feat(landing): 랜딩5 어필리에이트 가이드 섹션 추가
fix(auth): OAuth 콜백 오픈 리다이렉트 취약점 수정
refactor(css): 인라인 style={{}} → CSS 클래스 마이그레이션
```

---

## 7. 금지 패턴 요약

| 금지 항목 | 이유 | 대안 |
|-----------|------|------|
| `any` 타입 | 타입 안전성 소멸 | `unknown` + 타입 가드 |
| 이중 단언 `as unknown as T` | 런타임 오류 위험 | 타입 가드 함수 |
| 정적 인라인 style | CSS 아키텍처 위반 | CSS 클래스 |
| `console.log` 프로덕션 잔류 | 정보 노출 위험 | logger 유틸·삭제 |
| Left border accent | AI 생성 티 1순위 | 뱃지·아이콘 조합 |
| iframe | 보안·UX 문제 | `window.open()` |
| 단색 배경으로 blob 가리기 | 디자인 시스템 위반 | blob scene 유지 |
