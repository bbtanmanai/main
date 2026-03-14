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
  Chart.defaults.color = '#57534e'; // text-stone-500
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
  const [activeTab, setActiveTab] = useState('phase1');
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
    if (activeTab === 'phase1' && radarRef.current) {
      const ctx = radarRef.current.getContext('2d');
      if (ctx) {
        if (radarInstance.current) radarInstance.current.destroy();
        radarInstance.current = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['액션/전투', '로맨스', '세계관 구축', '정치/두뇌싸움', '주인공 성장'],
            datasets: [{
              label: '장르 요소 비중',
              data: radarData[selectedGenre],
              backgroundColor: 'rgba(217, 119, 6, 0.2)',
              borderColor: 'rgba(217, 119, 6, 1)',
              pointBackgroundColor: 'rgba(217, 119, 6, 1)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              r: {
                angleLines: { color: '#e7e5e4' },
                grid: { color: '#e7e5e4' },
                pointLabels: { font: { size: 12, weight: 'bold' } },
                ticks: { display: false, min: 0, max: 100 } as any
              }
            },
            plugins: { legend: { display: false } }
          }
        });
      }
    }
  }, [activeTab, selectedGenre]);

  // Tension Chart
  useEffect(() => {
    if (activeTab === 'phase3' && tensionRef.current) {
      const ctx = tensionRef.current.getContext('2d');
      if (ctx) {
        if (tensionInstance.current) tensionInstance.current.destroy();
        tensionInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['1화', '5화', '10화', '15화', '20화', '23화(위기)', '25화(결말)'],
            datasets: [{
              label: '이야기 텐션',
              data: [80, 60, 70, 65, 85, 40, 95],
              borderColor: '#d97706',
              backgroundColor: 'rgba(217, 119, 6, 0.1)',
              borderWidth: 3,
              pointBackgroundColor: '#fff',
              pointBorderColor: '#d97706',
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
                ticks: { display: false } as any 
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
      }
    }
  }, [activeTab]);

  // Platform Chart
  useEffect(() => {
    if (activeTab === 'phase4' && platformRef.current) {
      const ctx = platformRef.current.getContext('2d');
      if (ctx) {
        if (platformInstance.current) platformInstance.current.destroy();
        platformInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['06시', '12시(점심)', '16시', '18시(퇴근)', '20시', '22시(취침전)'],
            datasets: [{
              label: '트래픽 지수 (상대값)',
              data: platformTrafficData[selectedPlatform],
              backgroundColor: '#d97706',
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, max: 100, ticks: { display: false } as any },
              x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
          }
        });
      }
    }
  }, [activeTab, selectedPlatform]);

  const generateLogline = () => {
    setDisplayLogline(`${logline.char} ${logline.inc} ${logline.goal}`);
  };

  return (
    <div className="bg-stone-50 text-stone-800 min-h-screen flex flex-col font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-amber-600 text-white rounded-lg flex items-center justify-center font-bold text-xl mr-3">W</div>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">웹소설 작가 마스터플랜</h1>
            </div>
          </div>
          
          <nav className="flex overflow-x-auto hide-scroll pb-2 mt-2 gap-4">
            {[
              { id: 'phase1', label: '1. 소재 발굴' },
              { id: 'phase2', label: '2. 기획 및 설계' },
              { id: 'phase3', label: '3. 원고 집필' },
              { id: 'phase4', label: '4. 플랫폼 연재' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm md:text-base whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id ? 'border-amber-600 text-amber-600 font-bold' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Phase 1: 소재 발굴 */}
        {activeTab === 'phase1' && (
          <section className="animate-in fade-in duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-stone-900 mb-4">1단계: 팔리는 소재 발굴하기</h2>
              <p className="text-lg text-stone-600 leading-relaxed">
                성공적인 웹소설의 첫걸음은 시장이 원하는 소재(클리셰)와 작가 본인만의 독창성(한 스푼)을 결합하는 것입니다. 
                현재 플랫폼 트렌드를 분석하고 장르별 핵심 요소를 파악하세요. 
                아래 인터랙티브 차트를 통해 주요 장르의 구성 요소를 비교해 볼 수 있습니다.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                <h3 className="text-xl font-bold mb-4">장르별 트렌드 요소 분석</h3>
                <div className="flex gap-2 mb-6 flex-wrap">
                  {Object.keys(radarData).map(genre => (
                    <button 
                      key={genre}
                      onClick={() => setSelectedGenre(genre)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedGenre === genre ? 'bg-amber-600 text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}`}
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
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                  <h4 className="font-bold text-lg mb-2 text-stone-800">소재 발굴 체크리스트</h4>
                  <ul className="space-y-3">
                    {[
                      '현재 문피아/네이버/카카오페이지 무료 베스트 1~20위 제목/소개글 분석 완료',
                      '최근 유행하는 키워드 (예: 회귀, 빙의, 환생, 상태창) 중 1개 이상 차용',
                      '독자가 기대하는 카타르시스(사이다) 포인트가 명확한가?'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-amber-600 mr-2 mt-1" />
                        <span className="text-stone-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-amber-800">
                  <h4 className="font-bold text-lg mb-2 text-amber-900 flex items-center gap-2">
                    <FontAwesomeIcon icon={faLightbulb} /> 핵심 팁
                  </h4>
                  <p className="text-sm leading-relaxed">
                    완전히 새로운 소재는 독자에게 진입장벽이 됩니다. <b>익숙한 클리셰 80%에 작가만의 독특한 설정 20%</b>를 섞는 
                    '아는 맛인데 미묘하게 새로운 맛'이 가장 상업적 성공 확률이 높습니다.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Phase 2: 기획 및 설계 */}
        {activeTab === 'phase2' && (
          <section className="animate-in fade-in duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-stone-900 mb-4">2단계: 뼈대 세우기 (기획 및 시놉시스)</h2>
              <p className="text-lg text-stone-600 leading-relaxed">
                소재가 정해졌다면 글의 방향성을 잃지 않도록 나침반 역할을 할 '로그라인(Logline)'과 캐릭터 설정을 구축해야 합니다. 
                아래의 생성기를 통해 1줄 줄거리를 만들어보고 핵심 갈등 구조를 시각화하세요.
              </p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-stone-200 mb-8">
              <h3 className="text-xl font-bold mb-6 text-stone-800 border-b pb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faBolt} className="text-amber-600" /> 인터랙티브 로그라인 생성기
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2 font-bold">1. 주인공 (결핍/특징)</label>
                  <select 
                    value={logline.char}
                    onChange={(e) => setLogline({...logline, char: e.target.value})}
                    className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-stone-50 p-3 border font-bold"
                  >
                    <option value="만년 꼴찌였던 헌터가">만년 꼴찌였던 헌터가</option>
                    <option value="배신당해 죽은 대마법사가">배신당해 죽은 대마법사가</option>
                    <option value="악역 영애로 빙의한 취업준비생이">악역 영애로 빙의한 취업준비생이</option>
                    <option value="천재적인 재능을 숨긴 재벌 막내아들이">천재적인 재능을 숨긴 재벌 막내아들이</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2 font-bold">2. 계기/능력 (사건)</label>
                  <select 
                    value={logline.inc}
                    onChange={(e) => setLogline({...logline, inc: e.target.value})}
                    className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-stone-50 p-3 border font-bold"
                  >
                    <option value="과거로 회귀하여 시스템을 각성하고">과거로 회귀하여 시스템을 각성하고</option>
                    <option value="무공 비급을 우연히 얻게 되어">무공 비급을 우연히 얻게 되어</option>
                    <option value="원작의 흐름을 비틀어버리며">원작의 흐름을 비틀어버리며</option>
                    <option value="미래의 지식을 바탕으로 투자에 성공하여">미래의 지식을 바탕으로 투자에 성공하여</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2 font-bold">3. 목표 (사이다)</label>
                  <select 
                    value={logline.goal}
                    onChange={(e) => setLogline({...logline, goal: e.target.value})}
                    className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-stone-50 p-3 border font-bold"
                  >
                    <option value="세계를 멸망에서 구원하고 최강자가 되는 이야기">세계를 멸망에서 구원하고 최강자가 되는 이야기</option>
                    <option value="자신을 버린 가문에 철저하게 복수하는 이야기">자신을 버린 가문에 철저하게 복수하는 이야기</option>
                    <option value="죽음의 엔딩을 피하고 꿀빠는 삶을 쟁취하는 이야기">죽음의 엔딩을 피하고 꿀빠는 삶을 쟁취하는 이야기</option>
                    <option value="전 세계의 경제를 쥐락펴락하는 거물이 되는 이야기">전 세계의 경제를 쥐락펴락하는 거물이 되는 이야기</option>
                  </select>
                </div>
              </div>

              <div className="bg-stone-100 p-6 rounded-lg flex flex-col sm:flex-row items-center justify-between shadow-inner">
                <p className="text-lg font-bold text-stone-800 leading-relaxed italic flex-grow text-center sm:text-left">
                  "{displayLogline}"
                </p>
                <button 
                  onClick={generateLogline}
                  className="mt-4 sm:mt-0 sm:ml-4 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-md font-bold transition-colors whitespace-nowrap"
                >
                  결합하기
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border border-stone-200 p-6 rounded-xl bg-white">
                <h4 className="font-bold text-lg mb-4 text-stone-800 border-b pb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faListOl} className="text-amber-600" /> 플롯의 기본 4단계 (기승전결)
                </h4>
                <div className="space-y-4">
                  {[
                    { s: '발단 (1~5화)', d: '주인공의 비참한 현실 제시, 사건의 발생(회귀/빙의), 능력 각성. 독자의 이목을 가장 강하게 끌어야 하는 구간.' },
                    { s: '전개 (6~20화)', d: '얻은 능력을 바탕으로 소규모 성과 달성, 주변 인물 등장, 주인공의 목표 명확화.' },
                    { s: '위기 (21~23화)', d: '예상치 못한 강력한 적이나 장애물 등장. 주인공이 위기에 처하며 긴장감 최고조.' },
                    { s: '절정/결말 (24~25화)', d: '능력을 응용하여 위기 극복, 강력한 카타르시스(사이다) 제공, 다음 에피소드에 대한 떡밥 투척.' }
                  ].map((p, i) => (
                    <div key={i} className={`p-3 bg-stone-50 rounded border-l-4 ${i === 0 ? 'border-stone-400' : i === 1 ? 'border-amber-300' : i === 2 ? 'border-amber-500' : 'border-amber-600'}`}>
                      <strong className="block text-stone-900">{p.s}</strong>
                      <p className="text-sm text-stone-600">{p.d}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-stone-800 text-stone-100 p-8 rounded-xl flex flex-col justify-center text-center">
                <FontAwesomeIcon icon={faPenNib} className="text-5xl text-amber-500 mb-6" />
                <h4 className="font-bold text-xl mb-4">캐릭터 설정의 핵심: 매력</h4>
                <p className="text-stone-300 text-sm leading-relaxed mb-6">
                  주인공은 독자의 아바타입니다. 완벽하기만한 캐릭터보다는, 뚜렷한 목표와 행동력, 그리고 약간의 인간적인 결핍이 있을 때 
                  독자는 공감하고 응원하게 됩니다. 수동적인 주인공은 웹소설에서 가장 피해야 할 요소입니다.
                </p>
                <div className="inline-block bg-stone-700 px-4 py-2 rounded text-amber-400 font-bold text-sm">능동적 결단 &gt; 빠른 실행 &gt; 즉각적 보상</div>
              </div>
            </div>
          </section>
        )}

        {/* Phase 3: 원고 집필 */}
        {activeTab === 'phase3' && (
          <section className="animate-in fade-in duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-stone-900 mb-4">3단계: 실전 집필과 텐션 유지</h2>
              <p className="text-lg text-stone-600 leading-relaxed">
                웹소설은 보통 1화당 공백 포함 5,000자 내외로 작성되며, 일일 연재가 기본입니다. 
                매 화마다 독자가 다음 화를 결제하게 만드는 \'절단신공(Cliffhanger)\'과 한 권(25화) 단위의 서사적 텐션 관리가 필수적입니다.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-8">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                  <FontAwesomeIcon icon={faChartLine} className="text-amber-600" /> 1권 (1~25화) 표준 텐션 곡선
                </h3>
                <span className="text-sm text-stone-500">*마우스를 올려 구간별 특징 확인</span>
              </div>
              <div className="h-[350px]">
                <canvas ref={tensionRef}></canvas>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { t: '5,000자', d: '1화 적정 분량 (공백 포함)', c: '모바일 가독성을 고려하여 문단은 짧게, 대화의 비중은 30~50%를 유지하는 것이 좋습니다.' },
                { t: '절단신공', d: '매 화 마지막 연출', c: '사건이 터지기 직전, 중요한 보상을 확인하기 직전, 새로운 인물이 등장하는 순간 화를 끝내세요.' },
                { t: '비축분 15화', d: '연재 시작 전 권장 원고량', c: '일일 연재의 압박과 멘탈 관리를 위해, 최소 15화 이상의 원고를 미리 써두고 연재를 시작해야 합니다.' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm text-center">
                  <div className="text-2xl font-bold text-amber-600 mb-1">{item.t}</div>
                  <div className="text-sm text-stone-600 font-bold mb-3">{item.d}</div>
                  <p className="text-xs text-stone-500 leading-relaxed">{item.c}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Phase 4: 플랫폼 연재 */}
        {activeTab === 'phase4' && (
          <section className="animate-in fade-in duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-stone-900 mb-4">4단계: 플랫폼 런칭 및 독자 관리</h2>
              <p className="text-lg text-stone-600 leading-relaxed">
                준비된 원고를 세상에 내놓을 시간입니다. 각 플랫폼(문피아, 네이버, 카카오)의 특성이 다르며, 
                초반 유입을 극대화하기 위한 업로드 타이밍 전략과 시각적 요소(제목, 표지)가 성패를 가릅니다.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                    <FontAwesomeIcon icon={faArrowTrendUp} className="text-amber-600" /> 플랫폼별 트래픽 피크 타임
                  </h3>
                  <select 
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="text-sm border-stone-300 rounded p-2 bg-stone-50 border font-bold"
                  >
                    <option value="munpia">문피아 (남성향)</option>
                    <option value="naver">네이버 시리즈</option>
                  </select>
                </div>
                <div className="h-[350px]">
                  <canvas ref={platformRef}></canvas>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
                <h4 className="font-bold text-xl mb-6 text-stone-800 border-b pb-4">클릭을 부르는 어그로 전략</h4>
                <div className="space-y-6">
                  <div>
                    <h5 className="font-bold text-stone-900 flex items-center gap-2">
                      <FontAwesomeIcon icon={faRocket} className="text-amber-600" /> 1. 웹소설식 긴 제목
                    </h5>
                    <p className="text-sm text-stone-600 mt-2">
                      제목이 곧 소개글입니다. 로그라인을 압축하여 어떤 내용인지 직관적으로 보여주세요.<br/>
                      <span className="text-amber-600 text-xs font-bold">(예: \'SSS급\' \'회귀\' \'천재\' \'재벌\' 등의 키워드 조합)</span>
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-stone-900 flex items-center gap-2">
                      <FontAwesomeIcon icon={faUsers} className="text-amber-600" /> 2. 연재 주기 엄수
                    </h5>
                    <p className="text-sm text-stone-600 mt-2">독자와의 약속입니다. 정해진 시간(예: 매일 18시)에 칼같이 업로드하여 독자의 일상 루틴에 스며들어야 합니다.</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-stone-900 flex items-center gap-2">
                      <FontAwesomeIcon icon={faChartLine} className="text-amber-600" /> 3. 연독률 (유지율) 모니터링
                    </h5>
                    <p className="text-sm text-stone-600 mt-2">1화 조회수 대비 최신화 조회수 비율입니다. 급격히 떨어지는 구간이 있다면 전개가 지루해졌거나 주인공이 고구마를 먹고 있다는 신호입니다.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-stone-800 p-8 rounded-2xl text-center text-white">
              <h4 className="font-bold text-2xl mb-4 flex items-center justify-center gap-3">
                <FontAwesomeIcon icon={faShieldAlt} className="text-amber-500" /> 마인드 컨트롤: 악플 대처법
              </h4>
              <p className="text-stone-300 text-base max-w-3xl mx-auto leading-relaxed">
                무플보다 무서운 것이 악플이지만, 악플에 흔들려 기획했던 전개를 갑자기 수정하면 작품 전체가 무너집니다.<br/>
                <b>건전한 비판은 수용하되, 무분별한 비난은 무시하고 내 글을 좋아해주는 결제 독자에게 집중하세요.</b>
              </p>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-white border-t border-stone-200 py-8 text-center text-stone-400 text-sm">
        <p>© LinkDropV2 AI Web-Novel Master Plan - Interactive Guide</p>
      </footer>
    </div>
  );
}

