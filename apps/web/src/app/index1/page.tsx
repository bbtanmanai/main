'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, ArrowRight, Check, ChevronDown, ChevronUp,
  Zap, Film, Palette, Mic, Upload, Gift,
  Play, Star, Shield, Users, TrendingUp, Clock
} from 'lucide-react'

/* ─── FAQ 데이터 ─── */
const FAQS = [
  {
    q: '영상 제작에 전문 지식이 필요한가요?',
    a: '아닙니다. 주제만 입력하면 AI가 시나리오 작성, 성우 더빙, 영상 편집까지 모두 자동으로 처리합니다. 편집 경험이 전혀 없어도 됩니다.',
  },
  {
    q: '베이직과 프로의 차이가 무엇인가요?',
    a: '베이직은 ₩59,000 일회 결제로 영상 50편을 제공합니다. 프로는 ₩29,000/월 구독으로 서버 용량 내 무제한 제작이 가능하며, 추천 후원 수당도 수령할 수 있습니다.',
  },
  {
    q: '만들어진 영상의 저작권은 누구에게 있나요?',
    a: '제작된 모든 영상의 저작권은 사용자에게 귀속됩니다. 유튜브, 인스타그램, 틱톡 등 모든 플랫폼에 자유롭게 업로드할 수 있습니다.',
  },
  {
    q: '영상 1편을 만드는 데 얼마나 걸리나요?',
    a: '시나리오 생성 약 30초, 영상 합성 약 3~5분으로 총 5분 이내에 완성됩니다. 주제 입력부터 최종 영상 다운로드까지 완전 자동화되어 있습니다.',
  },
  {
    q: '추천 수당은 어떻게 받나요?',
    a: '프로 구독자가 지인에게 베이직 플랜을 추천해 결제가 이루어지면 ₩18,700 일회 수당이 지급됩니다. 해당 지인이 프로로 전환하면 매월 ₩9,200 수당이 추가로 지급됩니다.',
  },
  {
    q: '환불이 가능한가요?',
    a: '베이직은 결제 후 7일 이내, 영상 미사용 시 조건 없이 전액 환불됩니다. 프로 구독은 해지 시 다음 결제일부터 청구가 중단됩니다.',
  },
]

/* ─── 기능 데이터 ─── */
const FEATURES = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    color: 'from-cyan-500 to-blue-500',
    title: 'AI 시나리오 자동 생성',
    desc: 'NotebookLM 지식 기반으로 주제에 맞는 시나리오를 3가지 스타일로 자동 생성합니다.',
  },
  {
    icon: <Palette className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    title: '9가지 키프레임 화풍',
    desc: '할리우드 SF, 지브리, 수묵화, 픽사 3D 등 9가지 화풍으로 영상 분위기를 자유롭게 설정합니다.',
  },
  {
    icon: <Mic className="w-6 h-6" />,
    color: 'from-green-500 to-teal-500',
    title: '8명 AI 성우 더빙',
    desc: 'Google Neural2 기반 자연스러운 한국어 성우 8명 중 원하는 목소리를 선택해 더빙합니다.',
  },
  {
    icon: <Film className="w-6 h-6" />,
    color: 'from-orange-500 to-red-500',
    title: '자동 영상 합성 (FFmpeg)',
    desc: 'Ken Burns 줌패닝 + xfade 장면 전환 + BGM 믹싱까지 서버에서 자동으로 처리합니다.',
  },
  {
    icon: <Upload className="w-6 h-6" />,
    color: 'from-blue-500 to-indigo-500',
    title: 'Google Drive 자동 저장',
    desc: '완성된 영상과 모든 에셋이 Google Drive에 자동 저장되어 언제든 재활용할 수 있습니다.',
  },
  {
    icon: <Gift className="w-6 h-6" />,
    color: 'from-pink-500 to-rose-500',
    title: '추천 후원 수당 시스템',
    desc: '지인을 추천해 베이직 결제 시 ₩18,700, 프로 전환 시 매월 ₩9,200 수당을 받습니다.',
  },
]

/* ─── 3단계 프로세스 ─── */
const STEPS = [
  {
    num: '01',
    color: 'from-cyan-400 to-blue-400',
    title: '템플릿 & 화풍 선택',
    desc: '12개 지식 템플릿(건강, 재테크, AI 트렌드 등)과 9가지 화풍 중 원하는 조합을 선택합니다.',
  },
  {
    num: '02',
    color: 'from-purple-400 to-pink-400',
    title: '시나리오 & 성우 선택',
    desc: 'AI가 생성한 3가지 시나리오 중 마음에 드는 것을 선택하고 성우와 주제를 확정합니다.',
  },
  {
    num: '03',
    color: 'from-green-400 to-teal-400',
    title: '영상 자동 제작',
    desc: '버튼 하나로 시나리오 → 더빙 → 키프레임 → 합성까지 5분 내 완성 영상이 생성됩니다.',
  },
]

