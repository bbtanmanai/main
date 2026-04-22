"use client";

// ============================================================
// LdStatusStepper — 진행 단계 표시 컴포넌트
// LD-004: 4색 상수 고정 (변경 금지)
// 수평(데스크톱) / 수직(모바일) 자동 전환
// success: 완료(초록) / active: 진행중(인디고) / pending: 대기(노랑) / error: 오류(빨강)
// ============================================================

// LD-004: 4색 상수 — 절대 변경 금지
const STEP_COLORS = {
  success: "#10b981", // emerald-500 — 완료 단계
  active: "#6366f1",  // indigo-500 — 현재 진행 중인 단계
  pending: "#eab308", // yellow-500 — 아직 시작 안 한 단계
  error: "#ef4444",   // red-500 — 오류 발생 단계
} as const;

// 각 단계의 상태 타입
type StepStatus = keyof typeof STEP_COLORS;

// 단계 데이터 구조
export interface Step {
  label: string;
  status: StepStatus;
}

interface LdStatusStepperProps {
  steps: Step[];
  // 세로 방향 강제 여부 (기본: 가로)
  vertical?: boolean;
}

// 단계 상태에 따른 아이콘 렌더링 함수
function StepIcon({ status, index }: { status: StepStatus; index: number }) {
  const color = STEP_COLORS[status];
  const size = 36;

  if (status === "success") {
    // 완료: 체크 마크 아이콘
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: `${color}22`, // 배경색 투명도 낮게
          border: `2px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      </div>
    );
  }

  if (status === "error") {
    // 오류: X 마크 아이콘
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: `${color}22`,
          border: `2px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </div>
    );
  }

  if (status === "active") {
    // 진행중: 점 3개 (로딩 표시)
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: `${color}22`,
          border: `2px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          flexShrink: 0,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              backgroundColor: color,
              animation: `ld-stepper-pulse ${0.8 + i * 0.2}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>
    );
  }

  // pending: 단계 번호 표시
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: `${color}22`,
        border: `2px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          color,
        }}
      >
        {index + 1}
      </span>
    </div>
  );
}

export default function LdStatusStepper({ steps, vertical = false }: LdStatusStepperProps) {
  return (
    <>
      {/* 수평/수직 전환을 위한 미디어 쿼리 포함 컨테이너 */}
      <div
        className="ld-stepper-container"
        style={{
          display: "flex",
          flexDirection: vertical ? "column" : "row",
          alignItems: vertical ? "flex-start" : "center",
          gap: vertical ? 0 : 0,
          width: "100%",
        }}
      >
        {steps.map((step, i) => (
          <div
            key={i}
            className="ld-stepper-item"
            style={{
              display: "flex",
              flexDirection: vertical ? "row" : "column",
              alignItems: "center",
              flex: vertical ? "none" : 1,
              gap: vertical ? 12 : 8,
              position: "relative",
            }}
          >
            {/* 단계 아이콘 */}
            <StepIcon status={step.status} index={i} />

            {/* 단계 레이블 */}
            <span
              style={{
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                fontSize: 14,
                fontWeight: step.status === "active" ? 700 : 500,
                color:
                  step.status === "active"
                    ? STEP_COLORS.active
                    : step.status === "success"
                    ? STEP_COLORS.success
                    : "#6b7280",
                textAlign: vertical ? "left" : "center",
                whiteSpace: "nowrap",
              }}
            >
              {step.label}
            </span>

            {/* 단계 사이 연결선 — 마지막 단계 제외 */}
            {i < steps.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  // 수평: 아이콘 우측 / 수직: 아이콘 하단
                  ...(vertical
                    ? {
                        left: 17,       // 아이콘 중앙 (36/2 = 18px, border 1px 고려)
                        top: 36,        // 아이콘 높이
                        width: 2,
                        height: 32,
                        background: `linear-gradient(${STEP_COLORS[step.status]}, ${STEP_COLORS[steps[i+1].status]})`,
                      }
                    : {
                        top: 17,        // 아이콘 세로 중앙
                        left: "calc(50% + 20px)", // 아이콘 우측 끝
                        right: "calc(-50% + 20px)",
                        height: 2,
                        background: `linear-gradient(90deg, ${STEP_COLORS[step.status]}, ${STEP_COLORS[steps[i+1].status]})`,
                      }),
                  opacity: 0.4,
                }}
              />
            )}
          </div>
        ))}
      </div>

    </>
  );
}
