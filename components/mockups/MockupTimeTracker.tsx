'use client';

import { useState, useEffect, useRef } from 'react';

export default function MockupTimeTracker() {
  const [seconds, setSeconds] = useState(5025); // Start at 01:23:45
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      {/* Job info */}
      <div className="text-center mb-1">
        <div className="text-[10px] text-gray-500 uppercase font-medium">Travail en cours</div>
        <div className="text-sm font-semibold text-gray-900 mt-1">Réparation CVC — Tremblay</div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center gap-1.5 mb-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-[10px] font-medium text-green-600">En cours</span>
      </div>

      {/* Timer display */}
      <div className="text-center mb-5">
        <div className="text-4xl font-mono font-bold text-gray-900 tracking-wider">
          {formatted}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg py-2.5 text-xs font-medium hover:bg-amber-100 transition-colors">
          <span>⏸</span> Pause
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg py-2.5 text-xs font-medium hover:bg-red-100 transition-colors">
          <span>⏹</span> Terminer
        </button>
      </div>
    </div>
  );
}
