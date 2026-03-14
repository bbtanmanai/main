'use client';

import React from 'react';

export default function AnimatedHeroBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Morphing Blob 1 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[80px] animate-morph-slow opacity-60" />
      
      {/* Morphing Blob 2 */}
      <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[45%] bg-purple-600/10 blur-[100px] animate-morph-slow [animation-delay:-5s] opacity-50" />

      {/* Floating SVG Particles/Shapes */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10%" cy="20%" r="2" fill="#6366f1" className="animate-float-slow" />
        <circle cx="85%" cy="15%" r="3" fill="#8b5cf6" className="animate-float-medium [animation-delay:-2s]" />
        <circle cx="45%" cy="80%" r="2.5" fill="#4f46e5" className="animate-float-slow [animation-delay:-7s]" />
        <circle cx="20%" cy="70%" r="1.5" fill="#a78bfa" className="animate-float-medium [animation-delay:-4s]" />
        
        {/* Animated Grid/Lines */}
        <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#6366f1" strokeWidth="0.5" strokeOpacity="0.1" />
        <line x1="0" y1="60%" x2="100%" y2="60%" stroke="#8b5cf6" strokeWidth="0.5" strokeOpacity="0.1" />
        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#6366f1" strokeWidth="0.5" strokeOpacity="0.1" />
        <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#8b5cf6" strokeWidth="0.5" strokeOpacity="0.1" />
      </svg>

      {/* Moving Light Gradient */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05)_0%,transparent_50%)] animate-pulse" />
    </div>
  );
}
