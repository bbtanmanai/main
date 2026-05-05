# 코드 리뷰 체크리스트

## 개요

PR 머지 전 반드시 확인해야 할 항목들입니다. 심각도에 따라 CRITICAL / WARNING / INFO로 구분합니다.

---

## CRITICAL — 반드시 수정 후 머지

### 보안

- [ ] SQL 인젝션 가능성 없음 (파라미터화 쿼리 사용)
- [ ] XSS 취약점 없음 (`dangerouslySetInnerHTML` 무검증 사용 금지)
- [ ] 환경변수 하드코딩 없음 (API 키, 시크릿 직접 삽입 금지)
- [ ] 오픈 리다이렉트 없음 (URL 검증 없는 redirect 금지)
- [ ] 인증 우회 가능성 없음 (미들웨어 조건 점검)
- [ ] CORS 설정 과도하게 열려 있지 않음

### 타입 안전성

- [ ] `any` 타입 남용 없음 (불가피한 경우 `// eslint-disable-next-line` + 주석 필수)
- [ ] `as unknown as Type` 캐스팅 남용 없음
- [ ] `!` (non-null assertion) 무분별 사용 없음
- [ ] 런타임 오류 가능성 있는 타입 단언 없음

### 데이터 처리

- [ ] 사용자 입력값 서버 측 검증 완료
- [ ] SQL 쿼리에 사용자 입력 직접 삽입 없음
- [ ] 파일 업로드 확장자·크기 검증 있음
- [ ] 민감 데이터 클라이언트 노출 없음

---

## WARNING — 강력 권고 수정

### 성능

- [ ] 불필요한 리렌더링 없음 (React.memo, useMemo, useCallback 적절히 사용)
- [ ] useEffect 의존성 배열 누락 없음
- [ ] 큰 목록에 가상화(virtualization) 적용 여부 확인
- [ ] 이미지 최적화 적용 (`next/image`, WebP, srcset, lazy loading)
- [ ] 번들 크기 급증 없음 (불필요한 패키지 import 없음)
- [ ] `useEffect` 내 비동기 처리 cleanup 있음

### React / Next.js

- [ ] Server Component vs Client Component 구분 올바름
- [ ] 불필요한 `"use client"` 지시자 없음
- [ ] `key` prop이 고유하고 안정적임 (index 사용 지양)
- [ ] React 19 컨커런트 기능과 호환됨
- [ ] Suspense boundary 적절히 설정됨

### 코드 구조

- [ ] 함수/컴포넌트가 단일 책임 원칙을 따름
- [ ] 중복 로직이 없음 (DRY 원칙)
- [ ] 컴포넌트 depth가 5단계 이내
- [ ] 파일 길이가 300줄 이내 (초과 시 분리 검토)

---

## INFO — 참고 사항

### 코드 스타일

- [ ] 네이밍이 명확하고 일관적임
- [ ] 주석이 WHY를 설명함 (WHAT 주석은 제거)
- [ ] `console.log` 디버그 코드 제거됨
- [ ] 미사용 변수·import 없음
- [ ] TODO/FIXME 주석에 담당자·날짜 명시됨

### CSS / 스타일링 (V2 프로젝트 기준)

- [ ] 정적 값에 `style={{}}` 인라인 사용 없음 (design-principles.md §3-A)
- [ ] Glass 속성에 `.ld-glass` 클래스 사용 (LD-006)
- [ ] Left border accent 패턴 없음 (design-principles.md §7 금지)
- [ ] 단색 배경으로 blob scene을 가리지 않음 (design-principles.md §5)
- [ ] CSS 변수 대신 하드코딩된 색상 없음

### 접근성 (a11y)

- [ ] 이미지에 `alt` 텍스트 있음
- [ ] 폼 입력에 `label` 연결됨
- [ ] 아이콘 전용 버튼에 `aria-label` 있음
- [ ] 탭 순서가 시각적 순서와 일치함
- [ ] `prefers-reduced-motion` 감지 구현됨

### 테스트

- [ ] 새 기능에 단위 테스트 추가됨
- [ ] 엣지 케이스 테스트 포함됨
- [ ] 기존 테스트 모두 통과함
- [ ] 테스트가 구현이 아닌 동작을 검사함

---

## 리뷰 코멘트 템플릿

```
[CRITICAL] 보안 취약점: XSS 가능성
파일: apps/web/src/components/Comment.tsx:42
문제: dangerouslySetInnerHTML에 미검증 사용자 입력 삽입
수정: DOMPurify.sanitize() 적용 또는 텍스트 노드로 렌더링

[WARNING] 성능: 불필요한 리렌더링
파일: apps/web/src/components/ProductList.tsx:18
문제: useCallback 없이 자식에게 함수 전달
수정: useCallback으로 래핑하거나 컴포넌트 외부로 이동

[INFO] 코드 스타일: console.log 잔류
파일: apps/web/src/hooks/useAuth.ts:55
문제: 디버그 로그가 프로덕션 코드에 남아 있음
수정: 제거 또는 logger 유틸리티로 교체
```
