import { Composition } from 'remotion';
import { AccentComposition, type AccentCompositionProps } from '../components/remotion-preview/AccentComposition';
import { StatCard, type StatCardProps } from '../components/remotion-preview/StatCard';
import { QuoteHero, type QuoteHeroProps } from '../components/remotion-preview/QuoteHero';
import { ComparisonTable, type ComparisonTableProps } from '../components/remotion-preview/ComparisonTable';
import { Timeline, type TimelineProps } from '../components/remotion-preview/Timeline';
import { RankingList, type RankingListProps } from '../components/remotion-preview/RankingList';
import { SplitScreen, type SplitScreenProps } from '../components/remotion-preview/SplitScreen';
import { IconGrid, type IconGridProps } from '../components/remotion-preview/IconGrid';
import { Flowchart, type FlowchartProps } from '../components/remotion-preview/Flowchart';
import { FullImage, type FullImageProps } from '../components/remotion-preview/FullImage';

const DEFAULT_PROPS: AccentCompositionProps = {
  accents: [],
  tts_duration: 5,
  bgImage: undefined,
  videoTitle: '영상 제목 미리보기',
  audioSrc: undefined,
  simple: false,
  accentColor: '#6366f1',
};

export const RemotionRoot = () => {
  return (
    <>
      {/* 16:9 가로 영상 */}
      <Composition
        id="AccentScene-16x9"
        component={AccentComposition}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_PROPS}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.max(30, Math.ceil((props.tts_duration ?? 5) * 30) + 30),
        })}
      />
      {/* 9:16 세로 영상 */}
      <Composition
        id="AccentScene-9x16"
        component={AccentComposition}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={DEFAULT_PROPS}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.max(30, Math.ceil((props.tts_duration ?? 5) * 30) + 30),
        })}
      />

      {/* StatCard 독립 미리보기 */}
      <Composition
        id="StatCard-16x9"
        component={StatCard}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: '핵심 지표',
          stats: [
            { value: '2,847만', label: '월간 사용자', trend: '↑' },
            { value: '94.2%',   label: '만족도',      trend: '↑' },
            { value: '1.3초',   label: '평균 응답속도', trend: '↓' },
          ],
          accentColor: '#6366f1',
        } as StatCardProps}
      />
      {/* QuoteHero 독립 미리보기 */}
      <Composition
        id="QuoteHero-16x9"
        component={QuoteHero}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          quote: '한 번의 실험이 천 번의 이론보다 가치 있다',
          speaker: '알버트 아인슈타인',
          role: '물리학자',
          accentColor: '#6366f1',
        } as QuoteHeroProps}
      />
      {/* ComparisonTable 독립 미리보기 */}
      <Composition
        id="ComparisonTable-16x9"
        component={ComparisonTable}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          leftLabel: 'A안',
          rightLabel: 'B안',
          rows: [
            { label: '가격',     left: '월 9,900원',  right: '월 14,900원', winner: 'left'  },
            { label: '속도',     left: '보통',         right: '빠름',         winner: 'right' },
            { label: '저장공간', left: '50GB',         right: '200GB',        winner: 'right' },
            { label: '지원',     left: '이메일',       right: '24시간 채팅',  winner: 'right' },
          ],
          accentColor: '#6366f1',
        } as ComparisonTableProps}
      />
      {/* Timeline 독립 미리보기 */}
      <Composition
        id="Timeline-16x9"
        component={Timeline}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          items: [
            { year: '2020', title: '서비스 론칭',   desc: '베타 사용자 1만 명 달성' },
            { year: '2021', title: '시리즈 A 투자', desc: '50억 원 투자 유치'        },
            { year: '2022', title: '글로벌 확장',   desc: '일본·동남아 진출'         },
            { year: '2023', title: '사용자 100만',  desc: '누적 사용자 100만 돌파'   },
          ],
          accentColor: '#6366f1',
        } as TimelineProps}
      />
      {/* RankingList 독립 미리보기 */}
      <Composition
        id="RankingList-16x9"
        component={RankingList}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'TOP 5 기업 영업이익',
          unit: '억 원',
          items: [
            { label: '삼성전자',      value: '4,823억', desc: '반도체·모바일' },
            { label: 'SK하이닉스',    value: '2,914억', desc: 'DRAM·낸드'     },
            { label: 'LG에너지솔루션', value: '1,880억', desc: '배터리'        },
            { label: '현대차',        value: '1,422억', desc: '완성차·로봇'   },
            { label: '카카오',        value: '891억',   desc: '플랫폼·콘텐츠' },
          ],
          accentColor: '#6366f1',
        } as RankingListProps}
      />
      {/* SplitScreen 독립 미리보기 */}
      <Composition
        id="SplitScreen-16x9"
        component={SplitScreen}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: '비포 vs 애프터',
          left: {
            label: 'Before',
            value: '3시간',
            points: ['수동 반복 작업', '실수 잦음', '야근 일상화'],
            color: '#f43f5e',
          },
          right: {
            label: 'After',
            value: '15분',
            points: ['자동화 완료', '오류 제로', '칼퇴 실현'],
            color: '#10b981',
          },
          accentColor: '#6366f1',
        } as SplitScreenProps}
      />
      {/* IconGrid 독립 미리보기 */}
      <Composition
        id="IconGrid-16x9"
        component={IconGrid}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: '핵심 기능',
          items: [
            { icon: '🤖', label: 'AI 자동화',    desc: '반복 업무 제거',   highlight: true  },
            { icon: '⚡', label: '초고속 처리',  desc: '0.3초 응답'                         },
            { icon: '🔒', label: '보안 강화',    desc: '256비트 암호화'                     },
            { icon: '📊', label: '실시간 분석',  desc: '대시보드 제공'                      },
            { icon: '🌐', label: '글로벌 지원',  desc: '15개국 언어'                        },
            { icon: '💬', label: '24시간 지원',  desc: '전담 CS팀'                          },
          ],
          accentColor: '#6366f1',
        } as IconGridProps}
      />
      {/* Flowchart 독립 미리보기 */}
      <Composition
        id="Flowchart-16x9"
        component={Flowchart}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: '처리 흐름',
          nodes: [
            { label: '시작',         type: 'start'    },
            { label: '데이터 수집',  desc: 'API 호출', type: 'process'  },
            { label: '검증 통과?',   type: 'decision' },
            { label: '결과 처리',    desc: '분석 완료', type: 'process'  },
            { label: '완료',         type: 'end'      },
          ],
          accentColor: '#6366f1',
        } as FlowchartProps}
      />
      {/* FullImage 독립 미리보기 */}
      <Composition
        id="FullImage-16x9"
        component={FullImage}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          caption: '이미지에 캡션을 추가할 수 있습니다',
          accentColor: '#6366f1',
        } as FullImageProps}
      />
    </>
  );
};