/* ─── 타겟 유저 ─── */
const AUDIENCES = [
  { emoji: '🚀', title: '1인 사업자', desc: '제품·서비스 홍보 영상을 빠르게 대량 제작해 SNS 마케팅 비용을 절감합니다.' },
  { emoji: '📣', title: '마케터', desc: '레드오션 인기 콘텐츠를 AI로 재생산해 채널 조회수와 광고 수익을 높입니다.' },
  { emoji: '✍️', title: '콘텐츠 크리에이터', desc: '아이디어만 있으면 전문 편집 없이 일관된 품질의 영상을 꾸준히 업로드합니다.' },
  { emoji: '💡', title: '부업 희망자', desc: '추천 수당 시스템을 활용해 영상 제작과 동시에 추가 수입을 만들 수 있습니다.' },
]

/* ─── 갤러리 플레이스홀더 ─── */
const GALLERY_ITEMS = [
  { label: '건강 웰빙 · 수묵화', gradient: 'from-emerald-900 to-teal-800' },
  { label: '재테크 · 할리우드 SF', gradient: 'from-blue-900 to-indigo-800' },
  { label: 'AI 트렌드 · 픽사 3D', gradient: 'from-purple-900 to-pink-800' },
  { label: '지혜 명언 · 네오 누와르', gradient: 'from-gray-900 to-slate-700' },
  { label: '라이프스타일 · 지브리+실사', gradient: 'from-green-900 to-emerald-700' },
  { label: '쇼츠 바이럴 · 팝아트', gradient: 'from-yellow-900 to-orange-800' },
  { label: '인스타 마케팅 · 실사', gradient: 'from-rose-900 to-red-800' },
  { label: '업무 자동화 · 스티커 컷아웃', gradient: 'from-cyan-900 to-blue-800' },
]

