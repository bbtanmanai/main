'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload, faCheckCircle, faShieldHalved,
  faDesktop, faPlay, faArrowLeft, faClock,
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

const INSTALLER_URL = '/download/LinkDrop-Setup.exe';
const INSTALLER_SIZE = '78MB';
const APP_VERSION = '1.0.0';
const HEALTH_URL = 'http://localhost:7788/health';

export default function DownloadPage() {
  const [downloaded, setDownloaded] = useState(false);
  const [installed, setInstalled] = useState<boolean | null>(null);

  // 설치 여부 확인 (프로그램이 실행 중이면 설치된 것)
  useEffect(() => {
    const check = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      try {
        const r = await fetch(HEALTH_URL, {
          signal: controller.signal,
          mode: 'cors',
          cache: 'no-store',
        });
        clearTimeout(timer);
        setInstalled(r.ok);
      } catch {
        clearTimeout(timer);
        setInstalled(false);
      }
    };
    check();
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, []);

  const handleDownload = () => {
    setDownloaded(true);
    window.location.href = INSTALLER_URL;
  };

  return (
    <div className="bg-[#0f0f1a] min-h-screen text-white font-sans antialiased">

      {/* 헤더 */}
      <header className="relative pt-20 pb-16 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_30%,#6366f1_0%,transparent_60%)]" />
        <div className="relative z-10 max-w-2xl mx-auto px-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-fuchsia-500/30">
            <FontAwesomeIcon icon={faDesktop} className="text-white text-3xl" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-3">
            LinkDrop <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-500">프로그램</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            AI 영상을 제작하려면 LinkDrop 프로그램이 필요합니다.<br />
            설치는 1분이면 충분하며, 이후에는 웹에서 클릭만 하면 자동으로 실행됩니다.
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 -mt-4 pb-20">

        {/* 이미 설치됨 */}
        {installed && (
          <div className="mb-8 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 text-center animate-in fade-in duration-300">
            <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-400 text-4xl mb-3" />
            <h2 className="text-lg font-black text-emerald-300 mb-2">이미 설치되어 있습니다</h2>
            <p className="text-slate-400 text-sm mb-4">LinkDrop 프로그램이 실행 중입니다. 바로 영상을 만들 수 있어요.</p>
            <Link
              href="/content/longform"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-xl font-black text-sm hover:brightness-110 active:scale-95 transition-all"
            >
              <FontAwesomeIcon icon={faPlay} />
              영상 제작하러 가기
            </Link>
          </div>
        )}

        {/* 다운로드 카드 */}
        {!installed && (
          <div className="bg-[#1c1c2e] border border-white/10 rounded-2xl p-8 mb-8 shadow-xl">

            {/* 스텝 가이드 */}
            <div className="space-y-6 mb-8">
              <StepItem
                num={1}
                title="프로그램 다운로드"
                desc="아래 버튼을 클릭하면 설치 파일이 다운로드됩니다."
                active={!downloaded}
                done={downloaded}
              />
              <StepItem
                num={2}
                title="설치 파일 실행"
                desc="다운로드된 LinkDrop-Setup.exe를 더블클릭하고 '설치' 버튼을 누르세요."
                active={downloaded && !installed}
                done={!!installed}
              />
              <StepItem
                num={3}
                title="자동 연결 완료"
                desc="설치가 끝나면 이 화면이 자동으로 바뀝니다. 새로고침 필요 없어요."
                active={false}
                done={!!installed}
              />
            </div>

            {/* 다운로드 버튼 */}
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-2xl font-black text-lg shadow-2xl shadow-fuchsia-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <FontAwesomeIcon icon={faDownload} />
              LinkDrop 다운로드
              <span className="text-sm opacity-60">({INSTALLER_SIZE})</span>
            </button>

            {downloaded && !installed && (
              <div className="mt-4 flex items-center justify-center gap-2 text-amber-400 text-xs font-bold animate-pulse">
                <FontAwesomeIcon icon={faClock} />
                다운로드 완료 후 설치 파일을 실행해 주세요... 자동 감지 중
              </div>
            )}

            {/* 시스템 요구사항 */}
            <div className="mt-8 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faShieldHalved} className="text-indigo-400 text-xs" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">설치 정보</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <p className="text-slate-500 mb-0.5">운영체제</p>
                  <p className="text-slate-300 font-bold">Windows 10 이상</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">파일 크기</p>
                  <p className="text-slate-300 font-bold">{INSTALLER_SIZE}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">버전</p>
                  <p className="text-slate-300 font-bold">v{APP_VERSION}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">추가 설치</p>
                  <p className="text-slate-300 font-bold">없음 (올인원)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 돌아가기 */}
        <div className="text-center">
          <Link
            href="/content/longform"
            className="inline-flex items-center gap-2 text-slate-500 text-xs font-bold hover:text-slate-300 transition-all"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            영상 제작 페이지로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}

function StepItem({ num, title, desc, active, done }: {
  num: number; title: string; desc: string; active: boolean; done: boolean;
}) {
  return (
    <div className={`flex items-start gap-4 transition-all ${active ? 'opacity-100' : done ? 'opacity-60' : 'opacity-30'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
        done ? 'bg-emerald-600 text-white'
        : active ? 'bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30'
        : 'bg-slate-800 text-slate-600'
      }`}>
        {done ? <FontAwesomeIcon icon={faCheckCircle} className="text-xs" /> : num}
      </div>
      <div>
        <p className={`text-sm font-black ${done ? 'text-emerald-400' : active ? 'text-white' : 'text-slate-600'}`}>{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
