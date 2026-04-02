'use client';

import React from 'react';
import Link from 'next/link';

export default function FrontFooter() {
  return (
    <footer className="bg-[#0f172a] text-slate-400 py-16 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="space-y-4">
          <Link href="/front" className="text-xl font-black text-white tracking-tighter">
            Link<span className="text-[#9333ea]">Drop</span>
          </Link>
          <p className="text-sm leading-relaxed">
            실무에 바로 쓰는 AI 활용 가이드 플랫폼. <br />
            AI와 함께하는 비즈니스 자동화의 시작.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-widest">AI 활용</h4>
          <ul className="space-y-3 text-sm font-medium">
            <li><Link href="/front/idea" className="hover:text-white transition-colors">아이디어 공장</Link></li>
            <li><Link href="/marketing/news" className="hover:text-white transition-colors">뉴스요약</Link></li>
            <li><Link href="/front/shorts" className="hover:text-white transition-colors">쇼츠제작</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-widest">프롬프트</h4>
          <ul className="space-y-3 text-sm font-medium">
            <li><Link href="/prompt/basic" className="hover:text-white transition-colors">AI 실무 가이드</Link></li>
            <li><Link href="/prompt/library" className="hover:text-white transition-colors">프롬프트 라이브러리</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-widest">프론트엔드</h4>
          <ul className="space-y-3 text-sm font-medium">
            <li><Link href="/front/word" className="hover:text-white transition-colors">필수단어</Link></li>
            <li><Link href="/front/color" className="hover:text-white transition-colors">색상 가이드</Link></li>
            <li><Link href="/front/design" className="hover:text-white transition-colors">디자인 템플릿</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[11px] font-bold uppercase tracking-widest opacity-50">
          © 2026 LinkDrop — AI 실무 학습 플랫폼. All rights reserved.
        </p>
        <div className="flex gap-3">
          <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-tighter border border-white/5">AI 활용</span>
          <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-tighter border border-white/5">프롬프트</span>
          <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-tighter border border-white/5">마케팅</span>
        </div>
      </div>
    </footer>
  );
}
