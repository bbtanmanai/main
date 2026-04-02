'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Github, ExternalLink, Code2, Palette, Zap, Cpu, Rocket, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import portfolioData from '../data/index_portfolio.json';

export default function HomePage() {
  // 아이콘 매핑 객체
  const iconMap: Record<string, React.ReactNode> = {
    Cpu: <Cpu size={28} />,
    Palette: <Palette size={28} />,
    BarChart3: <BarChart3 size={28} />,
    Zap: <Zap size={28} />,
    Rocket: <Rocket size={28} />
  };

  return (
    <div className="dark min-h-screen bg-[#020617] text-slate-100 selection:bg-cyan-500/30 font-sans overflow-x-hidden">
      {/* ── Liquid Scene (Background Blobs) ────────────────────────────────── */}
      <div className="lg-scene">
        <div className="lg-blob lg-blob-1 mix-blend-screen" style={{ opacity: 0.3 }} />
        <div className="lg-blob lg-blob-2 mix-blend-screen" style={{ opacity: 0.25 }} />
        <div className="lg-blob lg-blob-3 mix-blend-screen" style={{ opacity: 0.2 }} />
        {/* 추가적인 깊이감을 위한 마스크 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#020617_80%)] opacity-60" />
      </div>

      {/* ── Navigation (Glass Bar) ─────────────────────────────────────────── */}
      <nav className="fixed top-8 w-full z-[100] px-6">
        <div className="max-w-5xl mx-auto lg-glass px-10 py-5 rounded-[32px] flex justify-between items-center border-white/10">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-4 cursor-pointer"
          >
            <div className="w-12 h-12 lg-glass bg-gradient-to-br from-[#5ee7df] to-[#3b82f6] rounded-2xl flex items-center justify-center shadow-lg">
              <Zap size={24} fill="white" className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              LinkDrop
            </span>
          </motion.div>
          
          <div className="hidden md:flex items-center gap-12 text-sm font-bold tracking-tight text-slate-400">
            <a href="#main" className="hover:text-[#5ee7df] transition-colors">Main</a>
            <a href="#portfolio" className="hover:text-[#b490f5] transition-colors">Portfolio</a>
            <Link href="/admin" className="lg-btn lg-btn-ghost px-6 py-2.5 rounded-2xl text-xs font-black text-white border-white/10 uppercase tracking-widest">
              Admin Gateway
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section (Main) ────────────────────────────────────────────── */}
      <section id="main" className="relative pt-64 pb-40 px-6 flex flex-col items-center justify-center min-h-screen overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
          className="lg-glass px-6 py-2.5 rounded-full border-white/10 text-[11px] font-black tracking-[0.3em] text-[#5ee7df] uppercase mb-16 shadow-[0_0_30px_rgba(94,231,223,0.1)]"
        >
          <span className="flex items-center gap-3"><Sparkles size={14} /> The Future of Digital Production</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, filter: 'blur(20px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="text-7xl md:text-[120px] font-[1000] tracking-[-0.04em] text-center mb-12 leading-[1.1] text-white"
        >
          업무 자동화 <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#5ee7df] via-[#b490f5] to-[#f7a8c4] filter drop-shadow-[0_0_50px_rgba(180,144,245,0.3)]">
            스킬
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-xl md:text-2xl text-slate-400 text-center max-w-3xl mb-20 leading-[1.6] font-medium tracking-tight"
        >
          우리는 데이터의 흐름을 예술로 승화시키고, <br className="hidden md:block" />
          가장 정교한 자동화 알고리즘으로 당신의 가치를 증명합니다.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex flex-col sm:flex-row gap-8"
        >
          <button className="lg-btn lg-btn-primary px-16 py-6 rounded-[28px] font-black text-xl text-white flex items-center gap-4 group">
            Experience Now <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
          </button>
          <button className="lg-btn lg-btn-ghost px-12 py-6 rounded-[28px] font-black text-xl text-white border-white/5 bg-white/5">
            View Blueprint
          </button>
        </motion.div>

        {/* Liquid Scroll Indicator */}
        <div className="absolute bottom-12 flex flex-col items-center gap-4">
          <span className="text-[10px] font-black tracking-widest text-slate-600 uppercase">Scroll to Explore</span>
          <motion.div 
            animate={{ height: [40, 80, 40], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-px bg-gradient-to-b from-[#5ee7df] to-transparent rounded-full"
          />
        </div>
      </section>

      {/* ── Portfolio Section ─────────────────────────────────────────────── */}
      <section id="portfolio" className="relative py-48 px-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-32 border-b border-white/5 pb-16">
          <div className="max-w-2xl">
            <motion.h2 
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-10 italic"
            >
              PROJECTS
            </motion.h2>
            <p className="text-2xl text-slate-500 font-medium leading-relaxed">
              최첨단 AI 기술과 감각적인 디자인이 만나 탄생한 <br />
              LinkDrop의 독보적인 포트폴리오를 공개합니다.
            </p>
          </div>
          <div className="mt-12 md:mt-0 flex items-center gap-10">
            <div className="flex flex-col items-end">
              <span className="text-5xl font-black text-white italic">{portfolioData.length}+</span>
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase mt-1">Modules Ready</span>
            </div>
            <div className="w-px h-16 bg-white/10" />
            <button className="lg-btn lg-btn-violet px-8 py-4 rounded-2xl text-sm font-black text-white flex items-center gap-3">
              Full Showcase <Rocket size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {portfolioData.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              whileHover={{ y: -10 }}
              className="relative group h-[480px] rounded-[48px] overflow-hidden cursor-pointer lg-glass border-white/10"
            >
              {/* Background Image with Hover Zoom */}
              <motion.div 
                className="absolute inset-0 z-0"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-500"
                />
                {/* Gradient Overlay for Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/70 to-transparent" />
              </motion.div>

              {/* Card Content */}
              <div className="relative z-10 p-10 h-full flex flex-col justify-between">
                <div>
                  <div className="mb-8 flex justify-between items-start">
                    <div 
                      className="w-12 h-12 rounded-[18px] lg-glass flex items-center justify-center text-white shadow-xl transition-transform duration-500 group-hover:rotate-[15deg] group-hover:scale-110"
                      style={{ background: `linear-gradient(135deg, ${item.color}66, transparent)`, borderColor: `${item.color}33` }}
                    >
                      {iconMap[item.icon] || <Zap size={20} />}
                    </div>
                    <div className="text-white/30 group-hover:text-white transition-colors duration-500">
                      <ExternalLink size={20} />
                    </div>
                  </div>
                  
                  <span className="text-[9px] font-black tracking-[0.3em] text-[#5ee7df] uppercase mb-4 block opacity-80 group-hover:opacity-100 transition-opacity">
                    {item.category}
                  </span>
                  <h3 className="text-2xl font-black text-white mb-4 tracking-tighter leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/60 transition-all duration-500">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed group-hover:text-slate-200 transition-colors duration-500 line-clamp-3">
                    {item.desc}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mt-6">
                  {item.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="text-[8px] font-bold text-slate-400 border border-white/10 px-2.5 py-1.5 rounded-full backdrop-blur-md bg-white/5 group-hover:border-white/30 group-hover:text-white transition-all">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Liquid Glow Effect on Hover */}
              <div 
                className="absolute -bottom-20 -right-20 w-64 h-64 blur-[100px] opacity-0 group-hover:opacity-20 transition-all duration-700 pointer-events-none"
                style={{ background: item.color }}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="py-32 border-t border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-[#5ee7df] to-transparent mb-12 opacity-30" />
          <p className="text-[11px] font-black tracking-[0.4em] text-slate-700 uppercase mb-4">
            Liquid Glass Design Language v2.1
          </p>
          <p className="text-sm font-bold text-slate-500">
            © 2026 LinkDropV2 AI Studio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
