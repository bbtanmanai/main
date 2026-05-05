# 공통 안티패턴

## 개요

React, TypeScript, Next.js 개발에서 반복적으로 나타나는 안티패턴과 올바른 대체 방법을 정리합니다.

---

## 1. React 렌더링 성능

### 안티패턴 1-A: 인라인 객체·함수로 인한 무한 리렌더링

```typescript
// ❌ 잘못됨 — 렌더마다 새 참조 생성
function Parent() {
  return <Child style={{ color: "red" }} onClick={() => handleClick()} />;
}

// ✅ 올바름 — 참조 안정화
const CHILD_STYLE = { color: "red" };
function Parent() {
  const handleChildClick = useCallback(() => handleClick(), []);
  return <Child style={CHILD_STYLE} onClick={handleChildClick} />;
}
```

### 안티패턴 1-B: useEffect 의존성 누락

```typescript
// ❌ 잘못됨 — userId가 바뀌어도 재실행 안 됨
useEffect(() => {
  fetchUserData(userId);
}, []); // userId 누락

// ✅ 올바름
useEffect(() => {
  fetchUserData(userId);
}, [userId]);
```

### 안티패턴 1-C: key로 index 사용

```typescript
// ❌ 잘못됨 — 목록 순서 변경 시 상태 오염
{items.map((item, index) => (
  <ItemCard key={index} item={item} />
))}

// ✅ 올바름 — 안정적인 고유 ID 사용
{items.map((item) => (
  <ItemCard key={item.id} item={item} />
))}
```

---

## 2. TypeScript 타입 안전성

### 안티패턴 2-A: any 타입 전파

```typescript
// ❌ 잘못됨 — any가 전파되어 타입 검사 무력화
async function fetchData(): Promise<any> {
  const res = await fetch('/api/data');
  return res.json();
}

// ✅ 올바름 — 명시적 타입 정의
interface ApiResponse {
  users: UserProfile[];
  total: number;
}
async function fetchData(): Promise<ApiResponse> {
  const res = await fetch('/api/data');
  return res.json() as Promise<ApiResponse>;
}
```

### 안티패턴 2-B: Non-null assertion 남용

```typescript
// ❌ 잘못됨 — 런타임에 null 역참조 발생 가능
const user = getUser()!;
console.log(user.name); // user가 null이면 크래시

// ✅ 올바름 — 명시적 null 체크
const user = getUser();
if (!user) return null;
console.log(user.name);
```

### 안티패턴 2-C: enum 대신 const assertion

```typescript
// ⚠️ 주의 — TypeScript enum은 트리쉐이킹 안 됨
enum UserRole { Guest = 'guest', Partner = 'partner' }

// ✅ 올바름 — const as const 패턴
const USER_ROLES = ['guest', 'partner', 'gold_partner', 'instructor', 'admin'] as const;
type UserRole = typeof USER_ROLES[number];
```

---

## 3. Next.js / 서버 컴포넌트

### 안티패턴 3-A: 불필요한 "use client" 남용

```typescript
// ❌ 잘못됨 — 정적 콘텐츠에 불필요한 클라이언트 컴포넌트
"use client";
export default function StaticHero() {
  return <h1>링크드롭 웹소설 AI 서비스</h1>; // 상태·이벤트 없음
}

// ✅ 올바름 — Server Component로 유지 (번들 크기 감소)
export default function StaticHero() {
  return <h1>링크드롭 웹소설 AI 서비스</h1>;
}
```

### 안티패턴 3-B: 서버 컴포넌트에서 브라우저 API 사용

```typescript
// ❌ 잘못됨 — 서버에서 window 접근 불가
export default function Page() {
  const width = window.innerWidth; // ReferenceError
  return <div>{width}</div>;
}

// ✅ 올바름 — 클라이언트 컴포넌트로 분리
"use client";
export default function WindowWidth() {
  const [width, setWidth] = useState(0);
  useEffect(() => { setWidth(window.innerWidth); }, []);
  return <div>{width}</div>;
}
```

### 안티패턴 3-C: Suspense 없이 async Server Component

