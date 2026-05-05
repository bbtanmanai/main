"use client";

import { useEffect, useRef } from "react";

interface Props {
  playbackId?: string;
  src?: string;
}

export default function LdCinematicVideoBg({ playbackId, src }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<import("hls.js").default | null>(null);
  const loadedRef = useRef(false); // state 대신 ref — IntersectionObserver 클로저 안전

  const hlsSrc = playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null;
  const posterSrc = playbackId ? `https://image.mux.com/${playbackId}/thumbnail.webp?time=0` : undefined;

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const container = containerRef.current;
    if (!container) return;

    // ── 로드 시작 (MP4 직접 or Mux HLS) ─────────────────────────
    const startLoad = async (video: HTMLVideoElement) => {
      if (loadedRef.current || prefersReduced) return;
      loadedRef.current = true;

      // MP4 직접 URL
      if (src) {
        video.src = src;
        video.play().catch(() => {
          document.addEventListener("click", () => video.play(), { once: true });
        });
        return;
      }

      if (!hlsSrc) return;

      // Safari / iOS 네이티브 HLS
      const canPlayHls =
        typeof video.canPlayType === "function" &&
        video.canPlayType("application/vnd.apple.mpegurl");

      if (canPlayHls) {
        video.src = hlsSrc;
        video.play().catch(() => {
          document.addEventListener("touchstart", () => video.play(), { once: true });
        });
        return;
      }

      // Chrome / Firefox — hls.js dynamic import (초기 번들 제외)
      const { default: Hls } = await import("hls.js");
      if (!Hls.isSupported() || !videoRef.current) return;

      const hls = new Hls({ enableWorker: false, maxBufferLength: 30 });
      hlsRef.current = hls;
      hls.loadSource(hlsSrc);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(() => {
          document.addEventListener("click", () => videoRef.current?.play(), { once: true });
        });
      });
    };

    // ── IntersectionObserver — 뷰포트 기반 지연 로드 ───────────
    // rootMargin "0px 0px 50% 0px":
    //   현재 섹션(100vh) 절반 스크롤 시점에 다음 섹션 로드 시작
    //   → 사용자가 실제로 볼 때는 이미 버퍼링 완료 상태
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = videoRef.current;
          if (!video) return;

          if (entry.isIntersecting) {
            if (!loadedRef.current) {
              // 첫 진입: HLS 로드 + 재생
              startLoad(video);
            } else {
              // 재진입 (스크롤 역방향): 이미 로드됨, 재생만
              if (!prefersReduced) video.play().catch(() => {});
            }
          } else {
            // 뷰포트 이탈: 일시정지 (CPU·배터리·대역폭 절약)
            video.pause();
          }
        });
      },
      {
        rootMargin: "0px 0px 50% 0px", // 뷰포트 하단 50% 확장
        threshold: 0,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [hlsSrc, src]);

  return (
    <div ref={containerRef} className="ld-cine-video-bg" aria-hidden="true">
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        poster={posterSrc}
        preload="none"
      />
      <div className="ld-cine-vignette" />
    </div>
  );
}