/* ─── FAQ 아이템 ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-cyan-500/40 transition-colors"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-white font-medium">{q}</span>
        {open
          ? <ChevronUp className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
      </div>
      {open && (
        <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/10 pt-4">
          {a}
        </div>
      )}
    </div>
  )
}

/* ─── 메인 페이지 ─── */
export default function Index1Page() {
  return (
    <div className="min-h-screen bg-[#050B1E] text-white font-sans">

      {/* ── 네비게이션 ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050B1E]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">LinkDrop</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">기능</a>
            <a href="#how" className="hover:text-white transition-colors">사용법</a>
            <a href="#pricing" className="hover:text-white transition-colors">가격</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <Link
            href="/content/longform"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            무료로 시작하기
          </Link>
        </div>
      </nav>

      {/* ── 히어로 ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* 배경 글로우 */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* 뱃지 */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-cyan-400 mb-8">
            <Sparkles className="w-4 h-4" />
            AI 영상 자동화 플랫폼 · Zero-Hands 제작
          </div>

          {/* 헤드라인 */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight">
            주제만 입력하면<br />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI가 영상을 만듭니다
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            NotebookLM 시나리오 → Google TTS 더빙 → FFmpeg 합성까지<br />
            5분 안에 60초 완성 영상. 편집 경험 불필요.
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/content/longform"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 font-bold text-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-cyan-500/20"
            >
              지금 바로 시작하기
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/20 font-bold text-lg hover:bg-white/5 transition-all">
              <Play className="w-5 h-5 text-cyan-400" />
              데모 영상 보기
            </button>
          </div>

          {/* 히어로 이미지 플레이스홀더 */}
          <div className="relative mx-auto max-w-3xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
            <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Film className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm">히어로 이미지 / 데모 영상 (추후 추가)</p>
              </div>
            </div>
            {/* 글로우 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050B1E] via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ── 신뢰 지표 ── */}
      <section className="py-10 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: '5분', label: '영상 1편 제작 시간' },
            { val: '9종', label: '키프레임 화풍' },
            { val: '8명', label: 'AI 성우' },
            { val: '12종', label: '지식 템플릿' },
          ].map(({ val, label }) => (
            <div key={label}>
              <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{val}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3단계 사용법 ── */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-cyan-400 text-sm font-semibold uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-4xl font-black">단 3단계로 완성</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.num} className="relative p-6 rounded-2xl bg-white/3 border border-white/10 hover:border-white/20 transition-colors">
                <div className={`text-5xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent mb-4`}>
                  {s.num}
                </div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 기능 ── */}
      <section id="features" className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl font-black">모든 것이 자동화되어 있습니다</h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">생성형 AI 사용을 최소화해 저비용으로 대량 영상을 생산합니다</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-white/3 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 갤러리 ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-pink-400 text-sm font-semibold uppercase tracking-widest mb-3">Gallery</p>
            <h2 className="text-4xl font-black">이런 영상이 만들어집니다</h2>
            <p className="text-gray-400 mt-4">각 템플릿 × 화풍 조합 샘플 (이미지 추후 추가)</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GALLERY_ITEMS.map((item) => (
              <div
                key={item.label}
                className={`aspect-video rounded-xl bg-gradient-to-br ${item.gradient} border border-white/10 flex items-center justify-center relative overflow-hidden group hover:scale-105 transition-transform cursor-pointer`}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs text-white/40 text-center px-2 group-hover:opacity-0 transition-opacity">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 타겟 유저 ── */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">Who It's For</p>
            <h2 className="text-4xl font-black">이런 분께 딱 맞습니다</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="p-6 rounded-2xl bg-white/3 border border-white/10 hover:border-white/20 transition-colors text-center">
                <div className="text-4xl mb-4">{a.emoji}</div>
                <h3 className="font-bold mb-2">{a.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 가격 ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-cyan-400 text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-4xl font-black">합리적인 가격, 놀라운 가성비</h2>
            <p className="text-gray-400 mt-4">경쟁사 대비 최대 95% 저렴한 영상 제작 단가</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 베이직 */}
            <div className="p-8 rounded-2xl bg-white/3 border border-white/10">
              <div className="text-sm text-gray-400 mb-2">베이직</div>
              <div className="text-4xl font-black mb-1">₩59,000</div>
              <div className="text-gray-500 text-sm mb-6">1회 결제 · 영구 사용</div>
              <ul className="space-y-3 mb-8">
                {['영상 50편 제공', '9가지 화풍 선택', '8명 AI 성우', '12개 지식 템플릿', 'Google Drive 자동 저장'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/content/longform"
                className="block text-center py-3 rounded-xl border border-white/20 font-semibold hover:bg-white/5 transition-colors"
              >
                베이직 시작하기
              </Link>
            </div>

            {/* 프로 */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-purple-900/40 to-cyan-900/20 border border-purple-500/40 relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-xs font-bold">
                추천
              </div>
              <div className="text-sm text-purple-400 mb-2">프로</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black">₩29,000</span>
                <span className="text-gray-400 text-sm mb-1">/월</span>
              </div>
              <div className="text-gray-500 text-sm mb-6">월 구독 · 언제든 해지 가능</div>
              <ul className="space-y-3 mb-8">
                {[
                  '영상 무제한 제작 (서버 용량 내)',
                  '베이직 전체 기능 포함',
                  '추천 수당 수령 자격',
                  '베이직 유치 시 ₩18,700 일회 수당',
                  '프로 전환 시 ₩9,200/월 반복 수당',
                  '우선 지원 및 신기능 선공개',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/content/longform"
                className="block text-center py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 font-bold hover:opacity-90 transition-opacity"
              >
                프로 구독 시작하기
              </Link>
            </div>
          </div>

          {/* 수당 안내 */}
          <div className="mt-6 p-5 rounded-xl bg-white/3 border border-yellow-500/20 text-sm text-gray-400 flex gap-3">
            <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <span>수당 지급은 방문판매법 제22조 기준 VAT 제외 공급가액의 35% 이내로 운영됩니다. 프로 구독자에 한해 추천 수당 수령이 가능합니다. 런칭 전 공정거래위원회 신고 완료 예정.</span>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-4xl font-black">자주 묻는 질문</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 최종 CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl" />
          <div className="relative p-12 rounded-3xl border border-white/10">
            <h2 className="text-4xl font-black mb-4">
              지금 바로 시작하세요
            </h2>
            <p className="text-gray-400 mb-8 text-lg">주제만 입력하면 5분 안에 완성 영상.</p>
            <Link
              href="/content/longform"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 font-bold text-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-purple-500/20"
            >
              무료로 시작하기
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-gray-500 mt-4">베이직 7일 이내 미사용 시 조건 없이 환불</p>
          </div>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold">LinkDrop</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                AI가 만드는 영상 콘텐츠 자동화 플랫폼.<br />주제만 입력하면 결과만 받습니다.
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">서비스</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/content/longform" className="hover:text-white transition-colors">롱폼 영상 제작</Link></li>
                <li><Link href="/content/shorts" className="hover:text-white transition-colors">쇼츠 제작</Link></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">가격 안내</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">정책</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">이용약관</a></li>
                <li><a href="#" className="hover:text-white transition-colors">개인정보처리방침</a></li>
                <li><a href="#" className="hover:text-white transition-colors">환불 정책</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <span>© 2026 LinkDrop. All rights reserved.</span>
            <span>대한민국 방문판매법 준수 · 공정거래위원회 신고 예정</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
