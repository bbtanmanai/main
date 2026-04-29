'use client';
import { memo } from 'react';

export type ImgPromptItem = {
  id: string;
  master_no: string;
  title: string;
  description: string;
  thumb_url: string;
  categories: string[];
  featured: boolean;
};

export type CatLabelMap = Record<string, { label: string; emoji: string }>;

interface Props {
  item: ImgPromptItem;
  catLabels: CatLabelMap;
  onClick: () => void;
}

function ImagePromptCard({ item, catLabels, onClick }: Props) {
  const cat = item.categories[0];
  const catMeta = cat ? catLabels[cat] : undefined;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'block',
        background: '#111111',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.30)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-3px)';
        el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.50)';
        el.style.borderColor = 'rgba(94,231,223,0.30)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.30)';
        el.style.borderColor = 'rgba(255,255,255,0.10)';
      }}
    >
      {/* ── 상단 썸네일 (풀너비 4:3) ── */}
      <div className="img-prompt-card-img" style={{
        width: '100%', aspectRatio: '4/3',
        position: 'relative', overflow: 'hidden',
        background: 'rgba(255,255,255,0.04)',
      }}>
        {item.thumb_url ? (
          <img
            src={item.thumb_url}
            alt={item.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.8rem',
          }}>
            🖼️
          </div>
        )}
        {item.featured && (
          <span style={{
            position: 'absolute', top: 8, left: 8,
            background: 'rgba(248,184,77,0.92)', backdropFilter: 'blur(8px)',
            borderRadius: 6, padding: '2px 8px',
            fontSize: '0.65rem', fontWeight: 700, color: '#78350f',
          }}>
            ★ 추천
          </span>
        )}
      </div>

      {/* ── 하단 텍스트 (LdPromptPreview 카드 구조 동일) ── */}
      <div style={{ padding: '14px 16px' }}>
        {/* 코드 + 카테고리 배지 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          {catMeta && (
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{catMeta.emoji}</span>
          )}
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, color: '#5ee7df',
            background: 'rgba(94,231,223,0.12)',
            border: '1px solid rgba(94,231,223,0.25)',
            padding: '2px 7px', borderRadius: 5, letterSpacing: '0.04em',
          }}>
            #{item.master_no}
          </span>
          {catMeta && (
            <span style={{
              fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap',
            }}>
              {catMeta.label}
            </span>
          )}
        </div>

        {/* 제목 */}
        <p style={{
          margin: 0,
          fontSize: '0.88rem', fontWeight: 600,
          color: 'rgba(255,255,255,0.88)', lineHeight: 1.45,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
        }}>
          {item.title}
        </p>

        {/* 설명 */}
        {item.description && (
          <p style={{
            margin: '6px 0 0',
            fontSize: '0.73rem',
            color: 'rgba(255,255,255,0.38)', lineHeight: 1.5,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical' as const,
          }}>
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(ImagePromptCard);
