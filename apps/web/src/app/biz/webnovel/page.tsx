'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPenNib, faBookOpen, faListOl, faRocket, 
  faLightbulb, faCheckCircle, faChevronRight,
  faChartLine, faUsers, faArrowTrendUp, faBolt,
  faComments, faShieldAlt
} from '@fortawesome/free-solid-svg-icons';

Chart.register(...registerables);

// --- Chart.js Global Config ---
if (typeof window !== 'undefined') {
  Chart.defaults.font.family = "'Noto Sans KR', sans-serif";
  Chart.defaults.color = 'rgba(148,163,184,0.85)';
}

const radarData: any = {
  fantasy: [90, 30, 80, 70, 95],
  romfan: [40, 95, 70, 85, 60],
  modern: [85, 20, 50, 90, 95],
  wuxia: [95, 10, 85, 60, 90],
  romance: [10, 95, 40, 30, 70],
  mystery: [30, 20, 60, 95, 50]
};

const genreLabels: any = {
  fantasy: '판타지',
  romfan: '로맨스 판타지',
  modern: '현대 판타지',
  wuxia: '무협',
  romance: '로맨스',
  mystery: '미스터리/스릴러'
};

const platformTrafficData: any = {
  munpia: [5, 15, 20, 30, 100, 80],
  naver: [10, 40, 30, 50, 70, 95]
};

