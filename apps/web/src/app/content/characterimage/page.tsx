'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart as faHeartSolid,
  faDownload,
  faCheckCircle,
  faUserAstronaut,
  faMicrophone,
  faFilter,
  faChevronLeft,
  faChevronRight,
  faXmark,
  faCloudUploadAlt,
  faSpinner,
  faTrash,
  faCrown,
  faUser,
  faMagic,
  faTag,
} from '@fortawesome/free-solid-svg-icons';
import { Heart } from 'lucide-react';

// ── 업로드 캐릭터 타입 ─────────────────────────────────────────────────────────
interface UploadedChar {
  id: string; name: string; tags: string[];
  url: string; width: number; height: number;
  liked: boolean; createdAt: string;
}

type RealCharacter = {
  id: string;
  image: string;
  zipFile?: string;
  bodyGrid?: string;
  faceGrid?: string;
};

type RealCharacterCatalog = {
  generatedAt: string;
  total: number;
  items: RealCharacter[];
};

type CharacterItem = {
  id: string;
  name: string;
  style: string;
  tag?: string;
  image: string;
  faceGrid?: string;
  bodyGrid?: string;
  zipFile?: string;
};

// Import Character Data from JSON
import characterData from '@/data/content_characterimage.json';

const ITEMS_PER_PAGE = 24;

// Character styles and list from external JSON
const CHARACTER_STYLES = characterData.styles as Array<{ id: string; label: string }>;
const BASE_CHARACTERS = characterData.characters as Array<{
  id: string;
  name: string;
  style: string;
  tag?: string;
  image?: string;
  faceGrid?: string;
  bodyGrid?: string;
  zipFile?: string;
}>;

const SVG_ANIMATION_IDS = new Set(['c10', 'c11', 'c12']);

