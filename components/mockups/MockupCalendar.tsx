'use client';

import { useState, useEffect } from 'react';
import BrowserFrame from './BrowserFrame';

const days = ['Lun 14', 'Mar 15', 'Mer 16', 'Jeu 17', 'Ven 18'];
const hours = ['7h', '8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h'];

interface Job {
  day: number;
  startSlot: number;
  duration: number;
  client: string;
  service: string;
  employee: string;
  color: string;
  dotColor: string;
  pulsing?: boolean;
}

const jobs: Job[] = [
  { day: 0, startSlot: 1, duration: 2, client: 'Tremblay', service: 'Déneigement', employee: 'Jean Roy', color: 'bg-blue-50 border-blue-200', dotColor: 'bg-blue-500' },
  { day: 0, startSlot: 5, duration: 1, client: 'Côté', service: 'Nettoyage', employee: 'Marie Lévesque', color: 'bg-green-50 border-green-200', dotColor: 'bg-green-500' },
  { day: 1, startSlot: 2, duration: 2, client: 'Bouchard', service: 'Tonte', employee: 'Tom Beaumont', color: 'bg-purple-50 border-purple-200', dotColor: 'bg-purple-500', pulsing: true },
  { day: 2, startSlot: 4, duration: 2, client: 'Martin', service: 'Déneigement', employee: 'Jean Roy', color: 'bg-blue-50 border-blue-200', dotColor: 'bg-blue-500' },
  { day: 3, startSlot: 1, duration: 3, client: 'Tremblay', service: 'Nettoyage', employee: 'Marie Lévesque', color: 'bg-green-50 border-green-200', dotColor: 'bg-green-500' },
  { day: 4, startSlot: 6, duration: 2, client: 'Côté', service: 'Tonte', employee: 'Tom Beaumont', color: 'bg-purple-50 border-purple-200', dotColor: 'bg-purple-500' },
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

  const todayCol = 0; // Monday is today

  return (
    <BrowserFrame url="app.gestivio.ca/calendrier">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-sm font-semibold text-gray-900">Semaine du 14 avril 2026</span>
            <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">6 interventions</span>
          </div>
          <div className="flex gap-1">
            <button className="text-[10px] px-2 py-1 bg-gray-100 rounded text-gray-600">← Précédente</button>
            <button className="text-[10px] px-2 py-1 bg-indigo-600 rounded text-white">Aujourd&apos;hui</button>
            <button className="text-[10px] px-2 py-1 bg-gray-100 rounded text-gray-600">Suivante →</button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-[3rem_repeat(5,1fr)] border-b border-gray-200">
            <div className="p-1 bg-gray-50" />
            {days.map((day, i) => (
              <div
                key={day}
                className={`p-2 text-center border-l border-gray-200 ${
                  i === todayCol ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                <span className={`text-[10px] font-semibold ${i === todayCol ? 'text-indigo-600' : 'text-gray-700'}`}>{day}</span>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="relative grid grid-cols-[3rem_repeat(5,1fr)]">
            {/* Time labels */}
            <div className="flex flex-col">
              {hours.map((h) => (
                <div key={h} className="h-6 flex items-start justify-end pr-2 border-b border-gray-50">
                  <span className="text-[8px] text-gray-400 -mt-1">{h}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((_, dayIdx) => (
              <div key={dayIdx} className={`relative border-l border-gray-100 ${dayIdx === todayCol ? 'bg-blue-50/30' : ''}`}>
                {hours.map((_, hIdx) => (
                  <div key={hIdx} className="h-6 border-b border-gray-50" />
                ))}

                {/* Job blocks for this day */}
                {jobs
                  .filter((j) => j.day === dayIdx)
                  .map((job, jIdx) => {
                    const globalIdx = jobs.indexOf(job);
                    return (
                      <div
                        key={jIdx}
                        className={`absolute left-1 right-1 rounded border px-1.5 py-1 transition-all duration-500 ${job.color} ${
                          globalIdx < visibleCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                        }`}
                        style={{
                          top: `${job.startSlot * 24}px`,
                          height: `${job.duration * 24 - 2}px`,
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${job.dotColor} ${job.pulsing ? 'animate-pulse' : ''}`} />
                          <span className="text-[8px] font-semibold text-gray-800 truncate">{job.client}</span>
                        </div>
                        <span className="text-[7px] text-gray-600 truncate block">{job.service}</span>
                        {job.pulsing && (
                          <span className="text-[7px] text-green-600 font-medium animate-pulse">En cours</span>
                        )}
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[9px] text-gray-600">Jean Roy</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[9px] text-gray-600">Marie Lévesque</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-[9px] text-gray-600">Tom Beaumont</span>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
