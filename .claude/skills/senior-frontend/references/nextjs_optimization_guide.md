# Next.js 15 최적화 가이드

## 개요

Next.js 15 App Router 환경에서의 성능 최적화 전략을 정리합니다.
V2 LinkDrop 프로젝트(마케팅 랜딩 + 회원 영역) 기준으로 작성되었습니다.

---

## 1. 이미지 최적화 (next/image)

### 필수 패턴

```typescript
import Image from "next/image";

// ✅ 올바름 — next/image 사용 + 크기 명시
<Image
  src="/images/hero-visual.webp"
  alt="링크드랍 AI 웹소설 플랫폼"
  width={1200}
  height={800}
  priority     // above-the-fold 이미지에만 적용
  className="rounded-xl"
/>

// ✅ 동적 크기 (fill 모드)
<div className="relative aspect-video">
  <Image src={thumbnailUrl} alt={title} fill className="object-cover rounded-xl" />
</div>

// ❌ 금지 — <img> 태그 직접 사용 (최적화 없음)
<img src="/images/hero.jpg" alt="..." />
```

### 외부 도메인 허용 (next.config)

```javascript
// next.config.mjs
const config = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "drive.google.com" },
    ],
  },
};
```

### LCP 최적화

- hero 섹션 이미지에만 `priority` 속성 사용 (과남용 금지 — 다른 이미지 지연 로드 방해)
- WebP 포맷 우선 사용
- 모바일 뷰포트용 `sizes` 속성 명시

---

## 2. 폰트 최적화 (next/font)

```typescript
// app/layout.tsx
import { Anton } from "next/font/google";
import localFont from "next/font/local";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",      // FOUT 허용 (레이아웃 시프트 방지)
  variable: "--font-anton",
});

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  display: "swap",
  variable: "--font-pretendard",
  weight: "100 900",    // Variable 폰트 범위
});
```

**V2 폰트 규칙 (LD-007):**
- Anton: 영문 대형 헤딩 전용
- Pretendard Variable: 한글·영문·숫자 전체 통합

---

## 3. Cache 전략

### 3-A: 정적 데이터 — generateStaticParams

```typescript
// app/(public)/landing/[slug]/page.tsx
import landingsData from "@/data/landings.json";

// 빌드 시 모든 슬러그 정적 생성
export async function generateStaticParams() {
  return landingsData.map((l) => ({ slug: l.slug }));
}

// revalidate 없음 = 빌드 시 완전 캐시 (ISR 불필요)
export default function LandingPage({ params }: { params: { slug: string } }) {
  const data = landingsData.find((l) => l.slug === params.slug);
  return <LandingContent data={data} />;
}
```

### 3-B: 동적 데이터 — fetch + revalidate

```typescript
// Server Component에서 캐시된 fetch
async function fetchUserProfile(userId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles`, {
    headers: { apikey: process.env.SUPABASE_ANON_KEY! },
    next: { revalidate: 60 }, // 60초 캐시
  });
  return res.json();
}
```

### 3-C: 마케팅 페이지 — 완전 정적 (V2 원칙)

```typescript
// V2 마케팅 랜딩 — 모든 콘텐츠는 src/data/*.json
// Supabase 직접 호출 금지 (LD-005)
// export const dynamic = "force-static"  ← 기본값이므로 생략 가능
```

---

## 4. Server Component 데이터 패칭

### 4-A: 병렬 fetch — Promise.all

```typescript
// ❌ 순차 fetch — 총 3초 대기
const user = await fetchUser(id);        // 1초
const orders = await fetchOrders(id);   // 1초
const referrals = await fetchReferrals(id); // 1초