export default function CharacterImagePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds]       = useState<string[]>([]);
  const [activeStyle, setActiveStyle] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalCharacter, setModalCharacter] = useState<any | null>(null);
  const [realCharacters, setRealCharacters] = useState<RealCharacter[]>([]);

  // ── 업로드 상태 ──────────────────────────────────────────────────────────────
  const [uploadedChars, setUploadedChars] = useState<UploadedChar[]>([]);
  const [uploading, setUploading]         = useState(false);
  const [uploadErr, setUploadErr]         = useState<string | null>(null);
  const [dragOver, setDragOver]           = useState(false);
  const [uploadName, setUploadName]       = useState('');
  const [uploadTags, setUploadTags]       = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/content/character-catalog')
      .then(async (res) => {
        const j: RealCharacterCatalog = await res.json();
        if (!res.ok) throw new Error('캐릭터 카탈로그 로드 실패');
        setRealCharacters(Array.isArray(j?.items) ? j.items : []);
      })
      .catch(() => setRealCharacters([]));
  }, []);

  const mergedCharacters: CharacterItem[] = useMemo(() => {
    const metaById = new Map(BASE_CHARACTERS.map((c) => [c.id, c]));
    return realCharacters.map((r) => {
      const meta = metaById.get(r.id);
      return {
        id: r.id,
        name: meta?.name ?? r.id,
        style: meta?.style ?? 'all',
        tag: meta?.tag,
        image: r.image,
        faceGrid: r.faceGrid,
        bodyGrid: r.bodyGrid,
        zipFile: r.zipFile,
      };
    });
  }, [realCharacters]);

  const availableStyles = useMemo(() => {
    const set = new Set(mergedCharacters.map((c) => c.style));
    return CHARACTER_STYLES.filter((s) => s.id === 'all' || set.has(s.id));
  }, [mergedCharacters]);

  // 좋아요한 업로드 캐릭터 (마이페이지 저장용)
  const likedUploaded = uploadedChars.filter(c => c.liked);
  const totalLiked    = likedIds.length + likedUploaded.length;

  const filteredCharacters = useMemo(() => {
    if (activeStyle === 'all') return mergedCharacters;
    return mergedCharacters.filter(char => char.style === activeStyle);
  }, [activeStyle, mergedCharacters]);

  const totalPages = Math.ceil(filteredCharacters.length / ITEMS_PER_PAGE);
  
  const paginatedCharacters = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCharacters.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCharacters, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeStyle]);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      if (selectedIds.length < 2) {
        setSelectedIds([...selectedIds, id]);
      } else {
        alert('최대 2명의 페르소나까지만 선택 가능합니다.');
      }
    }
  };

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (likedIds.includes(id)) {
      setLikedIds(likedIds.filter(item => item !== id));
    } else {
      if (totalLiked >= 2) { alert('마이페이지 저장은 최대 2개까지 가능합니다.'); return; }
      setLikedIds([...likedIds, id]);
    }
  };

  const toggleUploadLike = (id: string) => {
    setUploadedChars(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (!c.liked && totalLiked >= 2) { alert('마이페이지 저장은 최대 2개까지 가능합니다.'); return c; }
      return { ...c, liked: !c.liked };
    }));
  };

  const deleteUploaded = (id: string) => {
    setUploadedChars(prev => prev.filter(c => c.id !== id));
  };

  // ── 파일 업로드 처리 ─────────────────────────────────────────────────────────
  const processUpload = async (file: File) => {
    setUploading(true);
    setUploadErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', uploadName.trim() || file.name.replace(/\.[^.]+$/, ''));
      fd.append('tags', uploadTags.trim());

      const res  = await fetch('/api/character/remove-bg', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '업로드 실패');

      setUploadedChars(prev => [data, ...prev]);
      setUploadName('');
      setUploadTags('');
    } catch (e: unknown) {
      setUploadErr(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUpload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUpload(file);
  };

  const handleDownload = (character: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (character.zipFile) {
      const link = document.createElement('a');
      link.href = character.zipFile;
      link.download = `${character.id}_assets.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`${character.name} 이미지를 다운로드합니다.`);
    }
  };

  return (
    <div className="bg-[#0f0f1a] min-h-screen text-white pb-24 font-sans antialiased">
      {/* Hero Header */}
      <header 
        className="relative pt-24 pb-32 text-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/img/content/character/characterimage_top_bg.webp')" }}
      >
        {/* Background Overlay for readability */}
        <div className="absolute inset-0 bg-[#0f0f1a]/70"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#6366f1_0%,transparent_70%)]"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[#a78bfa] text-xs font-bold tracking-wider mb-6">
            <FontAwesomeIcon icon={faUserAstronaut} /> AI PERSONA STUDIO
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tighter">
            나만의 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] to-[#6366f1]">AI 페르소나</span>
          </h1>
          <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            작가님의 라이브러리에 저장할 페르소나를 선택하세요.<br />
            선택된 캐릭터는 개인 자산으로 등록되어 추후 모든 컨텐츠 제작 시 주인공으로 활용 가능합니다.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">

        {/* ── 내 캐릭터 업로드 섹션 ── */}
        <section className="mb-12 bg-[#1c1c2e] border border-white/10 rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <FontAwesomeIcon icon={faCloudUploadAlt} className="text-white text-sm" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">내 캐릭터 업로드</h2>
              <p className="text-[10px] text-slate-500">JPG / PNG 업로드 → 배경 자동 제거 → 투명 PNG 저장</p>
            </div>
            {/* 마이페이지 좋아요 현황 */}
            <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-black/30 border border-white/10 rounded-xl">
              <FontAwesomeIcon icon={faHeartSolid} className="text-pink-500 text-xs" />
              <span className="text-xs font-black text-white">{totalLiked} <span className="text-slate-500 font-medium">/ 2</span></span>
              <span className="text-[10px] text-slate-500">마이페이지 저장</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* 드래그앤드롭 업로드 존 */}
            <div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileInput} />
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !uploading && fileRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 h-44 rounded-2xl border-2 border-dashed cursor-pointer transition-all
                  ${dragOver ? 'border-amber-400 bg-amber-500/10' : 'border-slate-700 hover:border-slate-500 bg-black/20'}`}
              >
                {uploading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="text-3xl text-amber-400 animate-spin" />
                    <p className="text-sm font-black text-amber-300">배경 제거 중...</p>
                    <p className="text-[10px] text-slate-500">rembg 처리 중입니다. 잠시 기다려 주세요.</p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <FontAwesomeIcon icon={faCloudUploadAlt} className="text-2xl text-slate-400" />
                    </div>
                    <p className="text-sm font-black text-white">클릭 또는 파일을 여기로 드래그</p>
                    <p className="text-[10px] text-slate-500">JPG · PNG · WEBP · 최대 10MB · 배경 자동 제거</p>
                  </>
                )}
              </div>
              {uploadErr && (
                <p className="mt-2 text-xs text-red-400 font-bold flex items-center gap-1">
                  <FontAwesomeIcon icon={faXmark} /> {uploadErr}
                </p>
              )}
            </div>

            {/* 이름 · 태그 입력 */}
            <div className="flex flex-col gap-3 justify-center">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                  <FontAwesomeIcon icon={faUser} /> 캐릭터 이름
                </label>
                <input
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  placeholder="예: 할머니 캐릭터, 건강박사..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                  <FontAwesomeIcon icon={faTag} /> 태그 (쉼표 구분)
                </label>
                <input
                  value={uploadTags}
                  onChange={e => setUploadTags(e.target.value)}
                  placeholder="예: 시니어, 여성, 따뜻함"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-all"
                />
              </div>
              <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-[10px] text-slate-500 leading-relaxed">
                <p className="font-black text-slate-400 mb-1">✅ 최적 업로드 조건</p>
                <p>• 정면 촬영 / 단색 또는 단순 배경</p>
                <p>• 전신 또는 상반신 컷 권장</p>
                <p>• 1024px 이상 고해상도</p>
              </div>
            </div>
          </div>

          {/* 업로드된 캐릭터 목록 */}
          {uploadedChars.length > 0 && (
            <div className="mt-6 border-t border-white/5 pt-5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faMagic} className="text-amber-400" />
                내가 업로드한 캐릭터 ({uploadedChars.length}개)
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {uploadedChars.map(ch => (
                  <div key={ch.id} className="group relative">
                    <div className={`relative rounded-2xl overflow-hidden border-2 aspect-[3/4] transition-all
                      ${ch.liked ? 'border-pink-500/60 shadow-lg shadow-pink-500/10' : 'border-white/10 hover:border-white/25'}`}>
                      {/* 투명 PNG 체커보드 배경 */}
                      <div className="absolute inset-0"
                        style={{ backgroundImage: 'linear-gradient(45deg,#1a1a2e 25%,transparent 25%),linear-gradient(-45deg,#1a1a2e 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1a1a2e 75%),linear-gradient(-45deg,transparent 75%,#1a1a2e 75%)', backgroundSize: '8px 8px', backgroundPosition: '0 0,0 4px,4px -4px,-4px 0' }} />
                      <img src={ch.url} alt={ch.name} className="relative z-10 w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-20" />

                      {/* 좋아요 배지 */}
                      {ch.liked && (
                        <div className="absolute top-1.5 left-1.5 z-30 flex items-center gap-1 px-1.5 py-0.5 bg-pink-600 rounded-full">
                          <FontAwesomeIcon icon={faCrown} className="text-white text-[7px]" />
                          <span className="text-[7px] font-black text-white">MY</span>
                        </div>
                      )}

                      {/* 액션 버튼 */}
                      <div className="absolute top-1.5 right-1.5 z-30 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => toggleUploadLike(ch.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] transition-all
                            ${ch.liked ? 'bg-pink-600 text-white' : 'bg-black/50 text-white hover:bg-pink-600'}`}>
                          <FontAwesomeIcon icon={faHeartSolid} />
                        </button>
                        <button onClick={() => deleteUploaded(ch.id)}
                          className="w-6 h-6 rounded-full bg-black/50 text-slate-400 hover:bg-red-600 hover:text-white flex items-center justify-center text-[9px] transition-all">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>

                      <div className="absolute bottom-1.5 left-0 right-0 z-30 px-1.5">
                        <p className="text-[9px] font-black text-white truncate">{ch.name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Style Filter Chips */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10 text-slate-500 mr-1">
              <FontAwesomeIcon icon={faFilter} className="text-[10px]" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Style Filter</span>
            </div>
            {availableStyles.map(style => (
              <button
                key={style.id}
                onClick={() => setActiveStyle(style.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                  activeStyle === style.id 
                  ? 'bg-[#a78bfa] border-[#a78bfa] text-white shadow-lg shadow-indigo-500/20' 
                  : 'bg-[#1c1c2e] border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {paginatedCharacters.map(char => {
            const isSelected = selectedIds.includes(char.id);
            const isLiked = likedIds.includes(char.id);

            return (
              <div 
                key={char.id}
                onClick={() => setModalCharacter(char)}
                className={`group relative bg-[#1c1c2e] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${isSelected ? 'border-[#a78bfa] ring-4 ring-[#a78bfa]/10' : 'border-white/5 hover:border-white/20'}`}
              >
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img src={char.image} alt={char.name} className={`w-full h-full object-cover transition-transform duration-700 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-70"></div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className={`text-[13px] font-black truncate transition-colors ${isSelected ? 'text-[#a78bfa]' : 'text-white'}`}>
                      {char.name}
                    </h3>
                  </div>

                  <div className="absolute top-3 left-3 scale-75 origin-top-left flex items-center gap-1">
                    <span className="px-2 py-0.5 bg-[#6366f1] border border-white/10 rounded-full text-[9px] font-black text-white uppercase tracking-widest">
                      {char.style}
                    </span>
                    {SVG_ANIMATION_IDS.has(char.id) && (
                      <span className="px-2 py-0.5 bg-[#a78bfa]/20 border border-[#a78bfa]/30 rounded-full text-[9px] font-black text-[#c4b5fd] uppercase tracking-widest">
                        SVG
                      </span>
                    )}
                  </div>

                  {/* Actions (Top Right) */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button onClick={(e) => toggleLike(char.id, e)} className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all text-xs ${isLiked ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-red-500'}`}>
                      {isLiked ? <FontAwesomeIcon icon={faHeartSolid} /> : <Heart size={14} />}
                    </button>
                    <button onClick={(e) => handleDownload(char, e)} className="w-8 h-8 rounded-full bg-black/40 text-white hover:bg-[#6366f1] backdrop-blur-md transition-all text-xs">
                      <FontAwesomeIcon icon={faDownload} />
                    </button>
                  </div>

                  {/* Checkbox for quick selection */}
                  <div 
                    onClick={(e) => { e.stopPropagation(); toggleSelection(char.id); }}
                    className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all z-30 ${isSelected ? 'bg-[#a78bfa] border-[#a78bfa] text-white shadow-lg' : 'bg-black/40 border-white/30 text-white hover:border-white'}`}
                  >
                    {isSelected ? <FontAwesomeIcon icon={faCheckCircle} /> : <div className="w-4 h-4" />}
                  </div>

                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-[#a78bfa] rounded-full flex items-center justify-center font-black text-white text-[10px] shadow-lg ring-2 ring-[#1c1c2e] z-10">
                      {selectedIds.indexOf(char.id) + 1}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Simple Character Image Modal */}
        {modalCharacter && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10 bg-black/90 backdrop-blur-md" onClick={() => setModalCharacter(null)}>
            <div className="relative max-w-[80vw] max-h-[90vh] flex items-center justify-center group" onClick={e => e.stopPropagation()}>
              {/* Close Button - Positioned at top-right of the image area */}
              <button 
                onClick={() => setModalCharacter(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center z-50 transition-all border border-white/20 backdrop-blur-md shadow-xl"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xl" />
              </button>

              {/* Large Image */}
              <img 
                src={modalCharacter.image} 
                alt={modalCharacter.name} 
                className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
              />
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-full bg-[#1c1c2e] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-[#a78bfa]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${
                    currentPage === i + 1 
                    ? 'bg-[#a78bfa] text-white shadow-lg shadow-indigo-500/20' 
                    : 'bg-[#1c1c2e] text-slate-500 hover:text-slate-300 border border-white/5'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-full bg-[#1c1c2e] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-[#a78bfa]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        )}
      </main>

      {/* Persona Guide Section */}
      <footer className="max-w-4xl mx-auto px-6 mt-20 text-center space-y-6">
        <div className="bg-[#1c1c2e] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
          <h4 className="text-xl font-bold mb-6 flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faMicrophone} className="text-[#a78bfa]" /> 화자(Narrator) 이미지 최적화 가이드
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-amber-400 font-black text-xs mb-2 tracking-widest uppercase">Rule 01. 정면 구도</div>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">립싱크와 표정 연기를 위해 정면 이미지를 권장합니다. 특히 <b>신카이, 픽사, 버츄얼3D</b> 스타일에서 가장 효과가 좋습니다.</p>
            </div>
            <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-amber-400 font-black text-xs mb-2 tracking-widest uppercase">Rule 02. 스타일 일관성</div>
              <p className="text-slate-400 text-xs leading-relaxed font-medium"><b>Chaotic Ink, 누와르</b> 등 개성이 강한 화풍은 영상의 분위기를 압도하는 독특한 시청 경험을 제공합니다.</p>
            </div>
            <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-amber-400 font-black text-xs mb-2 tracking-widest uppercase">Rule 03. 최적 해상도</div>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">모든 스타일은 1024px 이상의 고해상도를 권장합니다. <b>벡터, 그래픽</b> 스타일은 저해상도에서도 비교적 깨끗하게 변환됩니다.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
