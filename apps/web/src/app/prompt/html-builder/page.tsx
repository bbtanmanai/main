'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBold, faItalic, faCode, faStrikethrough,
  faListUl, faListOl, faImage, faMinus,
  faUndo, faRedo, faFilePdf, faFileCode,
  faChevronDown, faQuoteLeft, faLink, faTable,
} from '@fortawesome/free-solid-svg-icons';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

// ── A4 상수 (96 dpi) ──────────────────────────────────────────────────────────
const A4_W  = 794;
const A4_H  = 1123;
const PAD_V = 56;
const PAD_H = 68;

// ── 유틸 ──────────────────────────────────────────────────────────────────────
function escapeHtml(t: string) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function sanitizeUrl(url: string) {
  const v = url.trim();
  return v.toLowerCase().startsWith('javascript:') ? '' : v;
}
function looksLikeMarkdown(t: string) {
  return (
    /^#{1,6}\s+\S/m.test(t) || /^\s*[-*+]\s+\S/m.test(t) ||
    /^\s*\d+\.\s+\S/m.test(t) || /```/.test(t) ||
    /\[.+?\]\(https?:\/\/.+?\)/m.test(t) || /^\s*>\s+\S/m.test(t)
  );
}
function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  let i = 0, inCode = false, codeLang = '', codeBuf: string[] = [];
  const out: string[] = [];
  const inline = (s: string) => {
    let x = escapeHtml(s);
    x = x.replace(/`([^`]+)`/g, '<code>$1</code>');
    x = x.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    x = x.replace(/~~([^~]+)~~/g, '<s>$1</s>');
    x = x.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    x = x.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
      const safe = sanitizeUrl(String(url));
      return safe ? `<a href="${escapeHtml(safe)}">${label}</a>` : label;
    });
    return x;
  };
  const flushCode = () => {
    if (!codeBuf.length) return;
    const cls = codeLang ? ` class="language-${escapeHtml(codeLang)}"` : '';
    out.push(`<pre><code${cls}>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
    codeBuf = []; codeLang = '';
  };
  const parseList = (ordered: boolean) => {
    const items: string[] = [];
    while (i < lines.length) {
      const m = ordered ? lines[i].match(/^\s*\d+\.\s+(.+)$/) : lines[i].match(/^\s*[-*+]\s+(.+)$/);
      if (!m) break;
      items.push(`<li>${inline(m[1])}</li>`); i++;
    }
    out.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
  };
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^\s*```(\S*)\s*$/);
    if (fence) { inCode ? (inCode = false, flushCode()) : (inCode = true, codeLang = fence[1] ?? '', codeBuf = []); i++; continue; }
    if (inCode) { codeBuf.push(line); i++; continue; }
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    const q = line.match(/^\s*>\s?(.*)$/);
    if (q) {
      const buf: string[] = [];
      while (i < lines.length) { const qm = lines[i].match(/^\s*>\s?(.*)/); if (!qm) break; buf.push(inline(qm[1])); i++; }
      out.push(`<blockquote><p>${buf.join('<br>')}</p></blockquote>`); continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) { parseList(false); continue; }
    if (/^\s*\d+\.\s+/.test(line)) { parseList(true); continue; }
    if (!line.trim()) { i++; continue; }
    const p: string[] = [];
    while (i < lines.length && lines[i].trim()) {
      if (/^\s*```|^#{1,6}\s|^\s*>\s|^\s*[-*+]\s|^\s*\d+\.\s/.test(lines[i])) break;
      p.push(inline(lines[i])); i++;
    }
    out.push(`<p>${p.join('<br>')}</p>`);
  }
  if (inCode) flushCode();
  return out.join('');
}

// ── 기본 콘텐츠 ───────────────────────────────────────────────────────────────
const DEFAULT_CONTENT = `
<h1>문서 제목</h1>
<p>노션이나 옵시디언에서 복사 후 바로 붙여넣으세요.</p>
<h2>지원 문법</h2>
<ul>
  <li><strong>굵게</strong> / <em>기울임</em> / <s>취소선</s> / <code>인라인 코드</code></li>
  <li>글머리 기호 / 번호 목록 / 표 / 링크 / 이미지</li>
</ul>
<h2>표 예시</h2>
<table>
  <thead><tr><th>항목</th><th>설명</th><th>비고</th></tr></thead>
  <tbody>
    <tr><td>행 1</td><td>내용</td><td>-</td></tr>
    <tr><td>행 2</td><td>내용</td><td>-</td></tr>
  </tbody>
</table>
`;

// ── 툴바 버튼 ─────────────────────────────────────────────────────────────────
function ToolBtn({ icon, label, active, onClick }: { icon?: any; label?: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={label}
      className={`flex items-center justify-center w-7 h-7 rounded text-sm transition-colors
        ${active ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200 text-gray-600'}`}
    >
      {icon ? <FontAwesomeIcon icon={icon} className="text-xs" /> : <span className="text-xs font-black">{label}</span>}
    </button>
  );
}
function Divider() { return <div className="w-px h-5 bg-gray-300 mx-1" />; }

// ── 폰트 정의 ─────────────────────────────────────────────────────────────────
const FONTS: { label: string; value: string }[] = [
  { label: '기본 (시스템)',  value: "system-ui,'Segoe UI',sans-serif" },
  { label: 'Paperlogy',     value: 'Paperlogy' },
  { label: 'KERISKEDU',     value: 'KERISKEDU' },
  { label: '서울 알림',     value: 'SeoulAlrim' },
];

const FONT_FACE_CSS = `
@font-face { font-family:'Paperlogy'; font-weight:500; src:url('/assets/font/Paperlogy-5Medium.ttf'); }
@font-face { font-family:'Paperlogy'; font-weight:600; src:url('/assets/font/Paperlogy-6SemiBold.ttf'); }
@font-face { font-family:'Paperlogy'; font-weight:700; src:url('/assets/font/Paperlogy-7Bold.ttf'); }
@font-face { font-family:'Paperlogy'; font-weight:800; src:url('/assets/font/Paperlogy-8ExtraBold.ttf'); }
@font-face { font-family:'Paperlogy'; font-weight:900; src:url('/assets/font/Paperlogy-9Black.ttf'); }

@font-face { font-family:'KERISKEDU'; font-weight:400; src:url('/assets/font/KERISKEDU_R.ttf'); }
@font-face { font-family:'KERISKEDU'; font-weight:700; src:url('/assets/font/KERISKEDU_B.ttf'); }
@font-face { font-family:'KERISKEDU'; font-weight:300; src:url('/assets/font/KERISKEDU_Line.ttf'); }

@font-face { font-family:'SeoulAlrim'; font-weight:500; src:url('/assets/font/SeoulAlrimTTF-Medium.ttf'); }
@font-face { font-family:'SeoulAlrim'; font-weight:700; src:url('/assets/font/SeoulAlrimTTF-Bold.ttf'); }
@font-face { font-family:'SeoulAlrim'; font-weight:800; src:url('/assets/font/SeoulAlrimTTF-ExtraBold.ttf'); }
@font-face { font-family:'SeoulAlrim'; font-weight:900; src:url('/assets/font/SeoulAlrimTTF-Heavy.ttf'); }
`;

// ── 메인 ──────────────────────────────────────────────────────────────────────
export default function HtmlBuilderPage() {
  const titleRef    = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const paperRef    = useRef<HTMLDivElement>(null);

  const [mounted,     setMounted]    = useState(false);
  const [exportOpen,  setExportOpen] = useState(false);
  const [pageCount,   setPageCount]  = useState(1);
  const [fontFamily,  setFontFamily] = useState(FONTS[0].value);

  useEffect(() => { setMounted(true); }, []);

  // ── TipTap 에디터 ────────────────────────────────────────────────────────────
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: { HTMLAttributes: { class: 'code-block' } } }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Table.configure({ resizable: false }),
      TableRow, TableCell, TableHeader,
    ],
    content: DEFAULT_CONTENT,
    editorProps: {
      attributes: { class: 'tiptap-editor' },
      handlePaste(view, event) {
        const cd = event.clipboardData;
        if (!cd) return false;

        // 이미지 붙여넣기
        const imgItem = Array.from(cd.items).find(it => it.kind === 'file' && it.type.startsWith('image/'));
        if (imgItem) {
          const file = imgItem.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = e => {
              view.dispatch(view.state.tr.replaceSelectionWith(
                view.state.schema.nodes.image.create({ src: e.target?.result as string })
              ));
            };
            reader.readAsDataURL(file);
            return true;
          }
        }

        // Obsidian 순수 MD 텍스트 (text/html 없을 때)
        const html = cd.getData('text/html');
        const text = cd.getData('text/plain');
        if (!html && text && looksLikeMarkdown(text)) {
          const converted = markdownToHtml(text);
          document.execCommand('insertHTML', false, converted);
          return true;
        }

        return false; // 나머지(Notion HTML 등)는 TipTap 기본 처리
      },
    },
    onUpdate({ editor }) {
      // 페이지 수 계산
      const el = document.querySelector('.tiptap-editor') as HTMLElement | null;
      if (el) {
        const totalH = el.offsetHeight + PAD_V * 2;
        setPageCount(Math.max(1, Math.ceil(totalH / A4_H)));
      }
    },
  });

  // ── 이미지 파일 삽입 (파일 다이얼로그) ─────────────────────────────────────
  const insertImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      editor?.chain().focus().setImage({ src: e.target?.result as string }).run();
    };
    reader.readAsDataURL(file);
  }, [editor]);

  // ── 링크 삽입 ───────────────────────────────────────────────────────────────
  const insertLink = useCallback(() => {
    const url = window.prompt('링크 URL을 입력하세요');
    if (!url) return;
    const safe = sanitizeUrl(url);
    if (!safe) return;
    editor?.chain().focus().setLink({ href: safe }).run();
  }, [editor]);

  // ── HTML 내보내기 ────────────────────────────────────────────────────────────
  const exportHtml = () => {
    const title = titleRef.current?.value || '문서';
    const body  = editor?.getHTML() ?? '';
    const selectedFont = fontFamily;
    const html  = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(title)}</title>
  <style>
    ${FONT_FACE_CSS}
    @page { size: A4 portrait; margin: 15mm 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ${selectedFont}; font-size: 11pt; line-height: 1.7; color: #111827; }
    h1 { font-size: 22pt; font-weight: 900; margin: 0 0 14px; }
    h2 { font-size: 16pt; font-weight: 800; margin: 20px 0 10px; }
    h3 { font-size: 13pt; font-weight: 700; margin: 16px 0 8px; }
    p  { margin: 0 0 8px; }
    ul,ol { padding-left: 20px; margin: 0 0 8px; }
    li { margin-bottom: 3px; }
    blockquote { margin: 0 0 8px; padding: 6px 14px; border-left: 4px solid #d1d5db; color: #6b7280; }
    code { background: #f3f4f6; padding: 1px 5px; border-radius: 3px; font-family: monospace; font-size: 10pt; }
    pre  { background: #1e1e2e; color: #cdd6f4; padding: 14px; border-radius: 6px; margin: 0 0 10px; }
    pre code { background: none; padding: 0; color: inherit; }
    table { width: 100%; border-collapse: collapse; margin: 0 0 10px; }
    th,td { border: 1px solid #e5e7eb; padding: 6px 10px; font-size: 10pt; }
    th { background: #f9fafb; font-weight: 700; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
    img { max-width: 100%; border-radius: 6px; display: block; margin: 6px 0; }
    a  { color: #4f46e5; text-decoration: underline; }
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  </style>
</head>
<body>${body}</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.html`;
    a.click();
  };

  const exportPdf = () => window.print();

  // ── 렌더 ────────────────────────────────────────────────────────────────────
  if (!mounted) return <div className="min-h-screen bg-[#d0d0d0]" />;

  return (
    <>
      <style>{`
        /* ── TipTap 에디터 본문 ── */
        .tiptap-editor {
          outline: none;
          font-family: 'Pretendard','Segoe UI',system-ui,sans-serif;
          font-size: 13.5px;
          line-height: 1.75;
          color: #111827;
          min-height: calc(${A4_H}px - ${PAD_V * 2}px);
        }
        .tiptap-editor h1 { font-size: 24px; font-weight: 900; margin: 0 0 14px; line-height: 1.3; }
        .tiptap-editor h2 { font-size: 19px; font-weight: 800; margin: 22px 0 10px; }
        .tiptap-editor h3 { font-size: 15px; font-weight: 700; margin: 18px 0 8px; }
        .tiptap-editor h4 { font-size: 13.5px; font-weight: 700; margin: 14px 0 6px; }
        .tiptap-editor p  { margin: 0 0 8px; }
        .tiptap-editor ul,
        .tiptap-editor ol { padding-left: 22px; margin: 0 0 8px; }
        .tiptap-editor li { margin-bottom: 3px; }
        .tiptap-editor blockquote {
          margin: 0 0 10px; padding: 8px 14px;
          border-left: 4px solid #d1d5db; color: #6b7280;
          background: #f9fafb; border-radius: 0 4px 4px 0;
        }
        .tiptap-editor code {
          background: #f3f4f6; padding: 2px 5px;
          border-radius: 3px; font-family: 'Fira Code',monospace; font-size: 12.5px;
        }
        .tiptap-editor pre {
          background: #1e1e2e; color: #cdd6f4;
          padding: 14px 16px; border-radius: 6px; margin: 0 0 10px; overflow: auto;
        }
        .tiptap-editor pre code { background: none; padding: 0; color: inherit; }
        .tiptap-editor table { width: 100%; border-collapse: collapse; margin: 0 0 10px; }
        .tiptap-editor th,
        .tiptap-editor td { border: 1px solid #e5e7eb; padding: 7px 11px; font-size: 13px; vertical-align: top; }
        .tiptap-editor th { background: #f9fafb; font-weight: 700; }
        .tiptap-editor hr { border: none; border-top: 1.5px solid #e5e7eb; margin: 18px 0; }
        .tiptap-editor img { max-width: 100%; border-radius: 6px; margin: 6px 0; display: block; }
        .tiptap-editor a  { color: #4f46e5; text-decoration: underline; cursor: pointer; }
        .tiptap-editor ::selection { background: #c7d2fe; }
        .tiptap-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #9ca3af; pointer-events: none; float: left; height: 0;
        }

        /* ── 인쇄/PDF ── */
        @media print {
          @page { size: A4 portrait; margin: 15mm 18mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: white !important; margin: 0 !important; }
          .no-print { display: none !important; }
          #page-outer { padding: 0 !important; }
          #paper-wrap { width: 100% !important; min-height: auto !important; box-shadow: none !important; border-radius: 0 !important; }
          #editor-area { padding: 0 !important; }
          .page-sep { display: none !important; }
          .tiptap-editor { font-size: 11pt !important; line-height: 1.65 !important; min-height: 0 !important; }
          .tiptap-editor h1 { font-size: 20pt !important; }
          .tiptap-editor h2 { font-size: 15pt !important; }
          .tiptap-editor h3 { font-size: 12pt !important; }
        }
        ${FONT_FACE_CSS}
      `}</style>

      <div className="min-h-screen bg-[#d0d0d0]">

        {/* ── 앱바 ── */}
        <div className="no-print fixed top-[52px] left-0 right-0 bg-[#2d2d3a] border-b border-white/10 h-11 flex items-center" style={{ zIndex: 200 }}>
          {/* A4 너비 기준 정렬 컨테이너 */}
          <div style={{ width: A4_W, margin: '0 auto', paddingLeft: PAD_H, paddingRight: PAD_H }} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                ref={titleRef}
                defaultValue="새 문서"
                className="bg-transparent text-white text-sm font-black focus:outline-none w-56 placeholder-slate-500"
                placeholder="문서 이름"
              />
              <span className="text-[10px] text-slate-500 border-l border-white/10 pl-3">
                A4 · {pageCount}페이지
              </span>
            </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 hidden lg:block">노션·옵시디언 붙여넣기 지원</span>
            <div className="relative">
              <button
                onClick={() => setExportOpen(p => !p)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all"
              >
                내보내기 <FontAwesomeIcon icon={faChevronDown} className="text-[9px]" />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] bg-[#1c1c2e] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 min-w-[150px]">
                  <button onClick={() => { exportPdf(); setExportOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-black text-slate-300 hover:bg-white/5 hover:text-white transition-all">
                    <FontAwesomeIcon icon={faFilePdf} className="text-red-400" /> PDF로 저장
                  </button>
                  <button onClick={() => { exportHtml(); setExportOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-black text-slate-300 hover:bg-white/5 hover:text-white transition-all">
                    <FontAwesomeIcon icon={faFileCode} className="text-blue-400" /> HTML로 저장
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* ── 리본 툴바 ── */}
        <div className="no-print fixed left-0 right-0 bg-white border-b border-gray-200 flex items-center flex-wrap gap-0.5 px-4 py-1.5 shadow-sm" style={{ top: '96px', zIndex: 199 }}>
          <ToolBtn icon={faUndo} label="실행취소 (Ctrl+Z)" onClick={() => editor?.chain().focus().undo().run()} />
          <ToolBtn icon={faRedo} label="다시실행 (Ctrl+Y)" onClick={() => editor?.chain().focus().redo().run()} />
          <Divider />

          {/* 폰트 선택 */}
          <select
            value={fontFamily}
            onChange={e => setFontFamily(e.target.value)}
            className="h-7 rounded border border-gray-300 bg-white text-xs text-gray-700 px-1 focus:outline-none"
            style={{ fontFamily, minWidth: 110 }}
          >
            {FONTS.map(f => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </option>
            ))}
          </select>
          <Divider />

          <ToolBtn icon={faBold}          label="굵게 (Ctrl+B)"   active={editor?.isActive('bold')}         onClick={() => editor?.chain().focus().toggleBold().run()} />
          <ToolBtn icon={faItalic}        label="기울임 (Ctrl+I)" active={editor?.isActive('italic')}       onClick={() => editor?.chain().focus().toggleItalic().run()} />
          <ToolBtn icon={faCode}          label="인라인 코드"      active={editor?.isActive('code')}         onClick={() => editor?.chain().focus().toggleCode().run()} />
          <ToolBtn icon={faStrikethrough} label="취소선"           active={editor?.isActive('strike')}       onClick={() => editor?.chain().focus().toggleStrike().run()} />
          <ToolBtn icon={faQuoteLeft}     label="인용"             active={editor?.isActive('blockquote')}   onClick={() => editor?.chain().focus().toggleBlockquote().run()} />
          <ToolBtn icon={faLink}          label="링크"             active={editor?.isActive('link')}         onClick={insertLink} />
          <Divider />

          <ToolBtn icon={faListUl} label="글머리 기호" active={editor?.isActive('bulletList')}  onClick={() => editor?.chain().focus().toggleBulletList().run()} />
          <ToolBtn icon={faListOl} label="번호 목록"   active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()} />
          <Divider />

          <ToolBtn icon={faTable} label="표 삽입 (3×3)" onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
          <ToolBtn icon={faImage} label="이미지 삽입" onClick={() => imgInputRef.current?.click()} />
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { if (e.target.files?.[0]) insertImageFile(e.target.files[0]); e.target.value = ''; }} />
          <ToolBtn icon={faMinus} label="구분선" onClick={() => editor?.chain().focus().setHorizontalRule().run()} />
        </div>

        {/* ── 페이지 영역 ── */}
        <div id="page-outer" className="pt-[148px] pb-32 flex flex-col items-center">
          <div
            ref={paperRef}
            id="paper-wrap"
            className="relative bg-white"
            style={{
              width: A4_W,
              minHeight: pageCount * A4_H,
              boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
              borderRadius: 2,
              isolation: 'isolate',
            }}
          >
            {/* 에디터 */}
            <div id="editor-area" style={{ padding: `${PAD_V}px ${PAD_H}px`, fontFamily }}>
              <EditorContent editor={editor} />
            </div>

            {/* 페이지 구분선 */}
            {Array.from({ length: pageCount - 1 }, (_, i) => (
              <div
                key={i}
                className="page-sep"
                style={{ position: 'absolute', top: (i + 1) * A4_H, left: 0, right: 0, pointerEvents: 'none', zIndex: 20 }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: '#cbd5e1' }} />
                <div style={{
                  position: 'absolute', top: -11, right: PAD_H,
                  background: '#94a3b8', color: '#fff',
                  fontSize: 10, fontWeight: 700, padding: '1px 8px',
                  borderRadius: 10, letterSpacing: '0.05em',
                }}>
                  {i + 2}p
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
