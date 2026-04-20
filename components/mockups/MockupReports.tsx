'use client';

import { useState, useEffect, useRef } from 'react';
import BrowserFrame from './BrowserFrame';

const periods = ['7 jours', '30 jours', '3 mois', '6 mois', '1 an'];

const monthlyData = [
  { month: 'Nov', revenue: 3200 },
  { month: 'Déc', revenue: 4800 },
  { month: 'Jan', revenue: 5100 },
  { month: 'Fév', revenue: 4600 },
  { month: 'Mar', revenue: 5400 },
  { month: 'Avr', revenue: 4320 },
];

const topServices = [
  { name: 'Déneigement', count: 42, revenue: '2 730 $', pct: 38 },
  { name: 'Tonte', count: 31, revenue: '1 550 $', pct: 28 },
  { name: 'Nettoyage', count: 18, revenue: '2 160 $', pct: 22 },
  { name: 'Autres', count: 7, revenue: '480 $', pct: 12 },
];

function useCountUp(target: number, duration: number = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
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
  }, [target, duration]);

  return value;
}

export default function MockupReports() {
  const [selectedPeriod, setSelectedPeriod] = useState(3);
  const [chartProgress, setChartProgress] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const totalRevenue = useCountUp(27420, 1500);
  const avgMonthly = useCountUp(4570, 1200);
  const totalJobs = useCountUp(98, 1000);
  const avgPerJob = useCountUp(87, 900);

  useEffect(() => {
    let frame: number;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setChartProgress(progress);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));
  const chartWidth = 320;
  const chartHeight = 100;

  const points = monthlyData.map((d, i) => ({
    x: (i / (monthlyData.length - 1)) * chartWidth,
    y: chartHeight - (d.revenue / maxRevenue) * (chartHeight - 20) - 10,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <BrowserFrame url="app.gestivio.ca/rapports">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-bold text-gray-900">Rapports</h1>
          <div className="flex gap-1">
            {periods.map((p, idx) => (
              <button
                key={idx}
                className={`text-[9px] px-2.5 py-1 rounded-full font-medium transition-all ${
                  idx === selectedPeriod
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
                onClick={() => setSelectedPeriod(idx)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
            <div className="text-[9px] text-indigo-600 font-medium uppercase">Revenus totaux</div>
            <div className="text-base font-bold text-indigo-700">{totalRevenue.toLocaleString('fr-CA')} $</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="text-[9px] text-green-600 font-medium uppercase">Moy. mensuelle</div>
            <div className="text-base font-bold text-green-700">{avgMonthly.toLocaleString('fr-CA')} $</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="text-[9px] text-blue-600 font-medium uppercase">Interventions</div>
            <div className="text-base font-bold text-blue-700">{totalJobs}</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
            <div className="text-[9px] text-amber-600 font-medium uppercase">Moy. / intervention</div>
            <div className="text-base font-bold text-amber-700">{avgPerJob} $</div>
          </div>
        </div>

        {/* Revenue chart */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="text-[10px] font-semibold text-gray-700 mb-3">Revenus mensuels</div>
          <svg ref={svgRef} viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`} className="w-full h-28">
            {/* Grid lines */}
            {[0, 1, 2, 3].map(i => (
              <line
                key={i}
                x1={0}
                y1={10 + i * 25}
                x2={chartWidth}
                y2={10 + i * 25}
                stroke="#e5e7eb"
                strokeWidth="0.5"
                strokeDasharray="4 2"
              />
            ))}

            {/* Area fill */}
            <path
              d={areaD}
              fill="url(#gradient)"
              opacity={0.3}
              style={{ clipPath: `inset(0 ${(1 - chartProgress) * 100}% 0 0)` }}
            />

            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ clipPath: `inset(0 ${(1 - chartProgress) * 100}% 0 0)` }}
            />

            {/* Points */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="#6366f1"
                stroke="white"
                strokeWidth="2"
                className={`transition-opacity duration-300 ${chartProgress > (i / points.length) ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}

            {/* Month labels */}
            {monthlyData.map((d, i) => (
              <text
                key={i}
                x={points[i].x}
                y={chartHeight + 15}
                textAnchor="middle"
                className="text-[8px] fill-gray-500"
              >
                {d.month}
              </text>
            ))}

            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Top services */}
        <div>
          <div className="text-xs font-semibold text-gray-900 mb-2">Services les plus demandés</div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-[9px] text-gray-500 font-medium uppercase text-left px-3 py-2">Service</th>
                  <th className="text-[9px] text-gray-500 font-medium uppercase text-right px-3 py-2">Nombre</th>
                  <th className="text-[9px] text-gray-500 font-medium uppercase text-right px-3 py-2">Revenus</th>
                  <th className="text-[9px] text-gray-500 font-medium uppercase px-3 py-2 w-24">Part</th>
                </tr>
              </thead>
              <tbody>
                {topServices.map((svc, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                    <td className="text-[10px] text-gray-800 font-medium px-3 py-2">{svc.name}</td>
                    <td className="text-[10px] text-gray-600 text-right px-3 py-2">{svc.count}</td>
                    <td className="text-[10px] text-gray-800 font-medium text-right px-3 py-2">{svc.revenue}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${svc.pct}%` }} />
                        </div>
                        <span className="text-[8px] text-gray-500 w-6 text-right">{svc.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
