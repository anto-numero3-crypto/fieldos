'use client';

import { useState, useEffect } from 'react';

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];

const jobs = [
  { day: 0, top: '2rem', label: 'Tremblay — Plomberie', time: '8:00', color: 'bg-blue-500', bgColor: 'bg-blue-50 border-blue-200' },
  { day: 1, top: '5rem', label: 'Bouchard — CVC', time: '10:30', color: 'bg-green-500', bgColor: 'bg-green-50 border-green-200', pulsing: true, status: 'En cours' },
  { day: 2, top: '8.5rem', label: 'Martin — Nettoyage', time: '13:00', color: 'bg-amber-500', bgColor: 'bg-amber-50 border-amber-200' },
  { day: 3, top: '11rem', label: 'Côté — Réno', time: '15:00', color: 'bg-purple-500', bgColor: 'bg-purple-50 border-purple-200' },
];

export default function MockupCalendar() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleCount(count);
      if (count >= jobs.length) clearInterval(interval);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-900">Semaine du 21 avril</span>
        <span className="text-xs text-gray-500">4 travaux</span>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-5 gap-1">
        {days.map((day) => (
          <div key={day} className="text-center">
            <span className="text-[10px] font-medium text-gray-500 uppercase">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="relative grid grid-cols-5 gap-1 mt-1" style={{ minHeight: '14rem' }}>
        {/* Time grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="border-l border-gray-100 h-full" />
        ))}

        {/* Job cards */}
        {jobs.map((job, idx) => (
          <div
            key={idx}
            className={`absolute transition-all duration-500 ${idx < visibleCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            style={{
              top: job.top,
              left: `calc(${job.day} * 20% + 2px)`,
              width: 'calc(20% - 4px)',
            }}
          >
            <div className={`rounded border p-1.5 ${job.bgColor}`}>
              <div className="flex items-center gap-1 mb-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${job.color} ${job.pulsing ? 'animate-pulse' : ''}`} />
                <span className="text-[8px] text-gray-600">{job.time}</span>
              </div>
              <span className="text-[8px] font-medium text-gray-800 leading-tight block">{job.label}</span>
              {job.status && (
                <span className="text-[7px] text-green-600 font-medium animate-pulse">{job.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
