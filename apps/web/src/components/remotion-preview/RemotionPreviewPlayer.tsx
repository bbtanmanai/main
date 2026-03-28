'use client';

import { useEffect, useRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { AccentComposition, type AccentCompositionProps, type TimedAccent } from './AccentComposition';

export type { TimedAccent };

const FPS = 30;
const MIN_FRAMES = 90; // 최소 3초

interface Props {
  data: AccentCompositionProps;
  ratio: '16:9' | '9:16';
  displayWidth: number;
  /** 모달 확대 모드: 컨트롤 표시 + 첫 accent 직전부터 자동 재생 */
  expanded?: boolean;
  /** 외부에서 seek 요청 (모달 accent 버튼 클릭 시) */
  seekToFrame?: number;
}

export function RemotionPreviewPlayer({ data, ratio, displayWidth, expanded = false, seekToFrame }: Props) {
  const playerRef = useRef<PlayerRef>(null);
  const compW = ratio === '16:9' ? 1920 : 1080;
  const compH = ratio === '16:9' ? 1080 : 1920;
  const displayH = Math.round(displayWidth * (compH / compW));

  const durationInFrames = data.tts_duration > 0
    ? Math.max(Math.ceil(data.tts_duration * FPS), MIN_FRAMES)
    : MIN_FRAMES;

  const firstAccentSec = data.accents?.[0]?.start_sec ?? 0;

  // 썸네일: 첫 accent 중간 프레임 (정지 화면에서 accent 보이도록)
  // 모달:    첫 accent 3초 전부터 자동 재생
  const thumbnailFrame = firstAccentSec > 0
    ? Math.floor((firstAccentSec + (data.accents?.[0] ? (data.accents[0].end_sec - firstAccentSec) / 2 : 5)) * FPS)
    : 0;
  const initialFrame = expanded && firstAccentSec > 3
    ? Math.floor((firstAccentSec - 3) * FPS)
    : 0;

  // 썸네일: 첫 accent 중간으로 seek (정지)
  // 모달:   첫 accent 직전으로 seek 후 자동 재생
  useEffect(() => {
    if (expanded) {
      const t = setTimeout(() => {
        playerRef.current?.seekTo(initialFrame);
      }, 150);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        playerRef.current?.seekTo(thumbnailFrame);
      }, 100);
      return () => clearTimeout(t);
    }
  }, [expanded, initialFrame, thumbnailFrame]);

  // 외부 seek 요청 처리 (accent 버튼 클릭)
  useEffect(() => {
    if (seekToFrame === undefined) return;
    playerRef.current?.seekTo(seekToFrame);
    playerRef.current?.play();
  }, [seekToFrame]);

  return (
    <div style={{ width: displayWidth, height: displayH, borderRadius: expanded ? 0 : 10, overflow: 'hidden', flexShrink: 0 }}>
      <Player
        ref={playerRef}
        acknowledgeRemotionLicense
        component={AccentComposition}
        inputProps={{ ...data, simple: !expanded }}
        compositionWidth={compW}
        compositionHeight={compH}
        durationInFrames={durationInFrames}
        fps={FPS}
        style={{ width: displayWidth, height: displayH }}
        loop={expanded}
        controls={expanded}
        spaceKeyToPlayOrPause={expanded}
        showVolumeControls={expanded}
        clickToPlay={expanded}
        initiallyShowControls={expanded}
      />
    </div>
  );
}
