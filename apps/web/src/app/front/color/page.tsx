'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPalette, faCheck, faChevronUp } from '@fortawesome/free-solid-svg-icons';

const COLORS = {
  families: [
    'red', 'pink', 'purple', 'deep purple', 'indigo', 'blue', 'light blue', 'cyan',
    'teal', 'green', 'light green', 'lime', 'yellow', 'amber', 'orange', 'deep orange',
    'brown', 'grey', 'blue grey'
  ],
  shades: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', 'A100', 'A200', 'A400', 'A700'],
  data: [
    ['#FFEBEE', '#FCE4EC', '#F3E5F5', '#EDE7F6', '#E8EAF6', '#E3F2FD', '#E1F5FE', '#E0F7FA', '#E0F2F1', '#E8F5E9', '#F1F8E9', '#F9FBE7', '#FFFDE7', '#FFF8E1', '#FFF3E0', '#FBE9E7', '#EFEBE9', '#FAFAFA', '#ECEFF1'],
    ['#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9', '#DCEDC8', '#F0F4C3', '#FFF9C4', '#FFECB3', '#FFE0B2', '#FFCCBC', '#D7CCC8', '#F5F5F5', '#CFD8DC'],
    ['#EF9A9A', '#F48FB1', '#CE93D8', '#B39DDB', '#9FA8DA', '#90CAF9', '#81D4FA', '#80DEEA', '#80CBC4', '#A5D6A7', '#C5E1A5', '#E6EE9C', '#FFF59D', '#FFE082', '#FFCC80', '#FFAB91', '#BCAAA4', '#EEEEEE', '#B0BEC5'],
    ['#E57373', '#F06292', '#BA68C8', '#9575CD', '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1', '#4DB6AC', '#81C784', '#AED581', '#DCE775', '#FFF176', '#FFD54F', '#FFB74D', '#FF8A65', '#A1887F', '#E0E0E0', '#90A4AE'],
    ['#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A', '#66BB6A', '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28', '#FFA726', '#FF7043', '#8D6E63', '#BDBDBD', '#78909C'],
    ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'],
    ['#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#C0CA33', '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#757575', '#546E7A'],
    ['#D32F2F', '#C2185B', '#7B1FA2', '#512DA8', '#303F9F', '#1976D2', '#0288D1', '#0097A7', '#00796B', '#388E3C', '#689F38', '#AFB42B', '#F9A825', '#FFA000', '#F57C00', '#E64A19', '#5D4037', '#616161', '#455A64'],
    ['#C62828', '#AD1457', '#6A1B9A', '#4527A0', '#283593', '#1565C0', '#0277BD', '#00838F', '#00695C', '#2E7D32', '#558B2F', '#9E9D24', '#F57F17', '#FF6F00', '#E65100', '#BF360C', '#4E342E', '#424242', '#37474F'],
    ['#B71C1C', '#880E4F', '#4A148C', '#311B92', '#1A237E', '#0D47A1', '#01579B', '#006064', '#004D40', '#1B5E20', '#33691E', '#827717', '#E65100', '#FF6F00', '#E65100', '#BF360C', '#3E2723', '#212121', '#263238'],
    ['#FF8A80', '#FF80AB', '#EA80FC', '#B388FF', '#8C9EFF', '#82B1FF', '#80D8FF', '#84FFFF', '#A7FFEB', '#B9F6CA', '#CCFF90', '#F4FF81', '#FFFF8D', '#FFE57F', '#FFD180', '#FF9E80', null, null, null],
    ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6D00', null, null, null],
    ['#FF1744', '#F50057', '#D500F9', '#651FFF', '#3D5AFE', '#2979FF', '#00B0FF', '#00E5FF', '#1DE9B6', '#00E676', '#76FF03', '#C6FF00', '#FFEA00', '#FFC400', '#FF9100', '#FF3D00', null, null, null],
    ['#D50000', '#C51162', '#AA00FF', '#6200EA', '#304FFE', '#2962FF', '#0091EA', '#00B8D4', '#00BFA5', '#00C853', '#64DD17', '#AEEA00', '#FFD600', '#FFAB00', '#FF6D00', '#DD2C00', null, null, null],
  ]
};

const PALETTES = [
  { name: 'Forest Harmony', tag: 'Nature', colors: ['#6D7E43', '#B9B297', '#484B1A', '#D4BA94'] },
  { name: 'Sunset Warmth', tag: 'Warm', colors: ['#C49A8C', '#C46F4C', '#A3593B', '#8B3A2B'] },
  { name: 'Ocean Breeze', tag: 'Cool', colors: ['#4A7B9D', '#B0C4D8', '#93C5B5', '#5C7A8A'] },
  { name: 'Muted Earth', tag: 'Neutral', colors: ['#A89880', '#7C5C48', '#5C5340', '#6B7280'] },
  { name: 'Dusty Bloom', tag: 'Warm', colors: ['#E8B4A4', '#C4867A', '#9E7B8C', '#6B3A56'] },
  { name: 'Night & Light', tag: 'Bold', colors: ['#1E2A4A', '#2D2D2D', '#4A1942', '#FAEBD7'] },
];

