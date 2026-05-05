# V2 프로젝트 개요

> 작성: 2026-05-06

---

## 프로젝트 정의

LinkDrop V2는 **소비자 접점 앱**이다. V3가 콘텐츠를 생산하면 V2가 판다.

- **역할**: 랜딩·결제·회원·파트너·강사·CRM 소비자 접점 전담
- **작업 경로**: `C:\LinkDropV2\apps\web\` (Next.js App Router)
- **설계 문서**: `C:\LinkDropV2\docs\` (00-overview ~ 06-prototype-spec)
- **아카이브**: `C:\LinkDropV2\.claude\archives\`

---

## V3 참조 규칙 (LD-003)

- `C:\LinkDropV3` 파일은 **Read만 허용** (설계 참고용)
- V3 코드 수정·V3 모듈 import 절대 금지
- V3 LOCKED_DECISIONS(LD-001~016)는 V2와 무관 — 참조 금지
- `../../LinkDropV3/...` 경로 import 발견 시 즉시 LD-003 프로토콜 실행

---

## 라우트 구조 (현재)

```
(public)/
  page.tsx              index (/)
  homepage/             /homepage
  landing/[slug]/       /landing/landing1~10
  about/                /about
  ai-prompt/            /ai-prompt
  project/              /project
  webnovel/             /webnovel  ← 미로그인 → /?auth=1 (middleware 보호)
  recruit-teacher/
  certificate-teacher/
  privacy/ terms/ refund/
(auth)/                 /?auth=1 → LdAuthModal 진입점
(checkout)/             /checkout/*
(member)/               /member/*  ← 로그인 필요
(partner)/              /partner/*  ← role=partner/gold_partner 필요
(instructor)/           /instructor/*
admin/(panel)/          /admin/*
```

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind v4 + CSS Modules + src/styles/ |
| 인증 | Supabase Auth (Google OAuth + Kakao OAuth) |
| DB | Supabase (회원·결제만, 마케팅 콘텐츠는 src/data/*.json) |
| 배포 | Vercel |
