# 회원 구조 — LinkDrop V2

> 작성: 2026-05-07
> 이 파일은 회원 역할 체계·후원 트리 구조·DB 스키마를 정의한다.
> 관련 코드 작업 전 반드시 이 문서를 확인할 것.

---

## 1. 역할(Role) 체계

총 5단계. `profiles.role` 컬럼으로 관리.

| role | 명칭 | 설명 |
|------|------|------|
| `admin` | 관리자 | 전체 시스템 관리. 최상위. |
| `instructor` | 강사 | 강사 신청 승인 후 부여. 콘텐츠 제작 권한. |
| `gold_partner` | 골드파트너 | 파트너 승급 조건 충족 후 부여. |
| `partner` | 파트너 | 이용권 구매 후 부여. 후원 활동 가능. |
| `guest` | 일반회원 | 최초 가입 기본값. |

**역할 판정 (isBuyer):**
```ts
role === 'partner' || role === 'gold_partner' || role === 'instructor' || role === 'admin'
```

**잠금 결정**: `LD-011` — role 명칭·체계 변경 금지 (LOCKED_DECISIONS.md 참조)

---

## 2. 후원 트리 구조

### 핵심 규칙

- 한 회원이 **직접 후원**할 수 있는 인원: **최대 3명** (position 1·2·3)
- 트리 **깊이(단계 수)는 제한 없음** — 각 노드의 직접 자식 수만 3명으로 제한
- 이 규칙은 **DB 제약으로 강제**되며 코드로 우회 불가

### 구조 예시

```
루트 회원 (depth=1)
├── 후원 1번 (depth=2, position=1)
│   ├── 후원 1번의 1번 (depth=3, position=1)
│   ├── 후원 1번의 2번 (depth=3, position=2)
│   └── 후원 1번의 3번 (depth=3, position=3)
├── 후원 2번 (depth=2, position=2)
└── 후원 3번 (depth=2, position=3)
    └── ... (depth 무제한 연장 가능)
```

### 현재 실제 데이터 (2026-05-07 기준)

| depth | position | 이메일 | 역할 | 후원자 |
|-------|----------|--------|------|--------|
| 1 | 1 | bbtanmanai@gmail.com | admin | — (최상위) |
| 2 | 1 | bbtanman@gmail.com | instructor | bbtanmanai |
| 3 | 1 | venom9833@gmail.com | partner | bbtanman |
| 4 | 1 | obbman5@gmail.com | guest | venom9833 |

---

## 3. 스필오버 (Spillover)

### 정의

후원자의 직라인 3자리(position 1·2·3)가 **모두 찬 경우**, 새로 추가되는 회원을
후원자 본인의 자리가 아닌 **하위 트리의 빈 자리에 자동 배치**하는 것.

### 탐색 방식: 너비 우선 (Breadth-First)

같은 깊이(depth)의 빈 자리를 왼쪽(position 1)부터 순서대로 먼저 채운 뒤,
모두 찬 경우 한 단계 아래로 내려가 동일하게 반복한다.

```
[예시] A의 직라인이 꽉 찬 상태에서 신규 회원 '신규'를 A 아래에 추가

A
├── B (pos 1) ← B의 pos 2 먼저 탐색
│   ├── E (pos 1, 기존)
│   ├── 신규 ← 여기 배치 (B의 pos 2가 비어있으므로)
│   └── (pos 3, 비어있음)
├── C (pos 2)
└── D (pos 3)

탐색 순서: A의 pos 1,2,3 확인 → 꽉 참
           → depth+1: B의 pos 1,2,3 확인 → pos 2 비어있음 → 배치
```

### BFS 배치 알고리즘 (구현 기준)