export default function WebNovelPage() {
  const [topTab, setTopTab] = useState<'flow' | 'create'>('flow');
  const [selectedGenre, setSelectedGenre] = useState('fantasy');
  const [selectedPlatform, setSelectedPlatform] = useState('munpia');
  
  const [logline, setLogline] = useState({
    char: '만년 꼴찌였던 헌터가',
    inc: '과거로 회귀하여 시스템을 각성하고',
    goal: '세계를 멸망에서 구원하고 최강자가 되는 이야기'
  });

  const [displayLogline, setDisplayLogline] = useState('만년 꼴찌였던 헌터가 과거로 회귀하여 시스템을 각성하고 세계를 멸망에서 구원하고 최강자가 되는 이야기');

  const radarRef = useRef<HTMLCanvasElement>(null);
  const tensionRef = useRef<HTMLCanvasElement>(null);
  const platformRef = useRef<HTMLCanvasElement>(null);

  const radarInstance = useRef<any>(null);
  const tensionInstance = useRef<any>(null);
  const platformInstance = useRef<any>(null);

  // Radar Chart
  useEffect(() => {
    if (topTab !== 'flow') {
      if (radarInstance.current) {
        radarInstance.current.destroy();
        radarInstance.current = null;
      }
      return;
    }
    if (!radarRef.current) return;
    const ctx = radarRef.current.getContext('2d');
    if (!ctx) return;
    if (radarInstance.current) radarInstance.current.destroy();
    radarInstance.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['액션/전투', '로맨스', '세계관 구축', '정치/두뇌싸움', '주인공 성장'],
        datasets: [{
          label: '장르 요소 비중',
          data: radarData[selectedGenre],
          backgroundColor: 'rgba(167, 139, 250, 0.18)',
          borderColor: 'rgba(167, 139, 250, 1)',
          pointBackgroundColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: 'rgba(255,255,255,0.08)' },
            grid: { color: 'rgba(255,255,255,0.08)' },
            pointLabels: { font: { size: 12, weight: 'bold' } },
            ticks: { display: false, min: 0, max: 100 } as any
          }
        },
        plugins: { legend: { display: false } }
      }
    });
    return () => {
      if (radarInstance.current) {
        radarInstance.current.destroy();
        radarInstance.current = null;
      }
    }
  }, [selectedGenre, topTab]);

  // Tension Chart
  useEffect(() => {
    if (topTab !== 'flow') {
      if (tensionInstance.current) {
        tensionInstance.current.destroy();
        tensionInstance.current = null;
      }
      return;
    }
    if (!tensionRef.current) return;
    const ctx = tensionRef.current.getContext('2d');
    if (!ctx) return;
    if (tensionInstance.current) tensionInstance.current.destroy();
    tensionInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['1화', '5화', '10화', '15화', '20화', '23화(위기)', '25화(결말)'],
        datasets: [{
          label: '이야기 텐션',
          data: [80, 60, 70, 65, 85, 40, 95],
          borderColor: '#a78bfa',
          backgroundColor: 'rgba(167, 139, 250, 0.12)',
          borderWidth: 3,
          pointBackgroundColor: '#0f0f1a',
          pointBorderColor: '#a78bfa',
          pointRadius: 5,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: '몰입도/긴장감' },
            ticks: { display: false } as any,
            grid: { color: 'rgba(255,255,255,0.08)' }
          },
          x: { grid: { display: false } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const tooltips = [
                  '강렬한 도입부, 빙의/회귀 발생',
                  '기초 설정 완료, 소규모 성과',
                  '새로운 인물 등장, 갈등 조짐',
                  '주인공 능력 입증, 세력 확장',
                  '메인 빌런의 등장 또는 함정',
                  '최대 위기 발생, 독자의 긴장 극대화',
                  '위기 극복 및 폭발적인 카타르시스(사이다)'
                ];
                return tooltips[context.dataIndex];
              }
            }
          }
        }
      }
    });
    return () => {
      if (tensionInstance.current) {
        tensionInstance.current.destroy();
        tensionInstance.current = null;
      }
    }
  }, [topTab]);

  // Platform Chart
  useEffect(() => {
    if (topTab !== 'flow') {
      if (platformInstance.current) {
        platformInstance.current.destroy();
        platformInstance.current = null;
      }
      return;
    }
    if (!platformRef.current) return;
    const ctx = platformRef.current.getContext('2d');
    if (!ctx) return;
    if (platformInstance.current) platformInstance.current.destroy();
    platformInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['06시', '12시(점심)', '16시', '18시(퇴근)', '20시', '22시(취침전)'],
        datasets: [{
          label: '트래픽 지수 (상대값)',
          data: platformTrafficData[selectedPlatform],
          backgroundColor: 'rgba(167, 139, 250, 0.9)',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { display: false } as any,
            grid: { color: 'rgba(255,255,255,0.08)' }
          },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
    return () => {
      if (platformInstance.current) {
        platformInstance.current.destroy();
        platformInstance.current = null;
      }
    }
  }, [selectedPlatform, topTab]);

  const generateLogline = () => {
    setDisplayLogline(`${logline.char} ${logline.inc} ${logline.goal}`);
  };

  return (
    <div className="bg-[#0f0f1a] min-h-screen text-white pb-24 font-sans antialiased">
      <header 
        className="relative pt-24 pb-24 text-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/img/biz/webnovel/webnovel_top_bg.webp')" }}
      >
        <div className="absolute inset-0 bg-[#0f0f1a]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(167,139,250,0.15),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(99,102,241,0.15),transparent_45%)]" />
        <div className="relative z-10 max-w-6xl mx-auto px-[5%] lg:px-[8%]">
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              type="button"
              onClick={() => setTopTab('flow')}
              className={`px-7 py-3 rounded-2xl text-sm font-black transition-all border ${
                topTab === 'flow'
                  ? 'bg-[#a78bfa]/20 text-[#c4b5fd] border-[#a78bfa]/30'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              1. 웹소설 Flow
            </button>
            <button
              type="button"
              onClick={() => setTopTab('create')}
              className={`px-7 py-3 rounded-2xl text-sm font-black transition-all border ${
                topTab === 'create'
                  ? 'bg-[#a78bfa]/20 text-[#c4b5fd] border-[#a78bfa]/30'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              2. 웹소설창작
            </button>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mb-4 leading-tight">
            웹소설 작가{' '}
            <span className="bg-gradient-to-r from-[#a78bfa] to-[#6366f1] bg-clip-text text-transparent">
              마스터플랜
            </span>
          </h1>
          <p className="text-slate-400 text-sm lg:text-base font-medium max-w-3xl mx-auto leading-relaxed">
            {topTab === 'flow'
              ? '소재 발굴부터 기획·집필·연재까지, 한 화면에서 흐름을 정리하고 바로 실행합니다.'
              : '집필에 바로 쓸 수 있는 창작 도구를 한 화면에 모읍니다.'}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-[5%] lg:px-[8%] -mt-14 relative z-10 space-y-14">
        {topTab === 'create' && (
          <section className="bg-[#1c1c2e] rounded-[32px] p-8 md:p-10 shadow-xl border border-white/10">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">2. 웹소설창작</div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4">웹소설 창작</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
              준비중입니다.
            </p>
          </section>
        )}

        {topTab === 'flow' && (
          <>
        <section className="bg-[#1c1c2e] rounded-[32px] p-8 md:p-10 shadow-xl border border-white/10">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4">팔리는 소재 발굴하기</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
              성공적인 웹소설의 첫걸음은 시장이 원하는 소재(클리셰)와 작가 본인만의 독창성(한 스푼)을 결합하는 것입니다.
              현재 플랫폼 트렌드를 분석하고 장르별 핵심 요소를 파악하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-[#13131f] p-6 rounded-2xl border border-white/10">
              <h3 className="text-lg font-black mb-4 text-white">장르별 트렌드 요소 분석</h3>
              <div className="flex gap-2 mb-6 flex-wrap">
                {Object.keys(radarData).map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-3 py-1.5 rounded-full text-xs font-black transition-all border ${
                      selectedGenre === genre
                        ? 'bg-[#a78bfa]/20 text-[#c4b5fd] border-[#a78bfa]/30'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {genreLabels[genre]}
                  </button>
                ))}
              </div>
              <div className="h-[350px]">
                <canvas ref={radarRef}></canvas>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#13131f] p-6 rounded-2xl border border-white/10">
                <h4 className="font-black text-base mb-3 text-white">소재 발굴 체크리스트</h4>
                <ul className="space-y-3">
                  {[
                    '현재 문피아/네이버/카카오페이지 무료 베스트 1~20위 제목/소개글 분석 완료',
                    '최근 유행하는 키워드 (예: 회귀, 빙의, 환생, 상태창) 중 1개 이상 차용',
                    '독자가 기대하는 카타르시스(사이다) 포인트가 명확한가?',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-[#a78bfa] mt-0.5" />
                      <span className="text-slate-300 text-sm font-medium leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#a78bfa]/10 p-6 rounded-2xl border border-[#a78bfa]/20">
                <h4 className="font-black text-base mb-2 text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faLightbulb} className="text-[#a78bfa]" /> 핵심 팁
                </h4>
                <p className="text-sm leading-relaxed text-slate-200 font-medium">
                  완전히 새로운 소재는 독자에게 진입장벽이 됩니다. 익숙한 클리셰 80%에 작가만의 독특한 설정 20%를 섞는
                  '아는 맛인데 미묘하게 새로운 맛'이 가장 상업적 성공 확률이 높습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#1c1c2e] rounded-[32px] p-8 md:p-10 shadow-xl border border-white/10">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4">뼈대 세우기 (기획 및 시놉시스)</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
              소재가 정해졌다면 글의 방향성을 잃지 않도록 나침반 역할을 할 로그라인(Logline)과 캐릭터 설정을 구축해야 합니다.
              아래의 생성기를 통해 1줄 줄거리를 만들어보고 핵심 갈등 구조를 정리하세요.
            </p>
          </div>

          <div className="bg-[#13131f] p-6 md:p-8 rounded-2xl border border-white/10 mb-8">
            <h3 className="text-lg font-black mb-6 text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faBolt} className="text-[#a78bfa]" /> 인터랙티브 로그라인 생성기
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  1. 주인공 (결핍/특징)
                </label>
                <select
                  value={logline.char}
                  onChange={(e) => setLogline({ ...logline, char: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-[13px] font-bold text-white outline-none focus:border-[#a78bfa]/60"
                >
                  <option value="만년 꼴찌였던 헌터가" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                    만년 꼴찌였던 헌터가
                  </option>
                  <option value="배신당해 죽은 대마법사가" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                    배신당해 죽은 대마법사가
                  </option>
                  <option value="악역 영애로 빙의한 취업준비생이" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                    악역 영애로 빙의한 취업준비생이
                  </option>
                  <option value="천재적인 재능을 숨긴 재벌 막내아들이" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                    천재적인 재능을 숨긴 재벌 막내아들이
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  2. 계기/능력 (사건)
                </label>
                <select
                  value={logline.inc}
                  onChange={(e) => setLogline({ ...logline, inc: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-[13px] font-bold text-white outline-none focus:border-[#a78bfa]/60"
                >
                  <option value="과거로 회귀하여 시스템을 각성하고" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                    과거로 회귀하여 시스템을 각성하고
                  </option>
                  <option value="무공 비급을 우연히 얻게 되어" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                    무공 비급을 우연히 얻게 되어
                  </option>
                  <option value="원작의 흐름을 비틀어버리며" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                    원작의 흐름을 비틀어버리며
                  </option>
                  <option value="미래의 지식을 바탕으로 투자에 성공하여" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                    미래의 지식을 바탕으로 투자에 성공하여
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  3. 목표 (사이다)
                </label>
                <select
                  value={logline.goal}
                  onChange={(e) => setLogline({ ...logline, goal: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-[13px] font-bold text-white outline-none focus:border-[#a78bfa]/60"
                >
                  <option value="세계를 멸망에서 구원하고 최강자가 되는 이야기" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                    세계를 멸망에서 구원하고 최강자가 되는 이야기
                  </option>
                  <option value="자신을 버린 가문에 철저하게 복수하는 이야기" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                    자신을 버린 가문에 철저하게 복수하는 이야기
                  </option>
                  <option value="죽음의 엔딩을 피하고 꿀빠는 삶을 쟁취하는 이야기" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                    죽음의 엔딩을 피하고 꿀빠는 삶을 쟁취하는 이야기
                  </option>
                  <option value="전 세계의 경제를 쥐락펴락하는 거물이 되는 이야기" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                    전 세계의 경제를 쥐락펴락하는 거물이 되는 이야기
                  </option>
                </select>
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <p className="text-sm md:text-base font-bold text-slate-200 leading-relaxed italic flex-grow">
                "{displayLogline}"
              </p>
              <button
                onClick={generateLogline}
                className="bg-gradient-to-r from-[#a78bfa] to-[#6366f1] hover:from-[#b79cff] hover:to-[#7477ff] text-white px-6 py-3 rounded-xl font-black transition-all whitespace-nowrap active:scale-[0.98]"
              >
                결합하기
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-white/10 p-6 rounded-2xl bg-[#13131f]">
              <h4 className="font-black text-base mb-4 text-white flex items-center gap-2">
                <FontAwesomeIcon icon={faListOl} className="text-[#a78bfa]" /> 플롯의 기본 4단계 (기승전결)
              </h4>
              <div className="space-y-4">
                {[
                  { s: '발단 (1~5화)', d: '주인공의 비참한 현실 제시, 사건의 발생(회귀/빙의), 능력 각성. 독자의 이목을 가장 강하게 끌어야 하는 구간.' },
                  { s: '전개 (6~20화)', d: '얻은 능력을 바탕으로 소규모 성과 달성, 주변 인물 등장, 주인공의 목표 명확화.' },
                  { s: '위기 (21~23화)', d: '예상치 못한 강력한 적이나 장애물 등장. 주인공이 위기에 처하며 긴장감 최고조.' },
                  { s: '절정/결말 (24~25화)', d: '능력을 응용하여 위기 극복, 강력한 카타르시스(사이다) 제공, 다음 에피소드에 대한 떡밥 투척.' },
                ].map((p, i) => (
                  <div
                    key={i}
                    className="p-4 bg-white/5 rounded-2xl border border-white/10"
                  >
                    <strong className="block text-white text-sm font-black mb-1">{p.s}</strong>
                    <p className="text-sm text-slate-300 font-medium leading-relaxed">{p.d}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#13131f] border border-white/10 p-8 rounded-2xl flex flex-col justify-center text-center">
              <FontAwesomeIcon icon={faPenNib} className="text-5xl text-[#a78bfa] mb-6" />
              <h4 className="font-black text-xl mb-4 text-white">캐릭터 설정의 핵심: 매력</h4>
              <p className="text-slate-300 text-sm leading-relaxed font-medium mb-6">
                주인공은 독자의 아바타입니다. 완벽하기만한 캐릭터보다는, 뚜렷한 목표와 행동력, 그리고 약간의 인간적인 결핍이 있을 때
                독자는 공감하고 응원하게 됩니다. 수동적인 주인공은 웹소설에서 가장 피해야 할 요소입니다.
              </p>
              <div className="inline-block bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-[#c4b5fd] font-black text-sm">
                능동적 결단 &gt; 빠른 실행 &gt; 즉각적 보상
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#1c1c2e] rounded-[32px] p-8 md:p-10 shadow-xl border border-white/10">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4">실전 집필과 텐션 유지</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
              웹소설은 보통 1화당 공백 포함 5,000자 내외로 작성되며, 일일 연재가 기본입니다.
              매 화마다 독자가 다음 화를 결제하게 만드는 절단신공(Cliffhanger)과 1권(25화) 단위의 텐션 관리가 필수적입니다.
            </p>
          </div>

          <div className="bg-[#13131f] p-6 rounded-2xl border border-white/10 mb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <FontAwesomeIcon icon={faChartLine} className="text-[#a78bfa]" /> 1권 (1~25화) 표준 텐션 곡선
              </h3>
              <span className="text-[11px] text-slate-500 font-bold">*마우스를 올려 구간별 특징 확인</span>
            </div>
            <div className="h-[350px]">
              <canvas ref={tensionRef}></canvas>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { t: '5,000자', d: '1화 적정 분량 (공백 포함)', c: '모바일 가독성을 고려하여 문단은 짧게, 대화의 비중은 30~50%를 유지하는 것이 좋습니다.' },
              { t: '절단신공', d: '매 화 마지막 연출', c: '사건이 터지기 직전, 중요한 보상을 확인하기 직전, 새로운 인물이 등장하는 순간 화를 끝내세요.' },
              { t: '비축분 15화', d: '연재 시작 전 권장 원고량', c: '일일 연재의 압박과 멘탈 관리를 위해, 최소 15화 이상의 원고를 미리 써두고 연재를 시작해야 합니다.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-[#13131f] p-6 rounded-2xl border border-white/10 text-center">
                <div className="text-2xl font-black text-[#a78bfa] mb-1">{item.t}</div>
                <div className="text-sm text-slate-300 font-black mb-3">{item.d}</div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{item.c}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#1c1c2e] rounded-[32px] p-8 md:p-10 shadow-xl border border-white/10">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4">플랫폼 런칭 및 독자 관리</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
              준비된 원고를 세상에 내놓을 시간입니다. 각 플랫폼의 특성이 다르며, 초반 유입을 극대화하기 위한 업로드 타이밍 전략과
              시각적 요소(제목, 표지)가 성패를 가릅니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-[#13131f] p-6 rounded-2xl border border-white/10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faArrowTrendUp} className="text-[#a78bfa]" /> 플랫폼별 트래픽 피크 타임
                </h3>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="text-sm bg-black/20 border border-white/10 rounded-xl px-4 py-2 font-bold text-white outline-none focus:border-[#a78bfa]/60"
                >
                  <option value="munpia">문피아 (남성향)</option>
                  <option value="naver">네이버 시리즈</option>
                </select>
              </div>
              <div className="h-[350px]">
                <canvas ref={platformRef}></canvas>
              </div>
            </div>

            <div className="bg-[#13131f] p-8 rounded-2xl border border-white/10">
              <h4 className="font-black text-xl mb-6 text-white">클릭을 부르는 어그로 전략</h4>
              <div className="space-y-6">
                <div>
                  <h5 className="font-black text-white flex items-center gap-2">
                    <FontAwesomeIcon icon={faRocket} className="text-[#a78bfa]" /> 1. 웹소설식 긴 제목
                  </h5>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed font-medium">
                    제목이 곧 소개글입니다. 로그라인을 압축하여 어떤 내용인지 직관적으로 보여주세요.
                    <br />
                    <span className="text-[#c4b5fd] text-xs font-black">(예: 'SSS급' '회귀' '천재' '재벌' 등의 키워드 조합)</span>
                  </p>
                </div>
                <div>
                  <h5 className="font-black text-white flex items-center gap-2">
                    <FontAwesomeIcon icon={faUsers} className="text-[#a78bfa]" /> 2. 연재 주기 엄수
                  </h5>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed font-medium">
                    독자와의 약속입니다. 정해진 시간(예: 매일 18시)에 칼같이 업로드하여 독자의 일상 루틴에 스며들어야 합니다.
                  </p>
                </div>
                <div>
                  <h5 className="font-black text-white flex items-center gap-2">
                    <FontAwesomeIcon icon={faChartLine} className="text-[#a78bfa]" /> 3. 연독률 (유지율) 모니터링
                  </h5>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed font-medium">
                    1화 조회수 대비 최신화 조회수 비율입니다. 급격히 떨어지는 구간이 있다면 전개가 지루해졌거나 주인공이 고구마를 먹고 있다는 신호입니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#13131f] p-8 rounded-2xl text-center border border-white/10">
            <h4 className="font-black text-2xl mb-4 flex items-center justify-center gap-3 text-white">
              <FontAwesomeIcon icon={faShieldAlt} className="text-[#a78bfa]" /> 마인드 컨트롤: 악플 대처법
            </h4>
            <p className="text-slate-300 text-sm md:text-base max-w-3xl mx-auto leading-relaxed font-medium">
              무플보다 무서운 것이 악플이지만, 악플에 흔들려 기획했던 전개를 갑자기 수정하면 작품 전체가 무너집니다.
              <br />
              건전한 비판은 수용하되, 무분별한 비난은 무시하고 내 글을 좋아해주는 결제 독자에게 집중하세요.
            </p>
          </div>
        </section>
          </>
        )}
      </main>

      <footer className="mt-24 border-t border-white/10 py-10 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
        LinkDropV2 · WebNovel MasterPlan
      </footer>
    </div>
  );
}

