'use client';

import React from 'react';

interface WaveDividerProps {
  mode?: 'normal' | 'inverted';
  speedMultiplier?: number;
  height?: string;
  opacity?: string;
}

export default function WaveDivider({ 
  mode = 'normal', 
  speedMultiplier = 1, 
  height = 'h-[40px] md:h-[80px]',
  opacity = 'opacity-100'
}: WaveDividerProps) {
  const containerClasses = mode === 'inverted' 
    ? `absolute top-0 left-0 w-full overflow-hidden line-height-0 rotate-180 ${opacity}`
    : `absolute bottom-0 left-0 w-full overflow-hidden line-height-0 transform translate-y-[1px] ${opacity}`;

  return (
    <div className={containerClasses}>
      <svg
        className={`relative block w-[calc(100%+1.3px)] ${height}`}
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
        shapeRendering="auto"
      >
        <defs>
          <path
            id="gentle-wave"
            d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
          />
        </defs>
        <g className="parallax">
          {/* Static Background Waves */}
          <use href="#gentle-wave" x="48" y="0" className="fill-white/5" />
          <use href="#gentle-wave" x="48" y="3" className="fill-white/10" />
          
          {/* Main Animated Wave (The one that moves prominently) */}
          <use
            href="#gentle-wave"
            x="48"
            y="5"
            className="fill-white/20"
            style={{ animation: `wave ${10 * speedMultiplier}s linear infinite` }}
          />
          
          {/* Top Foreground Wave */}
          <use
            href="#gentle-wave"
            x="48"
            y="7"
            className="fill-white"
            style={{ animation: `wave ${7 * speedMultiplier}s linear infinite`, animationDelay: '-2s' }}
          />
        </g>
      </svg>
    </div>
  );
}
