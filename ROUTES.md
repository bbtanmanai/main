# LinkDrop V2 — 라우트 목록

> 개발 서버: `http://localhost:3000`  
> 프로덕션: `https://linkdrop.kr`  
> 최종 업데이트: 2026-04-22

---

## (public) — 공개 마케팅 라우트

SSG(정적 생성) / 비로그인 접근 가능 / 다크·라이트 테마 선택


│         landing1          ① 웹소설 작가로 월 수익 만들기, 블로그·브런치 연재
│         landing2          ② 나만의 경험치, 노하우로 전자책 출간, 목차·초안 작성, 내 경험으로 살 붙이기
│         landing3          ③ 동화책 제작
│         landing4          ④ AI 기초 활용 클래스 운영, 강의 스크립트·PPT 초안 자동 생성
│         landing5          ⑤ 유튜브 쇼츠 제작, 자막·썸네일·스크립트 자동 생성, 경험담 영상화          
│         landing6          ⑥ 바이브코딩으로 웹사이트,웹앱 만들기
│         landing7          ⑦ 디지털 구술 생애사 기록가 (Oral History Archivist)
│         landing8          ⑧ 지역 소상공인 SNS 관리 대행, 1인기업 마케팅·CS 자동화
│         landing9          ⑨ 나만의 트레이딩 노하우를 담은 주식, 암호화폐 자동매매 솔루션 커뮤니티 운영
│         landing10        ⑩ 나만의 온라인 부업 주제정하기

### 랜딩 페이지 공통 섹션 구조 (9섹션)

| 섹션 | 컴포넌트 | 설명 |
|------|----------|------|
| §1 Hero | `LdHeroSection` | 눈길 끌기 — 주제별 헤딩 + CTA |
| §2 Pain | `LdProblemEmpathySection` | 공감 — 3가지 고민 카드 |
| §3 Pipeline | `LdV3PipelineSection` | 해결책 — AI 3단계 프로세스 |
| §4 Growth | `LdGrowthPathSection` | 성장 경로 — 4단계 스테퍼 |
| §5 Simulator | `LdSimulatorSection` | 수익 시뮬레이터 — 슬라이더 2개 |
| §6 Proof | `LdProofSection` | 사용자 후기 3개 |
| §7 Pricing | `LdPricingSection` | 가격 — 정가→런칭가 카운트업 |
| §8 FAQ | `LdFAQSection` | 공통 5개 + 주제별 2개 아코디언 |
| §9 Final CTA | `LdFinalCTASection` | 카카오톡 최종 CTA |

---

## (auth) — 인증 라우트

CSR / 비로그인 전용 (로그인 후 접근 시 대시보드로 리다이렉트 예정)

| URL | 파일 | 설명 |
|-----|------|------|
| `/login` | `src/app/(auth)/login/page.tsx` | 로그인 — 이메일 + 비밀번호, Eye/EyeOff 토글, Supabase Auth |
| `/signup` | `src/app/(auth)/signup/page.tsx` | 회원가입 — 이름 + 이메일 + 비밀번호 + 이용약관 동의 |

---

## (checkout) — 결제 라우트

라이트 테마 강제 (LD-002) / 결제 신뢰감·가독성 보장

| URL | 파일 | 설명 |
|-----|------|------|
| `/order` | `src/app/(checkout)/order/page.tsx` | 주문 확인 — 상품 정보 + 구매자 정보 입력, LdStatusStepper |
| `/payment` | `src/app/(checkout)/payment/page.tsx` | 결제 — 토스페이먼츠 위젯 영역 (SDK 키 연동 대기) |
| `/complete` | `src/app/(checkout)/complete/page.tsx` | 결제 완료 — 완료 안내 + 콘텐츠 바로가기 |

### 결제 플로우 상태 (LdStatusStepper)

```
주문 확인 →  결제 처리  →  완료
 active      pending      pending   (order 페이지)
 success      active      pending   (payment 페이지)
 success      success      active   (complete 페이지)
```

