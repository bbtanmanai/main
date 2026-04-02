'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import keyframeToolsData from '@/data/keyframe_tools.json';

type KeyframeTool = {
  id: string; name: string; nameKo: string; icon: string;
  logoUrl?: string; tier: string; url: string; desc: string;
};
const TOOLS = keyframeToolsData.tools as KeyframeTool[];

export default function ImageBrowserPage() {
  return (
    <Suspense>
      <ImageBrowserInner />
    </Suspense>
  );
}

function ImageBrowserInner() {
  const searchParams = useSearchParams();
  const initScene    = Number(searchParams.get('scene') ?? 0);
  const initToolId   = searchParams.get('tool') ?? TOOLS[0].id;
  const isSplitMode  = searchParams.get('mode') === 'split';

  const [activeTool, setActiveTool] = React.useState<KeyframeTool>(
    () => TOOLS.find(t => t.id === initToolId) ?? TOOLS[0]
  );
  const [scenes, setScenes]         = React.useState<string[]>([]);
  const [prompts, setPrompts]       = React.useState<string[]>([]);
  const [images, setImages]         = React.useState<Record<number, string>>({});
  const [uploaded, setUploaded]     = React.useState<Record<number, boolean>>({});
  const [uploading, setUploading]   = React.useState<Record<number, boolean>>({});
  const [copied, setCopied]         = React.useState<number | null>(null);
  const fileRefs                    = React.useRef<Record<number, HTMLInputElement | null>>({});

  // IndexedDB 헬퍼 (업로드 이미지 영구 보관)
  const IDB_NAME = 'ld_browser_images';
  const IDB_STORE = 'uploads';

  const openIDB = React.useCallback(() => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }, []);

  const saveImageIDB = React.useCallback(async (idx: number, dataUrl: string) => {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(dataUrl, `img_${idx}`);
  }, [openIDB]);

  const loadAllImagesIDB = React.useCallback(async (count: number) => {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const result: Record<number, string> = {};
    await Promise.all(
      Array.from({ length: count }, (_, i) =>
        new Promise<void>(res => {
          const req = store.get(`img_${i}`);
          req.onsuccess = () => { if (req.result) result[i] = req.result; res(); };
          req.onerror = () => res();
        })
      )
    );
    return result;
  }, [openIDB]);

  React.useEffect(() => {
    // API에서 씬 데이터 로드 + IndexedDB에서 이미지 복원
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/browser/session`)
      .then(r => r.json())
      .then(async data => {
        const sceneList = data.scenes || [];
        if (sceneList.length) setScenes(sceneList);
        if (data.prompts?.length) setPrompts(data.prompts);
        // 저장된 이미지 복원
        if (sceneList.length) {
          const saved = await loadAllImagesIDB(sceneList.length);
          if (Object.keys(saved).length > 0) setImages(saved);
        }
      })
      .catch(() => {
        try {
          const raw = sessionStorage.getItem('ld_keyframe_data');
          if (raw) setScenes(JSON.parse(raw).scenes || []);
          const pr = sessionStorage.getItem('ld_keyframe_prompts');
          if (pr) setPrompts(JSON.parse(pr));
        } catch (_) {}
      });
  }, [loadAllImagesIDB]);

  const allDone = scenes.length > 0 && scenes.every((_, i) => images[i]);

  const handleCopy = (idx: number) => {
    const text = prompts[idx] || '';
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFile = async (idx: number, file: File) => {
    // 즉시 미리보기
    const dataUrl = URL.createObjectURL(file);
    setImages(prev => ({ ...prev, [idx]: dataUrl }));
    saveImageIDB(idx, dataUrl);

    // 백엔드 업로드 (상태 추적)
    setUploading(prev => ({ ...prev, [idx]: true }));
    setUploaded(prev => ({ ...prev, [idx]: false }));

    const formData = new FormData();
    formData.append('scene_idx', String(idx));
    formData.append('file', file, `scene_${idx}.png`);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/browser/upload-image`, {
        method: 'POST', body: formData,
      });
      if (res.ok) {
        setUploaded(prev => ({ ...prev, [idx]: true }));
      }
    } catch (_) {}
    setUploading(prev => ({ ...prev, [idx]: false }));
  };

  const handleDrop = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFile(idx, file);
  };

  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!allDone || submitting) return;
    setSubmitting(true);

    try {
      // 업로드 안 된 이미지 재시도
      for (const [idx, _] of Object.entries(images)) {
        if (!uploaded[Number(idx)]) {
          const imgRes = await fetch(images[Number(idx)]);
          const blob = await imgRes.blob();
          const formData = new FormData();
          formData.append('scene_idx', idx);
          formData.append('file', blob, `scene_${idx}.png`);
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/browser/upload-image`, {
            method: 'POST', body: formData,
          });
          if (!res.ok) throw new Error(`씬 ${Number(idx) + 1} 업로드 실패`);
        }
      }

      // 완료 신호 + 검증
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/browser/submit-images`, { method: 'POST' });
      const data = await res.json();

      if (!data.success || data.count < scenes.length) {
        throw new Error(`이미지 ${data.count}/${scenes.length}개만 저장됨. 누락된 씬을 다시 업로드하세요.`);
      }

      // 성공 — 안내 후 닫기
      alert(`✓ ${scenes.length}개 씬 이미지가 키프레임 페이지로 전달되었습니다.\n\n키프레임 페이지에서 영상 제작을 시작하세요.`);

      // 캐시 정리
      try { const delDb = await openIDB(); const tx = delDb.transaction(IDB_STORE, 'readwrite'); tx.objectStore(IDB_STORE).clear(); } catch (_) {}

      // 링크브라우저 닫기
      if (isSplitMode) {
        try { (window.parent as any).pywebview.api.close_browser(); } catch (_) { window.close(); }
      } else {
        window.close();
      }

    } catch (e: any) {
      alert(`⚠ 전달 실패\n\n${e.message || '서버 연결을 확인하세요.'}\n\n링크브라우저를 닫지 않습니다. 다시 시도해 주세요.`);
    } finally {
      setSubmitting(false);
    }
  };

  const cleanScene = (s: string) => s.replace(/\[씬\s*\d+\]/gi, '').trim();
  const doneCount = Object.keys(images).length;

  return (
    <div className="h-screen flex flex-col select-none overflow-hidden"
      style={{ fontFamily: "'GmarketSans', 'Pretendard', sans-serif", background: '#ffffff', color: '#1e293b' }}>

      {/* ── 진행률 ── */}
      <div className="shrink-0 px-4 py-2 bg-slate-50/80">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-slate-500 font-black">이미지 {doneCount}/{scenes.length}</span>
          {allDone && <span className="text-emerald-600 font-black">전체 완료 ✓</span>}
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full transition-all duration-500"
            style={{ width: scenes.length ? `${(doneCount / scenes.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* ── 씬 목록 ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {scenes.map((scene, idx) => (
          <div
            key={idx}
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(idx, e)}
            className={`rounded-xl border transition-all ${
              images[idx]
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            {/* 씬 헤더: 번호 + 텍스트 */}
            <div className="flex items-start gap-2 px-3 pt-3 pb-1">
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 ${
                images[idx] ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>{idx + 1}</span>
              <p className="flex-1 text-[12px] text-slate-700 leading-relaxed line-clamp-3">
                {cleanScene(scene).slice(0, 100)}
              </p>
            </div>

            {/* 프롬프트 복사 + 이미지 추가 */}
            <div className="flex items-center gap-2 px-3 pb-3 pt-1">
              <button
                onClick={() => handleCopy(idx)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-black border transition-all ${
                  copied === idx
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                {copied === idx ? '✓ 복사됨' : '프롬프트 복사'}
              </button>

              {/* 이미지 썸네일 또는 추가 버튼 */}
              {images[idx] ? (
                <div className="relative group shrink-0 ml-auto flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-emerald-300">
                    <img src={images[idx]} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => fileRefs.current[idx]?.click()}
                        className="text-[9px] text-white font-black bg-black/30 px-1.5 py-0.5 rounded"
                      >교체</button>
                    </div>
                  </div>
                  {/* 업로드 상태 */}
                  {uploading[idx] ? (
                    <span className="text-[10px] text-indigo-500 font-black animate-pulse">저장중...</span>
                  ) : uploaded[idx] ? (
                    <span className="text-[10px] text-emerald-600 font-black">✓ 저장됨</span>
                  ) : null}
                </div>
              ) : (
                <button
                  onClick={() => fileRefs.current[idx]?.click()}
                  className="ml-auto shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 transition-all text-[11px] font-black"
                >
                  ＋ 이미지 추가
                </button>
              )}

              <input
                ref={el => { fileRefs.current[idx] = el; }}
                type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(idx, f); e.target.value = ''; }}
              />
            </div>
          </div>
        ))}

        {scenes.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-16">
            <p className="text-3xl mb-3">📝</p>
            <p className="font-black text-slate-600">씬 데이터가 없습니다</p>
            <p className="text-xs mt-1">키프레임 페이지에서 대본을 먼저 불러오세요</p>
          </div>
        )}
      </div>

      {/* ── 하단: 영상제작 버튼 ── */}
      <div className="shrink-0 px-3 py-3 bg-slate-50 border-t border-slate-200">
        <button
          onClick={handleSubmit}
          disabled={!allDone || submitting}
          className={`w-full py-4 rounded-2xl font-black text-base transition-all ${
            submitting
              ? 'bg-indigo-400 text-white cursor-wait'
              : allDone
                ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white hover:brightness-110 active:scale-[.98] shadow-lg shadow-indigo-500/30'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
          }`}
        >
          {submitting ? '전달 중...' : allDone ? `영상제작 → (${scenes.length}씬)` : `이미지 ${scenes.length - doneCount}개 남음`}
        </button>
      </div>

    </div>
  );
}

