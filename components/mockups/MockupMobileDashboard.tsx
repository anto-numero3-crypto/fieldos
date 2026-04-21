'use client';

import { useState, useEffect, useRef } from 'react';
import PhoneFrame from './PhoneFrame';

function useCountUp(target: number, duration: number = 1200, start: boolean = false) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
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
  }, [target, duration, start]);

  return value;
}

const todayJobs = [
  { time: '8:00', client: 'Tremblay', service: 'D\u00e9neigement', color: 'bg-blue-500', status: 'Compl\u00e9t\u00e9e', statusColor: 'text-green-600 bg-green-50' },
  { time: '10:30', client: 'Bouchard', service: 'Nettoyage', color: 'bg-green-500', status: 'En cours', statusColor: 'text-indigo-600 bg-indigo-50' },
  { time: '14:00', client: 'Martin', service: 'Tonte', color: 'bg-purple-500', status: '\u00c0 venir', statusColor: 'text-gray-500 bg-gray-100' },
];

const recentActivity = [
  { text: 'Facture FAC-0041 payee', time: 'Il y a 2h', icon: '💰' },
  { text: 'Nouveau client: Sophie Cote', time: 'Il y a 4h', icon: '👤' },
];

export default function MockupMobileDashboard() {
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const revenue = useCountUp(4320, 1500, inView);
  const interventions = useCountUp(18, 1000, inView);

  return (
    <PhoneFrame>
      <div ref={containerRef} className="p-4 pt-8 space-y-4">
        {/* Greeting */}
        <div>
          <div className="text-sm font-semibold text-gray-900">Bonjour, Antoine 👋</div>
          <div className="text-[10px] text-gray-500">Lundi 14 avril 2026</div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
            <div className="text-[9px] text-indigo-600 font-medium uppercase">Revenus</div>
            <div className="text-lg font-bold text-indigo-700">{revenue.toLocaleString('fr-CA')} $</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="text-[9px] text-blue-600 font-medium uppercase">Interventions</div>
            <div className="text-lg font-bold text-blue-700">{interventions}</div>
          </div>
        </div>

        {/* Today's jobs */}
        <div>
          <div className="text-xs font-semibold text-gray-900 mb-2">{"Aujourd'hui"}</div>
          <div className="space-y-1.5">
            {todayJobs.map((job, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${job.color}`} />
                  <span className="text-[10px] text-gray-500 w-8">{job.time}</span>
                  <span className="text-[11px] text-gray-800 font-medium">{job.client}</span>
                </div>
                <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${job.statusColor}`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div className="text-xs font-semibold text-gray-900 mb-2">Activite recente</div>
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
    </PhoneFrame>
  );
}
