# React 패턴 가이드

## 개요

React 18 + Next.js 15 App Router 환경에서 시니어 수준으로 사용하는 패턴과 안티패턴을 정리합니다.
V2 LinkDrop 프로젝트 기준으로 작성되었습니다.

---

## 1. 성능 최적화 패턴

### 패턴 1-A: 참조 안정화 (useMemo / useCallback)

```typescript
// ❌ 잘못됨 — 렌더마다 새 참조 생성
function Parent() {
  return <Child style={{ color: "var(--accent-neon)" }} onClick={() => handleClick()} />;
}

// ✅ 올바름
const CHILD_STYLE = { color: "var(--accent-neon)" };
function Parent() {
  const handleChildClick = useCallback(() => handleClick(), []);
  return <Child style={CHILD_STYLE} onClick={handleChildClick} />;
}
```

**언제 사용:** Child 컴포넌트가 `React.memo`로 감싸져 있거나, useEffect 의존성에 객체·함수가 포함될 때.

### 패턴 1-B: 대형 컴포넌트 dynamic import

```typescript
// ❌ 초기 번들에 포함 — 200줄+ 컴포넌트
import LdHeavyModal from "@/components/LdHeavyModal";

// ✅ 사용 시점에만 로드
import dynamic from "next/dynamic";
const LdHeavyModal = dynamic(() => import("@/components/LdHeavyModal"), {
  loading: () => <div className="ld-glass animate-pulse h-32 rounded-xl" />,
});
```

**기준:** 200줄 이상이고 초기 렌더에 불필요한 컴포넌트.

### 패턴 1-C: 가상화 (Virtualization)

```typescript
// 목록이 50개 이상일 때 react-window 사용
import { FixedSizeList } from "react-window";

function LargeList({ items }: { items: Item[] }) {
  return (
    <FixedSizeList height={600} itemCount={items.length} itemSize={72} width="100%">
      {({ index, style }) => (
        <div style={style}>
          <ItemCard item={items[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

---

## 2. 상태 관리 패턴

### 패턴 2-A: 서버 상태 vs 클라이언트 상태 분리

```typescript
// 서버 상태 — Server Component에서 직접 fetch
// app/member/dashboard/page.tsx
export default async function DashboardPage() {
  const profile = await fetchUserProfile(); // 서버에서 실행
  return <DashboardContent profile={profile} />;
}

// 클라이언트 상태 — useState/Zustand
// UI 상태(모달 열림/닫힘, 탭 선택)만 클라이언트에서 관리
```

### 패턴 2-B: Context는 UI 상태만 — 서버 데이터 금지

```typescript
// ❌ 잘못됨 — 서버 데이터를 Context에 저장
const UserContext = createContext<UserProfile | null>(null);

// ✅ 올바름 — UI 토글·테마 같은 상태만
const AuthModalContext = createContext<{
  isOpen: boolean;
  open: () => void;
  close: () => void;
} | null>(null);
```

### 패턴 2-C: useReducer — 복잡한 폼 상태

```typescript
type CheckoutState = {
  step: 1 | 2 | 3;
  isLoading: boolean;
  error: string | null;
};

type CheckoutAction =
  | { type: "NEXT_STEP" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string };

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case "NEXT_STEP": return { ...state, step: Math.min(3, state.step + 1) as 1|2|3 };
    case "SET_LOADING": return { ...state, isLoading: action.payload };
    case "SET_ERROR": return { ...state, error: action.payload };
  }
}
```

---

## 3. Server / Client 컴포넌트 패턴

### 패턴 3-A: 컴포넌트 분리 원칙

```
페이지/섹션 결정 흐름:
  상태(useState), 이벤트 핸들러, 브라우저 API가 필요한가?
    YES → "use client"
    NO  → Server Component (번들 크기 감소)
```

```typescript
// ✅ 정적 콘텐츠 → Server Component
// app/(public)/landing/[slug]/page.tsx
import landingsData from "@/data/landings.json";
export default function LandingPage({ params }: { params: { slug: string } }) {
  const landing = landingsData.find(l => l.slug === params.slug);
  return <LandingContent data={landing} />;
}

