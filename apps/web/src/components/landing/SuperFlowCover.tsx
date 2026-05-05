'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// super-flow.uiinitiative.com 데모 이미지 (임시) — 교체 예정
const IMAGES = [
  'https://super-flow.uiinitiative.com/images/01.jpg',
  'https://super-flow.uiinitiative.com/images/02.jpg',
  'https://super-flow.uiinitiative.com/images/03.jpg',
  'https://super-flow.uiinitiative.com/images/04.jpg',
  'https://super-flow.uiinitiative.com/images/05.jpg',
];

// 대각선 "flow" 와이프를 위한 clip-path 키프레임
const CP_HIDDEN = 'polygon(0% 0%, 3% 0%, 3% 100%, 0% 100%)';         // 좌측 가는 슬라이버
const CP_DIAG   = 'polygon(0% 0%, 68% -8%, 54% 108%, 0% 100%)';      // 대각선 리딩 엣지
const CP_FULL   = 'polygon(-2% -2%, 102% -2%, 102% 102%, -2% 102%)'; // 전체 + 미세 오버플로 방지

const DURATION = 1.4; // 트랜지션 시간(s)
const INTERVAL = 5000; // 슬라이드 간격(ms)

// 슬롯 div — position/inset/willChange (GSAP이 clipPath 런타임 조작하므로 인라인 유지)
const slotStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  willChange: 'transform, clip-path, opacity',
};

export default function SuperFlowCover() {
  const s0 = useRef<HTMLDivElement>(null);
  const s1 = useRef<HTMLDivElement>(null);
  const i0 = useRef<HTMLImageElement>(null);
  const i1 = useRef<HTMLImageElement>(null);
  const state = useRef({ cur: 0, active: 0, busy: false });

  useEffect(() => {
    const slots = [s0.current!, s1.current!];
    const imgs  = [i0.current!, i1.current!];
    if (!slots[0] || !slots[1] || !imgs[0] || !imgs[1]) return;

    // 초기 상태 설정
    gsap.set(slots[0], { clipPath: CP_FULL,   scale: 1,    opacity: 1 });
    gsap.set(slots[1], { clipPath: CP_HIDDEN, scale: 1.06, opacity: 1 });

    const go = () => {
      const { cur, active, busy } = state.current;
      if (busy) return;
      state.current.busy = true;

      const nextIdx = (cur + 1) % IMAGES.length;
      const curSlot = slots[active];
      const nxtSlot = slots[1 - active];
      const nxtImg  = imgs[1 - active];

      // 숨겨진 슬롯에 다음 이미지 프리로드
      nxtImg.src = IMAGES[nextIdx];

      // 숨겨진 슬롯 초기화
      gsap.set(nxtSlot, { clipPath: CP_HIDDEN, scale: 1.06, opacity: 1 });

      const tl = gsap.timeline({
        onComplete: () => {
          state.current.cur    = nextIdx;
          state.current.active = 1 - active;
          state.current.busy   = false;
        },
      });

      // 새 이미지: 대각선 플로우 와이프 (좌측 슬라이버 → 대각선 → 전체)
      tl.to(nxtSlot, {
        keyframes: [
          { clipPath: CP_DIAG, scale: 1.03, duration: DURATION * 0.55, ease: 'power2.in' },
          { clipPath: CP_FULL, scale: 1,    duration: DURATION * 0.45, ease: 'power3.out' },
        ],
      }, 0);

      // 이전 이미지: 켄 번즈 아웃 (줌인 + 페이드)
      tl.to(curSlot, {
        scale: 1.06,
        opacity: 0,
        duration: DURATION * 0.7,
        ease: 'power2.in',
      }, DURATION * 0.3);
    };

    const timer = setInterval(go, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <div aria-hidden="true" className="sfc-root">
      {/* 슬롯 0: 초기 현재 이미지 */}
      <div ref={s0} style={slotStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={i0} src={IMAGES[0]} alt="" className="sfc-img" />
      </div>

      {/* 슬롯 1: 초기 대기 이미지 (숨김 상태) — clipPath는 GSAP이 초기화하므로 정적 클래스만 */}
      <div ref={s1} style={{ ...slotStyle, clipPath: CP_HIDDEN }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={i1} src={IMAGES[1]} alt="" className="sfc-img" loading="eager" />
      </div>
    </div>
  );
}
