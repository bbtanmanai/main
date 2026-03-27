'use client';

import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#05050a] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 mb-6">
        <FontAwesomeIcon icon={faExclamationTriangle} size="2xl" />
      </div>
      <h2 className="text-2xl font-black text-white mb-2">Something went wrong!</h2>
      <p className="text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
        {error.message || "An unexpected error occurred in the script generation pipeline."}
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-xl bg-white text-black font-black text-xs hover:scale-105 transition-all"
        >
          Try again
        </button>
        <Link
          href="/front"
          className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-xs hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Go Home
        </Link>
      </div>
    </div>
  );
}
