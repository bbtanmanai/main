'use client';

import React from 'react';

const A4_W  = 794;
const A4_H  = 1123;
const PAD_V = 60;
const PAD_H = 72;
const MIN_CHAPTERS = 4;
const MAX_CHAPTERS = 12;
const DEFAULT_CHAPTERS = 6;


function getChapterSub(num: number, total: number): string {
  if (num === 1) return '도입부';
  if (num === total) return '결말';
  if (num === total - 1) return '클라이맥스';
  return `전개${'①②③④⑤⑥⑦⑧'.charAt(num - 2) || num - 1}`;
}

function buildChapterLabels(total: number) {
  return Array.from({ length: total }, (_, i) => ({
    num: i + 1,
    title: `${i + 1}챕터`,
    sub: getChapterSub(i + 1, total),
  }));
}

export default function SeriesScriptPage() {
  const [totalChapters, setTotalChapters] = React.useState(DEFAULT_CHAPTERS);
  const [activeChapter, setActiveChapter] = React.useState(1);
  const [contents, setContents] = React.useState<Record<number, string>>({});
  const [title, setTitle] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const chapterLabels = React.useMemo(() => buildChapterLabels(totalChapters), [totalChapters]);

  const CHAR_MIN = 2000;
  const CHAR_MAX = 3000;
  const charCount = (contents[activeChapter] ?? '').replace(/\s/g, '').length;
  const totalCharCount = Object.values(contents).reduce((acc, v) => acc + v.replace(/\s/g, '').length, 0);

  const handleContentChange = (val: string) => {
    setContents(prev => ({ ...prev, [activeChapter]: val }));
  };

  const handleTotalChaptersChange = (val: number) => {
    const next = Math.min(MAX_CHAPTERS, Math.max(MIN_CHAPTERS, val));
    setTotalChapters(next);
    if (activeChapter > next) setActiveChapter(next);
  };

  // 챕터 전환 시 textarea 포커스
  React.useEffect(() => {
    textareaRef.current?.focus();
  }, [activeChapter]);

  return (
    <div className="neu-bg min-h-screen flex flex-col">

      {/* ── 상단 툴바 ── */}
      <div className="sticky top-[52px] z-50 border-b border-[#b8bcc2]" style={{ background: 'linear-gradient(145deg, #e6e9ef, #d1d5db)', boxShadow: '0 4px 12px rgba(184,188,194,0.4)' }}>
        <div className="flex items-center gap-0" style={{ width: A4_W, margin: '0 auto', paddingLeft: 8, paddingRight: 8, minHeight: 44 }}>

          {/* 제목 입력 */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="시리즈 제목을 입력하세요"
            className="flex-1 text-sm font-bold text-gray-800 bg-transparent outline-none placeholder:text-gray-300 px-2"
          />

          {/* 챕터 수 조정 */}
          <div className="flex items-center gap-1 text-[11px] text-gray-400 border-l border-gray-100 pl-3 ml-2">
            <span>챕터</span>
            <button
              onClick={() => handleTotalChaptersChange(totalChapters - 1)}
              disabled={totalChapters <= MIN_CHAPTERS}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30"
            >−</button>
            <span className="font-bold text-gray-700 w-4 text-center">{totalChapters}</span>
            <button
              onClick={() => handleTotalChaptersChange(totalChapters + 1)}
              disabled={totalChapters >= MAX_CHAPTERS}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30"
            >+</button>
          </div>

          {/* 전체 글자수 */}
          <div className="flex items-center gap-3 text-[11px] text-gray-400 border-l border-gray-100 pl-3 ml-2">
            <span>전체 <strong className="text-gray-600">{totalCharCount.toLocaleString()}</strong>자</span>
            <span className="text-gray-300">|</span>
            <span>A4</span>
          </div>
        </div>
      </div>

      {/* ── 챕터 탭 ── */}
      <div className="sticky top-[96px] z-40 border-b border-[#b8bcc2]" style={{ background: 'linear-gradient(145deg, #e6e9ef, #d1d5db)' }}>
        <div className="flex" style={{ width: A4_W, margin: '0 auto' }}>
          {chapterLabels.map(ch => {
            const chCount = (contents[ch.num] ?? '').replace(/\s/g, '').length;
            const isActive = activeChapter === ch.num;
            const isFilled = chCount > 0;
            return (
              <button
                key={ch.num}
                onClick={() => setActiveChapter(ch.num)}
                className="flex-1 flex flex-col items-center py-2.5 transition-all relative"
                style={{
                  borderBottom: isActive ? '2.5px solid #7c3aed' : '2.5px solid transparent',
                  background: isActive ? 'linear-gradient(145deg, #d1d5db, #e6e9ef)' : 'transparent',
                }}
              >
                <span className={`text-[11px] font-black ${isActive ? 'text-purple-600' : 'text-gray-500'}`}>
                  {ch.title}
                </span>
                <span className={`text-[9px] mt-0.5 ${isActive ? 'text-purple-400' : 'text-gray-300'}`}>
                  {ch.sub}
                </span>
                {isFilled && (
                  <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-purple-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── A4 본문 ── */}
      <div className="flex-1 flex justify-center py-10">
        <div
          className="relative neu-raised rounded-sm"
          style={{
            width: A4_W,
            minHeight: A4_H,
          }}
        >
          {/* 챕터 헤더 */}
          <div
            style={{
              padding: `${PAD_V * 0.6}px ${PAD_H}px ${PAD_V * 0.3}px`,
              borderBottom: '1.5px solid #d1d5db',
            }}
          >
            <div className="flex items-baseline gap-3">
              <span className="text-[11px] font-black text-purple-400 tracking-widest uppercase">
                Chapter {activeChapter}
              </span>
              <span className="text-[11px] text-gray-300">
                {chapterLabels[activeChapter - 1]?.sub}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-gray-400">
              {charCount > 0
                ? <>
                    <strong className={charCount >= CHAR_MIN ? 'text-purple-600' : 'text-gray-700'}>{charCount.toLocaleString()}</strong>
                    <span className="text-gray-300"> / {CHAR_MIN.toLocaleString()}~{CHAR_MAX.toLocaleString()}자</span>
                    {charCount >= CHAR_MIN && charCount <= CHAR_MAX && <span className="ml-2 text-purple-500">✓ 목표 달성</span>}
                    {charCount > CHAR_MAX && <span className="ml-2 text-amber-500">⚠ 초과 ({charCount - CHAR_MAX}자)</span>}
                  </>
                : `목표 ${CHAR_MIN.toLocaleString()}~${CHAR_MAX.toLocaleString()}자`}
            </div>
          </div>

          {/* 편집 영역 */}
          <div style={{ padding: `${PAD_V * 0.8}px ${PAD_H}px ${PAD_V}px` }}>
            <textarea
              ref={textareaRef}
              value={contents[activeChapter] ?? ''}
              onChange={e => handleContentChange(e.target.value)}
              placeholder={`챕터 ${activeChapter} — ${chapterLabels[activeChapter - 1]?.sub}\n\n내용을 입력하세요...`}
              className="w-full outline-none resize-none text-gray-800 placeholder:text-gray-300"
              style={{
                minHeight: A4_H - PAD_V * 2.8,
                fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
                fontSize: 14,
                lineHeight: 1.9,
                letterSpacing: '0.01em',
                border: 'none',
                background: 'transparent',
              }}
            />
          </div>

          {/* 페이지 하단 */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 pb-5"
            style={{ color: '#d1d5db', fontSize: 10 }}
          >
            <span>{title || '제목 없음'}</span>
            <span>{activeChapter} / {totalChapters}</span>
          </div>
        </div>
      </div>

      {/* ── 챕터 진행 바 ── */}
      <div className="sticky bottom-0 py-2" style={{ zIndex: 40, background: 'linear-gradient(145deg, #e6e9ef, #d1d5db)', borderTop: '1px solid #b8bcc2' }}>
        <div className="flex items-center gap-2 text-[11px] text-gray-400" style={{ width: A4_W, margin: '0 auto', paddingLeft: 8 }}>
          <span>진행</span>
          <div className="flex gap-1 flex-1">
            {chapterLabels.map(ch => {
              const cnt = (contents[ch.num] ?? '').replace(/\s/g, '').length;
              const pct = Math.min(100, Math.round((cnt / CHAR_MAX) * 100));
              return (
                <div key={ch.num} className="flex-1 flex flex-col gap-0.5">
                  <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? '#7c3aed' : '#c4b5fd',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <span className="text-gray-500 font-bold">{Math.round((totalCharCount / (CHAR_MAX * totalChapters)) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
