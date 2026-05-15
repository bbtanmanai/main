---
# V2 Commands 인덱스
> **이 파일은 인덱스다. 내용을 직접 쓰지 말 것.**
> 커맨드 추가 시 → 해당 .md 생성 후 아래 표에 한 줄만 추가.
> 커맨드 파일 위치: `C:\LinkDropV2\.claude\commands\`
---

## 1. V2 워크플로우

> 세션 관리·검증·배포 전 필수 실행 커맨드. 매 작업마다 사용.

| 커맨드 | 파일 | 설명 |
|--------|------|------|
| `/checkpoint` | [checkpoint.md](checkpoint.md) | 작업 스냅샷 생성·확인·목록 (`.claude/checkpoints.log`) |
| `/save-session` | [save-session.md](save-session.md) | 세션 전체 컨텍스트를 파일로 저장 — 다음 대화에서 이어받기 |
| `/verify` | [verify.md](verify.md) | TypeScript·ESLint·Secrets·git 상태 전체 검증 + PASS/FAIL 리포트 |
| `/qa-feature` | [qa-feature.md](qa-feature.md) | 기능 검증 — 수용 기준·LD 준수·UI 동작·회귀 위험 점검. executor 완료 선언 전 필수 |

---

## 2. 개발·코드

> UI 작업·쿼리 작성·테스트·데이터 생성 등 코드 레벨 작업.

| 커맨드 | 파일 | 설명 |
|--------|------|------|
| `/ui-refactor` | [ui-refactor.md](ui-refactor.md) | Refactoring UI 원칙 적용 UI 리팩터링 |
| `/ui-review` | [ui-review.md](ui-review.md) | UI 디자인·접근성·LD 준수 검토 |
| `/write-query` | [write-query.md](write-query.md) | DB 쿼리 작성 (Supabase·SQL) |
| `/test-scenarios` | [test-scenarios.md](test-scenarios.md) | 테스트 시나리오 작성 |
| `/analyze-test` | [analyze-test.md](analyze-test.md) | A/B 테스트 결과 분석 |
| `/generate-data` | [generate-data.md](generate-data.md) | 더미·목업 데이터 생성 |

---

## 3. 제품·기획

> PRD·스토리·스프린트·로드맵 등 제품 개발 사이클 작업.

| 커맨드 | 파일 | 설명 |
|--------|------|------|
| `/write-prd` | [write-prd.md](write-prd.md) | PRD 작성 |
| `/write-stories` | [write-stories.md](write-stories.md) | 유저 스토리 작성 |
| `/sprint` | [sprint.md](sprint.md) | 스프린트 계획 수립 |
| `/plan-launch` | [plan-launch.md](plan-launch.md) | 런치 계획 수립 |
| `/plan-okrs` | [plan-okrs.md](plan-okrs.md) | OKR 수립 |
| `/transform-roadmap` | [transform-roadmap.md](transform-roadmap.md) | 로드맵 전환·재구성 |
| `/triage-requests` | [triage-requests.md](triage-requests.md) | 요청 우선순위 분류 |

---

## 4. 전략·비즈니스

> 비즈니스 모델·경쟁 전략·가격·가치 제안 등 사업 전략 작업.

| 커맨드 | 파일 | 설명 |
|--------|------|------|
| `/business-model` | [business-model.md](business-model.md) | 비즈니스 모델 설계 |
| `/competitive-analysis` | [competitive-analysis.md](competitive-analysis.md) | 경쟁사 분석 |
| `/battlecard` | [battlecard.md](battlecard.md) | 경쟁사 배틀카드 작성 |
| `/growth-strategy` | [growth-strategy.md](growth-strategy.md) | 그로스 전략 수립 |
| `/strategy` | [strategy.md](strategy.md) | 사업 전략 수립 |
| `/pricing` | [pricing.md](pricing.md) | 가격 전략 설계 |
| `/north-star` | [north-star.md](north-star.md) | 북극성 지표 설정 |
| `/value-proposition` | [value-proposition.md](value-proposition.md) | 가치 제안 정의 |
| `/pre-mortem` | [pre-mortem.md](pre-mortem.md) | 프리모텀 — 실패 시나리오 사전 점검 |
| `/stakeholder-map` | [stakeholder-map.md](stakeholder-map.md) | 이해관계자 맵 작성 |

---

## 5. 분석·리서치

> 시장·사용자·데이터 분석 및 리서치 작업.

| 커맨드 | 파일 | 설명 |
|--------|------|------|
| `/analyze-cohorts` | [analyze-cohorts.md](analyze-cohorts.md) | 코호트 분석 |
| `/analyze-feedback` | [analyze-feedback.md](analyze-feedback.md) | 사용자 피드백 분석 |
| `/market-scan` | [market-scan.md](market-scan.md) | 시장 스캔 |
| `/market-product` | [market-product.md](market-product.md) | 마켓·제품 분석 |
| `/research-users` | [research-users.md](research-users.md) | 사용자 리서치 |
| `/discover` | [discover.md](discover.md) | 사용자·시장 탐색 |
| `/interview` | [interview.md](interview.md) | 사용자 인터뷰 스크립트 작성 |
| `/brainstorm` | [brainstorm.md](brainstorm.md) | 아이디어 브레인스토밍 |
| `/setup-metrics` | [setup-metrics.md](setup-metrics.md) | 지표 체계 설정 |

---

## 6. 문서·콘텐츠

> 문서 작성·교정·법무·이력서 등 텍스트 산출물 작업.

| 커맨드 | 파일 | 설명 |
|--------|------|------|
| `/proofread` | [proofread.md](proofread.md) | 문서 교정·다듬기 |
| `/draft-nda` | [draft-nda.md](draft-nda.md) | NDA 초안 작성 |
| `/privacy-policy` | [privacy-policy.md](privacy-policy.md) | 개인정보처리방침 작성 |
| `/meeting-notes` | [meeting-notes.md](meeting-notes.md) | 회의록 정리 |
| `/review-resume` | [review-resume.md](review-resume.md) | 이력서 리뷰 |
| `/tailor-resume` | [tailor-resume.md](tailor-resume.md) | 이력서 직무 맞춤 커스터마이징 |