// ✅ 인터랙션 → Client Component
// components/landing/LdCountupNumber.tsx
"use client";
export default function LdCountupNumber({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => { /* countup 로직 */ }, [target]);
  return <span>{display}</span>;
}
```

### 패턴 3-B: 하이드레이션 불일치 방지

```typescript
// ❌ 서버 렌더 시 window 없음 → 불일치
"use client";
export default function WindowWidth() {
  const width = window.innerWidth; // ReferenceError on server
  return <div>{width}</div>;
}

// ✅ useEffect로 클라이언트 초기화
"use client";
export default function WindowWidth() {
  const [width, setWidth] = useState(0);
  useEffect(() => { setWidth(window.innerWidth); }, []);
  return <div>{width || ""}</div>; // 서버: "" / 클라이언트: 실제 값
}
```

---

## 4. 합성 패턴 (Composition Patterns)

### 패턴 4-A: Children as Slots

```typescript
// ✅ 유연한 합성 — Slot 패턴
function LdCard({ header, children, footer }: {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <article className="ld-glass rounded-xl p-6">
      {header && <div className="mb-4">{header}</div>}
      {children}
      {footer && <div className="mt-4 pt-4 border-t border-white/10">{footer}</div>}
    </article>
  );
}
```

### 패턴 4-B: 렌더 프롭 (Render Props)

```typescript
function LdIntersectionObserver({
  children,
}: {
  children: (isVisible: boolean) => React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting));
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return <div ref={ref}>{children(isVisible)}</div>;
}

// 사용
<LdIntersectionObserver>
  {(isVisible) => <LdStatCard visible={isVisible} value={3200} />}
</LdIntersectionObserver>
```

---

## 5. 에러 처리 패턴

### 패턴 5-A: Error Boundary

```typescript
// app/error.tsx (Next.js App Router 자동 에러 경계)
"use client";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="ld-glass rounded-xl p-8 text-center">
      <p className="text-accent-rose mb-4">오류가 발생했습니다</p>
      <button onClick={reset} className="ld-cta-btn">다시 시도</button>
    </div>
  );
}
```

### 패턴 5-B: async 컴포넌트 + Suspense

```typescript
// ✅ 스트리밍으로 페이지 블로킹 방지
export default function DashboardPage() {
  return (
    <div>
      <LdDashboardHeader />
      <Suspense fallback={<DashboardSkeleton />}>
        <AsyncDashboardContent />
      </Suspense>
    </div>
  );
}

async function AsyncDashboardContent() {
  const data = await fetchSlowData(); // 이것만 지연
  return <DashboardContent data={data} />;
}
```

---

## 6. 커스텀 훅 패턴

### 패턴 6-A: 상태 + 사이드이펙트 캡슐화

```typescript
function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      setProgress(scrollTop / (scrollHeight - clientHeight));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return progress;
}
```

### 패턴 6-B: 훅에서 인터페이스 노출 — 함수만 반환

```typescript
// ❌ 내부 구현 노출
function useAuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, setIsOpen }; // setter 직접 노출
}

// ✅ 의도를 표현하는 인터페이스
function useAuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(v => !v),
  };
}
```

---

## 7. 안티패턴 요약

| 안티패턴 | 문제 | 해결 |
|---------|------|------|
| 인라인 객체/함수 props | 무한 리렌더 | 상수 분리 / useCallback |
| useEffect 의존성 누락 | 스테일 클로저 | exhaustive-deps ESLint |
| key에 index 사용 | 목록 순서 변경 시 상태 오염 | 안정적 고유 ID 사용 |
| 불필요한 "use client" | 번들 크기 증가 | Server Component 유지 |
| Context에 서버 데이터 | SSR 불필요한 re-render | Server Component props 전달 |
| 하이드레이션 불일치 | 콘솔 에러, UX 깨짐 | useEffect + 초기값 일치 |