```typescript
// ❌ 잘못됨 — 느린 API로 인한 전체 페이지 블로킹
export default async function Page() {
  const data = await slowApiCall(); // 3초 대기
  return <Content data={data} />;
}

// ✅ 올바름 — Suspense로 스트리밍
export default function Page() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AsyncContent />
    </Suspense>
  );
}
```

---

## 4. CSS / 스타일링 안티패턴 (V2 기준)

### 안티패턴 4-A: Left border accent 패턴

```css
/* ❌ 금지 — AI 생성 티 1순위, 링크드랍 영구 금지 */
.info-card {
  border-left: 4px solid #6fff00;
}

/* ✅ 대체 — 배지 + 아이콘 조합 */
.info-card {
  /* 테두리 없이 내부 배지로 강조 */
}
```

### 안티패턴 4-B: 단색 배경으로 blob scene 차단

```css
/* ❌ 잘못됨 — blob scene을 완전히 가림 */
.section {
  background: rgba(1, 8, 40, 0.96); /* 96% 불투명 */
}

/* ✅ 올바름 — glass 표면 유지 */
.section {
  background: var(--glass-white);
  backdrop-filter: var(--blur-md);
}
```

### 안티패턴 4-C: Glass 속성 인라인 직접 작성

```typescript
// ❌ 잘못됨 — LD-006 위반
<div style={{
  background: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.25)"
}}>

// ✅ 올바름 — .ld-glass 클래스 사용
<div className="ld-glass">
```

---

## 5. 보안 안티패턴

### 안티패턴 5-A: 환경변수 클라이언트 노출

```typescript
// ❌ 잘못됨 — NEXT_PUBLIC_ 없는 변수가 클라이언트에 노출
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY; // 서버 전용이어야 함

// ✅ 올바름 — 공개 변수만 NEXT_PUBLIC_ 접두사
const url = process.env.NEXT_PUBLIC_SUPABASE_URL; // 공개 OK
const key = process.env.SUPABASE_SERVICE_KEY;      // 서버에서만 사용
```

### 안티패턴 5-B: 오픈 리다이렉트

```typescript
// ❌ 잘못됨 — 외부 URL로 리다이렉트 가능
const next = searchParams.get('next');
redirect(next); // next=https://phishing.site

// ✅ 올바름 — 내부 경로만 허용
const next = searchParams.get('next') ?? '/';
const safePath = next.startsWith('/') ? next : '/';
redirect(safePath);
```

### 안티패턴 5-C: XSS — dangerouslySetInnerHTML 무검증

```typescript
// ❌ 잘못됨 — 사용자 입력을 그대로 HTML로 삽입
<div dangerouslySetInnerHTML={{ __html: userComment }} />

// ✅ 올바름 — 텍스트 노드로 렌더링 또는 DOMPurify 사용
<p>{userComment}</p>
// 또는
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userComment) }} />
```

---

## 6. 접근성 안티패턴

### 안티패턴 6-A: 아이콘 전용 버튼에 레이블 없음

```typescript
// ❌ 잘못됨 — 스크린 리더가 버튼 목적 파악 불가
<button onClick={handleClose}>
  <XIcon size={20} />
</button>

// ✅ 올바름 — aria-label 추가
<button onClick={handleClose} aria-label="닫기">
  <XIcon size={20} />
</button>
```

### 안티패턴 6-B: 색상만으로 상태 전달

```typescript
// ❌ 잘못됨 — 색맹 사용자가 상태 구분 불가
<span style={{ color: isActive ? 'green' : 'red' }}>
  {label}
</span>

// ✅ 올바름 — 아이콘·텍스트와 함께 사용
<span className={isActive ? 'status-active' : 'status-inactive'}>
  {isActive ? '✓ 활성' : '✗ 비활성'}
</span>
```

---

## 문제 해결 가이드

| 증상 | 원인 | 해결 |
|------|------|------|
| 무한 리렌더링 | 인라인 객체·함수 | useMemo, useCallback, 상수 분리 |
| 하이드레이션 불일치 | SSR/CSR 상태 차이 | useEffect로 클라이언트 초기화 |
| 번들 크기 증가 | 불필요한 "use client" | Server Component로 전환 |
| 타입 오류 전파 | any 사용 | unknown + 타입 가드 |
| blob scene 소멸 | 불투명 배경 | var(--glass-white) 사용 |
