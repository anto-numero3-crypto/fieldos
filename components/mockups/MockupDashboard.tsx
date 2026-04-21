'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import BrowserFrame from './BrowserFrame';

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

const navItems = [
  { icon: '◻', label: 'Tableau de bord', active: true },
  { icon: '📅', label: 'Calendrier', active: false },
  { icon: '👥', label: 'Clients', active: false },
  { icon: '🔧', label: 'Interventions', active: false },
  { icon: '📄', label: 'Factures', active: false },
  { icon: '📊', label: 'Rapports', active: false },
];

const chartPoints = [1800, 2400, 3100, 2800, 3600, 4320];

const todayJobs = [
  { time: '8:00', client: 'Tremblay', service: 'Déneigement', employee: 'Jean Roy', color: 'bg-blue-500', status: 'Compl\u00e9t\u00e9e', statusColor: 'text-green-600 bg-green-50' },
  { time: '10:30', client: 'Bouchard', service: 'Nettoyage', employee: 'Marie Lévesque', color: 'bg-green-500', status: 'En cours', statusColor: 'text-indigo-600 bg-indigo-50' },
  { time: '14:00', client: 'Martin', service: 'Tonte', employee: 'Tom Beaumont', color: 'bg-purple-500', status: 'À venir', statusColor: 'text-gray-500 bg-gray-100' },
];

const recentActivity = [
  { text: 'Facture FAC-0041 payée par Jean Tremblay', time: 'Il y a 2h', icon: '💰' },
  { text: 'Nouveau client: Sophie Côté ajoutée', time: 'Il y a 4h', icon: '👤' },
  { text: 'Intervention #127 complétée — Déneigement', time: 'Il y a 6h', icon: '✓' },
];

export default function MockupDashboard() {
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
  const clients = useCountUp(47, 1200, inView);
  const factures = useCountUp(890, 1100, inView);

  const svgPath = useCallback(() => {
    const max = Math.max(...chartPoints);
    const points = chartPoints.map((v, i) => ({
      x: (i / (chartPoints.length - 1)) * 200,
      y: 50 - (v / max) * 45,
    }));
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, []);

  return (
    <BrowserFrame url="app.gestivio.ca/dashboard">
      <div ref={containerRef} className="flex min-h-[420px]">
        {/* Sidebar */}
        <aside className="w-44 bg-gray-50 border-r border-gray-200 p-3 flex flex-col gap-1">
          <div className="text-xs font-bold text-indigo-600 mb-3 px-2">Gestivio</div>
          {navItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] font-medium cursor-default ${
                item.active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-xs">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 space-y-4 overflow-hidden">
          {/* Greeting */}
          <div>
            <div className="text-sm font-semibold text-gray-900">Bonjour, Antoine 👋</div>
            <div className="text-[10px] text-gray-500">Lundi 14 avril 2026</div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-indigo-50 rounded-lg p-2.5 border border-indigo-100">
              <div className="text-[9px] text-indigo-600 font-medium uppercase">Revenus</div>
              <div className="text-base font-bold text-indigo-700">{revenue.toLocaleString('fr-CA')} $</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
              <div className="text-[9px] text-blue-600 font-medium uppercase">Interventions</div>
              <div className="text-base font-bold text-blue-700">{interventions}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2.5 border border-green-100">
              <div className="text-[9px] text-green-600 font-medium uppercase">Clients</div>
              <div className="text-base font-bold text-green-700">{clients}</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-100">
              <div className="text-[9px] text-amber-600 font-medium uppercase">Factures</div>
              <div className="text-base font-bold text-amber-700">{factures} $</div>
            </div>
          </div>

          {/* Line chart */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="text-[10px] font-medium text-gray-600 mb-2">Revenus — 6 dernières semaines</div>
            <svg viewBox="0 0 200 55" className="w-full h-12">
              <path d={svgPath()} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
              {chartPoints.map((v, i) => {
                const max = Math.max(...chartPoints);
                const x = (i / (chartPoints.length - 1)) * 200;
                const y = 50 - (v / max) * 45;
                return <circle key={i} cx={x} cy={y} r="3" fill="#6366f1" />;
              })}
            </svg>
          </div>

          {/* Today's jobs */}
          <div>
            <div className="text-xs font-semibold text-gray-900 mb-2">{"Aujourd'hui"}</div>
            <div className="space-y-1.5">
              {todayJobs.map((job, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${job.color}`} />
                    <span className="text-[10px] text-gray-500 w-10">{job.time}</span>
                    <span className="text-[11px] text-gray-800 font-medium">{job.client} — {job.service}</span>
                    <span className="text-[9px] text-gray-400">({job.employee})</span>
                  </div>
                  <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${job.statusColor}`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
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
        </main>
      </div>
    </BrowserFrame>
  );
}
