'use client';

import { useState, useEffect, useRef } from 'react';

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

interface TeamMember {
  name: string;
  initials: string;
  job: string | null;
  status: string;
  statusColor: string;
  dotColor: string;
  initialSeconds: number | null;
  ticking: boolean;
}

const teamData: TeamMember[] = [
  {
    name: 'Jean Roy',
    initials: 'JR',
    job: 'Tremblay — CVC',
    status: 'En cours',
    statusColor: 'text-green-600 bg-green-50 border-green-200',
    dotColor: 'bg-green-500',
    initialSeconds: 8100, // 2h 15m
    ticking: true,
  },
  {
    name: 'Marie L.',
    initials: 'ML',
    job: 'Bouchard — Nettoyage',
    status: '⏸ En pause',
    statusColor: 'text-amber-600 bg-amber-50 border-amber-200',
    dotColor: 'bg-amber-500',
    initialSeconds: null,
    ticking: false,
  },
  {
    name: 'Tom B.',
    initials: 'TB',
    job: null,
    status: 'Disponible',
    statusColor: 'text-gray-500 bg-gray-50 border-gray-200',
    dotColor: 'bg-gray-400',
    initialSeconds: null,
    ticking: false,
  },
];

export default function MockupTeam() {
  const [jeanSeconds, setJeanSeconds] = useState(8100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setJeanSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-900">Équipe</span>
        <span className="text-[10px] text-gray-500">3 membres</span>
      </div>

      {/* Team rows */}
      <div className="divide-y divide-gray-50">
        {teamData.map((member, idx) => (
          <div key={idx} className="px-4 py-3 flex items-center gap-3">
            {/* Avatar with status dot */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-gray-600">{member.initials}</span>
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${member.dotColor} ${member.ticking ? 'animate-pulse' : ''}`}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900">{member.name}</div>
              {member.job ? (
                <div className="text-[10px] text-gray-500 truncate">{member.job}</div>
              ) : (
                <div className="text-[10px] text-gray-400 italic">Aucun travail assigné</div>
              )}
            </div>

            {/* Timer / Status */}
            <div className="flex items-center gap-2">
              {member.ticking && (
                <span className="text-[10px] font-mono text-gray-600">
                  ⏱ {formatTime(jeanSeconds)}
                </span>
              )}
              <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full border ${member.statusColor}`}>
                {member.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