// ✅ 병렬 fetch — 최대 1초
const [user, orders, referrals] = await Promise.all([
  fetchUser(id),
  fetchOrders(id),
  fetchReferrals(id),
]);
```

### 4-B: Suspense 경계로 점진적 렌더링

```typescript
// member/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* 즉시 렌더 */}
      <LdDashboardHeader />
      {/* 느린 데이터만 Suspense로 감쌈 */}
      <Suspense fallback={<PartnerStatsSkeleton />}>
        <PartnerStatsSection />
      </Suspense>
      <Suspense fallback={<OrderHistorySkeleton />}>
        <OrderHistorySection />
      </Suspense>
    </div>
  );
}
```

---

## 5. Metadata API

### 5-A: 정적 메타데이터

```typescript
// app/(public)/landing/[slug]/page.tsx
import type { Metadata } from "next";
import landingsData from "@/data/landings.json";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const landing = landingsData.find((l) => l.slug === params.slug);
  return {
    title: `${landing?.title} | 링크드랍`,
    description: landing?.description,
    openGraph: {
      title: landing?.title,
      description: landing?.description,
      images: [{ url: landing?.ogImage ?? "/og-default.png" }],
    },
  };
}
```

### 5-B: robots.txt / sitemap

```typescript
// app/sitemap.ts
export default function sitemap() {
  const landings = landingsData.map((l) => ({
    url: `https://linkdrop.co/landing/${l.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  return [
    { url: "https://linkdrop.co", lastModified: new Date(), priority: 1 },
    ...landings,
  ];
}
```

---

## 6. 번들 최적화

### 6-A: Tree Shaking 확인

```typescript
// ❌ 전체 라이브러리 import — 번들 크기 증가
import _ from "lodash";
const result = _.debounce(fn, 300);

// ✅ 필요한 함수만 import
import debounce from "lodash/debounce";
```

### 6-B: 서버 전용 코드 분리

```typescript
// lib/supabase-server.ts
import "server-only"; // 클라이언트 번들에 포함 시 빌드 에러
import { createServerClient } from "@supabase/ssr";
```

### 6-C: 클라이언트 번들 크기 모니터링

```bash
# 번들 분석 (next-bundle-analyzer 설치 후)
ANALYZE=true npm run build

# 또는 스크립트 사용
python scripts/bundle_analyzer.py ./apps/web --verbose
```

---

## 7. Core Web Vitals 최적화

| 지표 | 목표 | V2 전략 |
|------|------|---------|
| LCP | < 2.5s | hero 이미지 priority, 폰트 preload |
| FID/INP | < 200ms | useTransition, 무거운 핸들러 분리 |
| CLS | < 0.1 | 이미지 size 명시, 폰트 display:swap |
| TTFB | < 600ms | 정적 생성(SSG) 최대화, CDN 활용 |

### 폰트로 인한 CLS 방지

```css
/* globals.css */
@font-face {
  font-family: "Pretendard Variable";
  src: url("/fonts/PretendardVariable.woff2") format("woff2-variations");
  font-display: swap;
  font-weight: 100 900;
}
```

---

## 8. 라우트 구조 최적화

### 8-A: Route Groups으로 레이아웃 분리

```
app/
  (public)/        ← 마케팅 페이지 (GNB + blob scene)
    landing/
    homepage/
    about/
  (auth)/          ← 인증 페이지 (minimal layout)
    login/
  member/          ← 회원 페이지 (LgShell layout)
  partner/
  admin/
```

### 8-B: 병렬 라우트 (@slot)

```
app/member/
  @stats/          ← 통계 슬롯 (독립 스트리밍)
    page.tsx
  @referrals/      ← 추천 슬롯
    page.tsx
  layout.tsx       ← 두 슬롯을 받는 레이아웃
```

---

## 성능 체크리스트

- [ ] hero 이미지에 `priority` 속성
- [ ] `<img>` 태그 → `next/image` 교체
- [ ] 200줄+ 컴포넌트 dynamic import 적용
- [ ] 마케팅 페이지 Supabase 직접 호출 없음 (LD-005)
- [ ] `generateStaticParams` 모든 동적 슬러그 등록
- [ ] 폰트 `display: swap` 설정
- [ ] Suspense 경계로 느린 Server Component 분리
