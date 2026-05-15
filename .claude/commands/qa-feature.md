---
description: 구현 완료 후 기능 검증 — 수용 기준·LD 준수·UI 동작·회귀 위험 순서로 점검
---

# /qa-feature — 기능 검증 커맨드

executor가 구현 완료 선언 전 **반드시** 실행한다.
`/verify`(코드 품질)와 별개로, **기능이 요구사항을 충족하는가**를 검증한다.

---

## 실행 순서

### 1. 수용 기준 대조

BACKLOG 항목과 실제 구현을 대조한다.

```
확인 항목:
  [ ] BACKLOG의 해당 항목 비고란에 명시된 조건을 코드에서 확인
  [ ] 요청된 기능 범위를 벗어난 추가 구현이 없는지 확인
  [ ] 요청된 기능 중 누락된 항목이 없는지 확인
```

### 2. Locked Decisions (LD) 준수 확인

구현된 코드가 잠금 결정을 위반하지 않는지 점검한다.

```bash
# LD-001: 다크 테마 고정 확인
grep -n "defaultTheme\|enableSystem" apps/web/src/app/layout.tsx

# LD-006: JS 분기로 glass 처리 여부 확인
grep -rn "isDark.*glass\|isLight.*glass\|glass.*isDark" apps/web/src --include="*.tsx"

# LD-007: 한글에 Anton 폰트 적용 여부 확인
grep -rn "font-anton" apps/web/src --include="*.tsx" --include="*.css"

# LD-009: 이메일 인증 복구 여부 확인
grep -rn "signInWithPassword" apps/web/src --include="*.ts" --include="*.tsx"

# 디자인 원칙: Left Border 금지 확인
grep -rn "border-left\|borderLeft" apps/web/src/components/landing --include="*.tsx" --include="*.css"
```

위반 발견 시 → 즉시 수정 후 재검증. BACKLOG 완료 처리 금지.

### 3. UI 동작 검증 (신규 UI 있는 경우)

`browse` 스킬로 실제 브라우저에서 확인한다.

```
확인 항목:
  [ ] 해당 라우트 정상 렌더링 (404·빈 화면 없음)
  [ ] 다크 테마에서 glass 표면 정상 표시
  [ ] 모바일 뷰 (375px) 레이아웃 깨짐 없음
  [ ] 주요 인터랙션 (버튼 클릭·폼 제출·링크) 동작 확인
  [ ] 콘솔 에러 없음
```

### 4. 회귀 위험 확인

변경된 파일이 영향을 줄 수 있는 인접 기능을 점검한다.

```bash
# 변경된 파일 목록 확인
git diff --name-only HEAD

# 공통 컴포넌트 변경 시 → 사용처 전수 확인
grep -rn "import.*[변경된컴포넌트명]" apps/web/src --include="*.tsx"
```

```
회귀 체크:
  [ ] 공통 컴포넌트 수정 → 사용하는 모든 라우트 확인
  [ ] globals.css / tokens.css 수정 → 전체 테마 확인
  [ ] Supabase 스키마 변경 → 관련 쿼리 전수 확인
  [ ] middleware.ts 변경 → 인증 가드 전체 확인
```

### 5. 코드 품질 최종 확인

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -20
```

타입 에러 0개 확인 후 완료 처리.

---

## 최종 리포트 형식

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QA-FEATURE: [PASS / FAIL]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
수용 기준   : [OK / ❌ 미충족 항목]
LD 준수     : [OK / ❌ 위반 LD-XXX]
UI 동작     : [OK / ❌ 이슈 내용]
회귀 위험   : [없음 / ⚠️ 확인 필요 파일]
TypeScript  : [OK / ❌ X 오류]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
완료 처리   : [YES / NO — 이유]
```

**FAIL 항목이 하나라도 있으면 BACKLOG 완료 처리 금지.**

---

## 인수

- `$ARGUMENTS` 없음 → 전체 검증
- `quick` → LD 준수 + TypeScript만
- `ui` → UI 동작 검증만 (browse 실행)
- `ld` → Locked Decisions 준수만
