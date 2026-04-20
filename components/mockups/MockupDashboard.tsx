'use client';

import { useState, useEffect, useRef } from 'react';

function useCountUp(target: number, duration: number = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

const todayJobs = [
  { time: '8:00', label: 'Tremblay — Plomberie', status: 'Complété', statusColor: 'text-green-600 bg-green-50' },
  { time: '10:30', label: 'Bouchard — CVC', status: 'En cours', statusColor: 'text-indigo-600 bg-indigo-50' },
  { time: '14:00', label: 'Martin — Nettoyage', status: 'À venir', statusColor: 'text-gray-500 bg-gray-100' },
];

const recentActivity = [
  { text: 'Facture FAC-0041 payée', time: 'Il y a 2h', icon: '💰' },
  { text: 'Nouveau client: Sophie Gagnon', time: 'Il y a 4h', icon: '👤' },
];

export default function MockupDashboard() {
  const revenue = useCountUp(4320, 1500);
  const interventions = useCountUp(12, 1000);

  return (
    <div className="p-4 space-y-4">
      {/* Greeting */}
      <div>
        <div className="text-sm font-semibold text-gray-900">Bonjour, Antoine 👋</div>
        <div className="text-[10px] text-gray-500">Lundi 20 avril</div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-indigo-50 rounded-lg p-2.5">
          <div className="text-[9px] text-indigo-600 font-medium uppercase">Ce mois</div>
          <div className="text-lg font-bold text-indigo-700">{revenue.toLocaleString('fr-CA')}$</div>
        </div>
        <div className="bg-green-50 rounded-lg p-2.5">
          <div className="text-[9px] text-green-600 font-medium uppercase">Interventions</div>
          <div className="text-lg font-bold text-green-700">{interventions}</div>
        </div>
      </div>

      {/* Today's jobs */}
      <div>
        <div className="text-xs font-semibold text-gray-900 mb-2">{"Aujourd'hui"}</div>
        <div className="space-y-1.5">
          {todayJobs.map((job, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-8">{job.time}</span>
                <span className="text-[11px] text-gray-800 font-medium">{job.label}</span>
              </div>
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${job.statusColor}`}>
                {job.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div className="text-xs font-semibold text-gray-900 mb-2">Activité récente</div>
        <div className="space-y-1.5">
          {recentActivity.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 px-1">
              <span className="text-sm">{item.icon}</span>
              <div className="flex-1">
                <div className="text-[10px] text-gray-800">{item.text}</div>
                <div className="text-[9px] text-gray-400">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
