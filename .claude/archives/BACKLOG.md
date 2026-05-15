# LinkDrop V2 — 개발 백로그

> 최종 업데이트: 2026-05-14
> 규칙: 새 항목 발견 시 즉시 추가. **수용 기준(AC) 필수 작성.** 완료 시 아래 완료 요약에 날짜와 함께 한 줄로만 기록.

---

## 항목 작성 형식

새 BACKLOG 항목 추가 시 반드시 아래 형식을 따른다.
수용 기준(AC) 없이 추가된 항목은 `/qa-feature` §1 검증 불가 → 구현 시작 전 AC 먼저 작성.

```
| # | 항목 | 비고 | 수용 기준 (AC) |
|---|------|------|----------------|
| ID | 기능명 | 관련 파일·설계 문서 | [ ] 조건1 [ ] 조건2 [ ] 조건3 |
```

**수용 기준 작성 원칙:**
- 체크 가능한 구체적 조건으로 작성 ("잘 동작함" ❌ / "버튼 클릭 시 /checkout으로 이동" ✅)
- 최소 2개 이상 작성
- UI 항목은 모바일(375px) 조건 반드시 포함

---

## ⬜ 미완료 항목 (3개)

| # | 항목 | 비고 | 수용 기준 (AC) |
|---|------|------|----------------|
| TOSS | 토스페이먼츠 SDK 실제 키 연동 | payment/page.tsx placeholder 교체 | [ ] 실제 키로 결제 위젯 렌더링 [ ] 결제 완료 후 /checkout/complete 이동 [ ] 실패 시 에러 메시지 표시 |
| MKT-001 | Facebook 댓글 → Messenger DM 자동화 | Graph API Webhook 서버 + ManyChat 연동. 설계: `archives/51_V2_마케팅_채널_전략.md §2` | [ ] 키워드 댓글 감지 후 3초 내 대댓글 자동 작성 [ ] Messenger DM에 랜딩 링크 포함 [ ] 스팸 감지 없이 24시간 운영 |
| MKT-002 | 인스타그램 콘텐츠 자동 예약 파이프라인 | Buffer/Later API 또는 Meta Graph API 활용. 우선순위 1순위 | [ ] 게시물 예약 후 지정 시간에 자동 업로드 [ ] 실패 시 알림 발송 [ ] FB·IG 동시 업로드 가능 |

---

## ✅ 완료 요약

| Phase | 내용 | 완료일 |
|-------|------|--------|
| Phase 0 (P0-1~6) | Next.js 15 스캐폴드, next-themes, Pretendard, CSS 토큰, Tailwind v4, src/data JSON | 2026-04-22 |
| Phase 1 (P1-1~14, P1-16) | 마케팅 10 라우트 + 모든 섹션 컴포넌트 + expert-video 랜딩 | 2026-04-22~24 |
| Phase 2 (P2-1~3) | (auth) 로그인·회원가입 + Supabase Auth 연결 | 2026-04-22 |
| Phase 3 (P3-1~4) | (checkout) 주문·결제·완료 + LdStatusStepper | 2026-04-22 |
| Phase 4 (P4-1~3) | (member) 대시보드·콘텐츠·파트너 초대 | 2026-04-22 |
| Phase 5 (P5-1~2) | (partner) 수당 현황·파트너 네트워크 | 2026-04-22 |
| Phase 6 (P6-1~2) | (instructor) 강의 관리·수강생 | 2026-04-22 |
| Phase 7 (P7-1~3) | (admin) 회원·주문·파트너 관리 | 2026-04-22 |
| P1-15 + 모바일 GNB | prefers-reduced-motion globals.css + 햄버거 드로어 LdMobileDrawer + viewport export | 2026-04-24 |
| SUPABASE | .env.local — NEXT_PUBLIC_SUPABASE_URL + ANON_KEY 실제 값 연결 | 2026-04-24 |
| AUTH-SOCIAL-B | 소셜 로그인 UI — LdAuthModal, LdAuthBottomSheet, LdSocialButton(Kakao/Google), useAuthModal, LdAuthPanel | 2026-04-26 |
| AUTH-SOCIAL-C | OAuth 플로우 — /auth/callback/route.ts, useSession, profiles upsert(role=guest), open redirect 보안 | 2026-04-26 |
| AUTH-GUARD | middleware.ts — /member /partner /instructor /admin 미로그인 → /?auth=1 redirect, getUser() 서버 검증 | 2026-04-26 |
| LANDING7-ORAL-HISTORY | landing7 variant="oral-history" + LdOralHistoryLanding.tsx 전용 컴포넌트 신규 구현 | 2026-04-27 |