---

## (member) — 구매자 마이페이지

SSR / 로그인 필수 (Supabase 세션 검증 — middleware.ts 연동 대기)

| URL | 파일 | 설명 |
|-----|------|------|
| `/dashboard` | `src/app/(member)/dashboard/page.tsx` | 대시보드 — 환영 메시지 + 구매 내역 + 파트너 초대 현황 |
| `/content` | `src/app/(member)/content/page.tsx` | 구매 콘텐츠 목록 — 접근 링크 제공 |
| `/referral` | `src/app/(member)/referral/page.tsx` | 파트너 초대 — 초대 링크 복사 + 현황 통계 |

---

## (partner) — 파트너 수당 대시보드

SSR / role=partner 이상

| URL | 파일 | 설명 |
|-----|------|------|
| `/earnings` | `src/app/(partner)/earnings/page.tsx` | 수당 현황 — 직접판매(파랑) / 후원(주황) / 강의(초록) 3색 카드 + 월별 바 차트 |
| `/network` | `src/app/(partner)/network/page.tsx` | 파트너 네트워크 — 1~2 depth 트리 + 신규 초대 |

---

## (instructor) — 강사 관리

SSR / role=instructor

| URL | 파일 | 설명 |
|-----|------|------|
| `/courses` | `src/app/(instructor)/courses/page.tsx` | 강의 관리 — 강의 목록 카드 (수강생 수 / 평점 / 수익) |
| `/students` | `src/app/(instructor)/students/page.tsx` | 수강생 — 테이블 (이름 / 수강일 / 진도율 / 수료 여부) |

---

## (admin) — CRM 관리자

SSR / role=admin 전용

| URL | 파일 | 설명 |
|-----|------|------|
| `/users` | `src/app/(admin)/users/page.tsx` | 회원 목록 — 검색 + 역할 필터 (member / partner / instructor) |
| `/orders` | `src/app/(admin)/orders/page.tsx` | 주문 목록 — 상태 필터 + LdStatusStepper |
| `/partners` | `src/app/(admin)/partners/page.tsx` | 파트너 관리 — 네트워크 규모 / 누적 수당 / 정산 처리 |

---

## 시스템 라우트

| URL | 파일 | 설명 |
|-----|------|------|
| `/sitemap.xml` | `src/app/sitemap.ts` | 자동 생성 — 홈 + 9개 랜딩 슬러그 |
| `/robots.txt` | `src/app/robots.ts` | 크롤링 허용 (public) / 차단 (admin·member·partner·instructor) |

---

## 잠금된 설계 결정 (참조)

| ID | 내용 |
|----|------|
| LD-001 | `defaultTheme="dark"`, `enableSystem=false` — 시스템 테마 무시 |
| LD-002 | `(checkout)` 전체 라이트 강제 — 결제 가독성·신뢰감 보장 |
| LD-003 | V3 컴포넌트 import 절대 금지 — 독립 구현 |
| LD-004 | LdStatusStepper 4색 고정 `#10b981 / #6366f1 / #eab308 / #ef4444` |
| LD-005 | `src/data/*.json` 정적 콘텐츠 — 런타임 API 조회 금지 |
| LD-006 | `.ld-glass` 단일 CSS 클래스 — JS 분기 금지 |
| LD-007 | Anton = 영문 헤딩 전용 / 한글 = Pretendard 800 |

---

## 연동 대기 항목

| 항목 | 파일 | 필요한 것 |
|------|------|-----------|
| Supabase Auth 실동작 | `src/lib/supabase.ts`, `.env.local` | SUPABASE_URL + ANON_KEY |
| 토스페이먼츠 결제 SDK | `(checkout)/payment/page.tsx` | 클라이언트 키 발급 |
| 인증 미들웨어 | `src/middleware.ts` (미생성) | Supabase 세션 검증 |
