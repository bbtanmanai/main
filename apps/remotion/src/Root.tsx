import React from "react";
import { Composition } from "remotion";
import { LinkDropVideo } from "./Video";
import { ObjectShowcase } from "./components/ObjectShowcase";
import animData from "./data/object_animations.json";

// 테스트용 샘플 데이터
const SAMPLE_SCENES = [
  { index: 0, visual_type: "full_visual", data: { mood: "warm", scene_desc: "칠순 잔치 날, 힘겹게 젓가락질하는 아버지", overlay_text: "" } },
  { index: 1, visual_type: "split_screen", data: { left_label: "과거", right_label: "현재", left_items: ["가족 헌신", "활기찬 모습"], right_items: ["기운 없음", "무기력함"] } },
  { index: 2, visual_type: "quote_hero", data: { quote: "내가 뭘 해도 되겠어?", speaker: "아버지", emotion: "sad" } },
  { index: 3, visual_type: "key_point", data: { text: "우연히 '멀티비타민' 기사를 접했습니다", sub: "새로운 희망의 실마리" } },
  { index: 4, visual_type: "stat_card", data: { value: "40%", label: "60대 이상 비타민D 부족", sub: "통계청 기준", icon: "chart", trend: "down" } },
  { index: 5, visual_type: "icon_grid", data: { title: "시니어 필수 영양소", items: [{ icon: "vitamin_d", label: "비타민D" }, { icon: "calcium", label: "칼슘" }, { icon: "omega3", label: "오메가3" }, { icon: "iron", label: "철분" }, { icon: "zinc", label: "아연" }, { icon: "probiotics", label: "유산균" }] } },
  { index: 6, visual_type: "comparison_table", data: { title: "멀티비타민 비교", col_a: "일반", col_b: "시니어 전용", rows: [{ label: "비타민D", a: "400IU", b: "800IU" }, { label: "칼슘", a: "200mg", b: "500mg" }, { label: "아연", a: "5mg", b: "15mg" }] } },
  { index: 7, visual_type: "timeline", data: { title: "변화의 기록", events: [{ time: "1주", text: "아침 산책 시작" }, { time: "2주", text: "식사량 증가" }, { time: "1달", text: "손주와 놀아줌" }] } },
  { index: 8, visual_type: "quote_hero", data: { quote: "요즘 몸이 가벼워진 것 같아", speaker: "아버지", emotion: "happy" } },
  { index: 9, visual_type: "key_point", data: { text: "지금, 비슷한 상황으로 고민하고 계신가요?", sub: "댓글로 이야기를 들려주세요" } },
];

const FPS = 30;
const SCENE_DURATION = 5 * FPS; // 씬당 5초

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 전체 영상 */}
      <Composition
        id="LinkDropVideo"
        component={LinkDropVideo}
        durationInFrames={SAMPLE_SCENES.length * SCENE_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          scenes: SAMPLE_SCENES,
          styleId: "ghibli-real",
          audioFiles: [],
          durations: SAMPLE_SCENES.map(() => SCENE_DURATION),
          subtitles: [],
          bgImages: [],
          characterId: "c3",
        }}
      />

      {/* 개별 씬 미리보기 (화풍별) */}
      {["ghibli-real", "hollywood-sf", "neo-noir", "pop-art", "ink-wash", "pixar-3d"].map(styleId => (
        <Composition
          key={styleId}
          id={`Preview-${styleId}`}
          component={LinkDropVideo}
          durationInFrames={3 * SCENE_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={{
            scenes: SAMPLE_SCENES.slice(0, 3),
            styleId,
            audioFiles: [],
            durations: [SCENE_DURATION, SCENE_DURATION, SCENE_DURATION],
            subtitles: ["", "", ""],
          }}
        />
      ))}
      {/* 오브젝트 쇼케이스 */}
      <Composition
        id="ObjectShowcase"
        component={ObjectShowcase}
        durationInFrames={Math.ceil(Object.keys(animData).length / 12) * 150}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          objects: Object.keys(animData),
          sceneDurationFrames: 150,
        }}
      />
    </>
  );
};
