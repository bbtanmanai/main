---
name: code-reviewer
description: TypeScript, JavaScript, Python, Swift, Kotlin, Go 코드 리뷰 스킬. PR 리뷰, 코드 피드백, 보안 취약점 탐지, 성능 분석, 코딩 표준 검사, 리뷰 리포트 생성을 지원합니다. PR 리뷰, 코드 리뷰, 품질 점검 요청 시 사용합니다.
---

# 코드 리뷰어

TypeScript, React, Next.js, Python 등 현대 웹 스택에 최적화된 코드 리뷰 툴킷입니다.

## 빠른 시작

### 주요 기능

세 가지 자동화 스크립트를 통해 코드 리뷰를 수행합니다:

```bash
# 스크립트 1: PR 분석기
python scripts/pr_analyzer.py <대상경로> [옵션]

# 스크립트 2: 코드 품질 검사기
python scripts/code_quality_checker.py <대상경로> [--verbose]

# 스크립트 3: 리뷰 리포트 생성기
python scripts/review_report_generator.py <대상경로> [옵션]
```

---

## 핵심 기능

### 1. PR 분석기 (pr_analyzer.py)

변경된 파일을 분석하고 리뷰 우선순위를 자동으로 판별합니다.

**주요 기능:**
- 변경 파일 목록 자동 파악
- 영향 범위 분석 (컴포넌트 의존성 추적)
- 복잡도 급증 경고
- 테스트 커버리지 누락 탐지

**사용법:**
```bash
python scripts/pr_analyzer.py ./apps/web/src --verbose
```

---

### 2. 코드 품질 검사기 (code_quality_checker.py)

TypeScript/JavaScript 코드의 품질 문제를 자동으로 탐지합니다.

**주요 기능:**
- `any` 타입 남용 탐지
- 미사용 변수·import 검출
- 중첩 콜백 (콜백 지옥) 경고
- console.log 프로덕션 잔류 경고
- 하드코딩된 시크릿·URL 탐지
- 인라인 CSS 정적 값 탐지 (design-principles.md §3-A 기준)

**사용법:**
```bash
python scripts/code_quality_checker.py ./apps/web/src --verbose
python scripts/code_quality_checker.py ./apps/web/src --json -o report.json
```

---

### 3. 리뷰 리포트 생성기 (review_report_generator.py)

코드 리뷰 결과를 구조화된 마크다운 리포트로 출력합니다.

**주요 기능:**
- 심각도별(critical/warning/info) 이슈 분류
- 수정 권장 코드 스니펫 포함
- 파일별·카테고리별 요약
- JSON 출력 지원

**사용법:**
```bash
python scripts/review_report_generator.py ./apps/web/src --analyze
python scripts/review_report_generator.py ./apps/web/src --json -o review.json
```

---

## 참조 문서

### 코드 리뷰 체크리스트

`references/code_review_checklist.md` — PR 머지 전 필수 확인 항목:

- 타입 안전성 검사
- 보안 취약점 체크
- 성능 최적화 확인
- 접근성(a11y) 점검
- 테스트 커버리지 확인

### 코딩 표준

`references/coding_standards.md` — 프로젝트 코딩 규칙:

- TypeScript/React 명명 규칙
- 컴포넌트 구조 원칙
- CSS 아키텍처 규칙 (inline style 금지 등)
- 파일 구조 가이드
- 커밋 메시지 형식

### 공통 안티패턴

`references/common_antipatterns.md` — 피해야 할 패턴:

- React 렌더링 성능 함정
- TypeScript 타입 우회 패턴
- 보안 취약점 패턴
- CSS 설계 위반 패턴
- 접근성 저해 패턴

---

## 기술 스택

**언어:** TypeScript, JavaScript, Python, Go, Swift, Kotlin
**프론트엔드:** React, Next.js (App Router), React Native, Flutter
**백엔드:** Node.js, Express, GraphQL, REST API
**데이터베이스:** PostgreSQL, Prisma, NeonDB, Supabase
**DevOps:** Docker, Kubernetes, Terraform, GitHub Actions, CircleCI
**클라우드:** AWS, GCP, Azure

---

## 개발 워크플로우

### 1. 환경 설정

```bash
# 의존성 설치
npm install
# 또는
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
```

### 2. 품질 검사 실행

```bash
# 코드 품질 검사
python scripts/code_quality_checker.py .

# 결과 확인 후 수정 적용
```

### 3. 베스트 프랙티스 적용

다음 문서의 패턴을 따릅니다:
- `references/code_review_checklist.md`
- `references/coding_standards.md`
- `references/common_antipatterns.md`

---

## 베스트 프랙티스 요약

### 코드 품질
- 확립된 패턴 준수
- 포괄적인 테스트 작성
- 결정 사항 문서화
- 정기적인 코드 리뷰

### 성능
- 최적화 전 측정 먼저
- 적절한 캐싱 사용
- 핵심 경로 최적화
- 프로덕션 모니터링

### 보안
- 모든 입력값 검증
- 파라미터화 쿼리 사용
- 올바른 인증 구현
- 의존성 최신 유지

### 유지보수성
- 명확한 코드 작성
- 일관된 네이밍 사용
- 유용한 주석 추가 (WHY만, WHAT 금지)
- 단순하게 유지

---

## 공통 명령어

```bash
# 개발
npm run dev
npm run build
npm run test
npm run lint

# 분석
python scripts/code_quality_checker.py .
python scripts/review_report_generator.py --analyze

# 배포
docker build -t app:latest .
docker-compose up -d
kubectl apply -f k8s/
```

---

## 문제 해결

### 일반적인 문제

`references/common_antipatterns.md`의 문제 해결 섹션을 참조하세요.

### 도움 받기

- 참조 문서 검토
- 스크립트 출력 메시지 확인
- 기술 스택 문서 참조
- 에러 로그 검토

---

## 리소스

- 패턴 참조: `references/code_review_checklist.md`
- 워크플로우 가이드: `references/coding_standards.md`
- 기술 가이드: `references/common_antipatterns.md`
- 스크립트: `scripts/` 디렉토리