```ts
// 1. BFS 큐에 후원자(기준 노드)를 넣는다
// 2. 큐에서 노드를 꺼낸다
// 3. 해당 노드의 직라인 중 빈 position(1→2→3 순)이 있으면 → 거기에 배치
// 4. 없으면 해당 노드의 자식 3명을 큐에 추가하고 2번으로 돌아간다
async function findSpilloverSlot(referrerId: string): Promise<{parentId: string, position: number}> {
  const queue = [referrerId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const taken = await getDirectReferrals(current); // position 목록 조회
    const takenPositions = taken.map(r => r.position);
    for (const pos of [1, 2, 3]) {
      if (!takenPositions.includes(pos)) return { parentId: current, position: pos };
    }
    queue.push(...taken.map(r => r.user_id)); // 자식 3명을 큐에 추가
  }
  throw new Error("빈 슬롯 없음 (발생 불가)");
}
```

### 스필오버 수혜자

BFS 배치로 새 회원이 B의 자식으로 들어가면, **B가 직접 후원한 것과 동일한 효과**를 가진다.
(B의 직접 수당 대상이 됨)

### 배치 원칙 — 자동 배정이 절대 원칙

| 구분 | 배치 방식 | 개입 주체 |
|------|-----------|-----------|
| 일반 신규 회원 | BFS 자동 배정 | 시스템 (개입 불가) |
| 고아 회원 | 관리자 수동 배치 | Admin only |

**고아 회원(orphan)**: referrer 정보가 없거나 알 수 없는 회원.
직접 방문 가입(추천인 없음), 데이터 유실, 시스템 오류 등으로 발생.

### 수동 배치 제한 — 법적 근거 확보 목적

- 수동 배치는 **고아 회원에 한해서만** 허용
- 일반 회원을 관리자가 임의로 유리한 위치에 배치하는 것은 **엄격히 금지**
- 수동 배치 시 **배치 사유를 반드시 기록** (향후 법적 분쟁 대비 감사 로그)
- 구현 시 admin 수동 배치 액션은 별도 로그 테이블에 기록해야 함

```ts
// 수동 배치 허용 조건 (코드 레벨 체크)
if (user.referrals !== null) {
  throw new Error("고아 회원이 아닌 회원은 수동 배치 불가");
}
// 배치 후 감사 로그 기록 필수
await insertPlacementLog({ userId, placedBy: adminId, reason, placedAt: now() });
```

---

## 4. referrals 테이블 스키마

```sql
CREATE TABLE referrals (
  user_id     uuid PRIMARY KEY,  -- 후원받은 회원 (profiles.id FK)
  referrer_id uuid,              -- 직접 후원한 회원 (1촌)
  parent_id   uuid,              -- 트리 상위 노드
  position    integer,           -- 후원자의 몇 번째 자리 (1·2·3)
  depth       integer DEFAULT 1, -- 트리 깊이 (루트=1)
  created_at  timestamptz DEFAULT now()
);
```

### DB 제약 (강제 규칙)

```sql
-- position은 반드시 1, 2, 3 중 하나
CONSTRAINT referrals_position_range CHECK (position BETWEEN 1 AND 3)

-- 동일 후원자의 같은 position 중복 불가 → 3명 초과 INSERT 자동 거부
CONSTRAINT referrals_referrer_position_unique UNIQUE (referrer_id, position)
```

---

## 4. 후원 등록 시 주의사항

신규 후원 등록 UI·API 작성 시:

1. **빈 슬롯 확인**: 해당 후원자의 position 1·2·3 중 비어있는 자리 조회
   ```sql
   SELECT position FROM referrals WHERE referrer_id = $후원자ID;
   -- 반환된 position 외의 번호가 빈 슬롯
   ```
2. **3자리 모두 찬 경우**: DB INSERT 자체가 `referrals_referrer_position_unique` 위반으로 거부됨
3. **depth 계산**: `referrer의 depth + 1`

---

## 5. 수당 구조 현황

- **직접 수당(direct)**: 활성 — 후원자가 피후원자의 구매 시 수당 발생
- **팀 후원 보너스(upline_bonus)**: ⚠️ **보류** — 법적 근거 부족
  - referrals 관계 데이터는 유지하되, 상위 라인 수당 지급 로직은 구현하지 않음
  - 관련 메모리: `memory/project_upline_bonus_hold.md`