export default function FrontColorPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const copyToClipboard = (hex: string) => {
    if (!hex) return;
    navigator.clipboard.writeText(hex).then(() => {
      setCopiedColor(hex);
      setTimeout(() => setCopiedColor(null), 2000);
    });
  };

  const isDark = (hex: string) => {
    if (!hex) return false;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] pb-20">
      {/* Header */}
      <header 
        className="relative py-24 px-6 text-center overflow-hidden"
        style={{
          backgroundImage: 'url("/img/front/color/color_top_bg.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        {/* Dark Overlay for readability - Adjusted opacity */}
        <div className="absolute inset-0 bg-[#0f0f1a]/50" />
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 to-sky-300 bg-clip-text text-transparent mb-4">
            Material Design Color Chart
          </h1>
          <p className="text-slate-400 text-lg font-medium">색상 셀을 클릭하면 HEX 코드가 클립보드에 복사됩니다.</p>
        </div>
      </header>

      {/* Color Table Container */}
      <div className="w-full overflow-x-auto py-10 px-[5%] lg:px-[10%]">
        <table className="w-full min-w-[1000px] border-separate border-spacing-0 table-fixed rounded-xl overflow-hidden shadow-sm border border-white/10 bg-white/5 backdrop-blur-sm">
          <tbody>
            {COLORS.families.map((family, fi) => (
              <tr key={family} className="h-12">
                {COLORS.shades.map((shade, si) => {
                  const hex = COLORS.data[si][fi];
                  return (
                    <td 
                      key={`${fi}-${si}`}
                      onClick={() => hex && copyToClipboard(hex)}
                      className={`relative text-[10px] font-bold text-center cursor-pointer transition-all hover:scale-110 hover:z-10 hover:shadow-lg hover:rounded-md ${!hex ? 'bg-white/5' : ''}`}
                      style={{ 
                        backgroundColor: hex || 'transparent', 
                        color: hex ? (isDark(hex) ? '#fff' : '#000') : 'transparent' 
                      }}
                      title={`${family} ${shade}: ${hex}`}
                    >
                      {hex}
                      {copiedColor === hex && (
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center text-white text-base">
                          <FontAwesomeIcon icon={faCheck} />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Palette Section */}
      <section className="py-20 px-[5%] lg:px-[10%] bg-[#0f0f1a] border-t border-white/10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white mb-2 flex items-center justify-center gap-3">
            <FontAwesomeIcon icon={faPalette} className="text-indigo-400" />
            컬러 팔레트
          </h2>
          <p className="text-slate-400 font-medium">엄선된 4색 조합 팔레트입니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PALETTES.map((p, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group">
              <div className="flex h-24">
                {p.colors.map(hex => (
                  <div 
                    key={hex}
                    onClick={() => copyToClipboard(hex)}
                    className="flex-1 cursor-pointer hover:flex-[1.5] transition-all relative group/color"
                    style={{ backgroundColor: hex }}
                  >
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover/color:opacity-100 transition-opacity">Copy</span>
                  </div>
                ))}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white">{p.name}</h3>
                  <span className="text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full border border-indigo-500/20">{p.tag}</span>
                </div>
                <div className="space-y-2">
                  {p.colors.map(hex => (
                    <div 
                      key={hex}
                      onClick={() => copyToClipboard(hex)}
                      className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded shadow-inner" style={{ backgroundColor: hex }} />
                        <span className="text-xs font-mono font-bold text-slate-400">{hex}</span>
                      </div>
                      <FontAwesomeIcon icon={faCheck} className={`text-[10px] text-green-500 transition-opacity ${copiedColor === hex ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Toast Notification */}
      {copiedColor && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm z-[100]">
          📋 {copiedColor} 복사됨
        </div>
      )}

      {/* Back to Top */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-10 right-10 w-12 h-12 bg-slate-900 text-indigo-400 rounded-full shadow-lg border border-white/10 flex items-center justify-center transition-all hover:-translate-y-1 hover:bg-indigo-600 hover:text-white z-50 ${showBackToTop ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
      >
        <FontAwesomeIcon icon={faChevronUp} />
      </button>

      <footer className="text-center py-10 text-slate-500 text-sm font-medium border-t border-white/5">
        바이브코더를 위한 프론트 디자인 창고 · LinkDrop
      </footer>
    </div>
  );
}
