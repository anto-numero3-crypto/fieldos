'use client';

import { useState, useEffect, useRef } from 'react';
import BrowserFrame from './BrowserFrame';

function useCountUp(target: number, duration: number = 1200) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!started) return;
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
  }, [target, duration, started]);

  return value;
}

const recentInterventions = [
  { date: '12 avr 2026', service: 'Déneigement', employee: 'Jean Roy', color: 'bg-blue-500', amount: '65,00 $', status: 'Complété' },
  { date: '5 avr 2026', service: 'Nettoyage', employee: 'Marie Lévesque', color: 'bg-green-500', amount: '120,00 $', status: 'Complété' },
  { date: '28 mars 2026', service: 'Déneigement', employee: 'Tom Beaumont', color: 'bg-purple-500', amount: '65,00 $', status: 'Complété' },
];

const notes = [
  { date: '10 avr', text: 'Client préfère être contacté par texto. Entrée arrière accessible par la ruelle.' },
  { date: '2 mars', text: 'A mentionné un intérêt pour le contrat saisonnier de tonte.' },
];

export default function MockupClientProfile() {
  const interventions = useCountUp(23, 1200);
  const revenue = useCountUp(1847, 1400);

  return (
    <BrowserFrame url="app.gestivio.ca/clients/jean-tremblay">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-lg font-bold text-indigo-600">JT</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Jean Tremblay</h1>
              <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                <span>📧 jean.tremblay@gmail.com</span>
                <span>📱 514-555-3421</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">📍 452 Rue des Bouleaux, Québec, QC G1K 2T5</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="text-[10px] px-3 py-1.5 bg-gray-100 rounded-md text-gray-600 font-medium">Modifier</button>
            <button className="text-[10px] px-3 py-1.5 bg-indigo-600 rounded-md text-white font-medium">Nouvelle intervention</button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="text-[9px] text-blue-600 font-medium uppercase">Interventions</div>
            <div className="text-lg font-bold text-blue-700">{interventions}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="text-[9px] text-green-600 font-medium uppercase">Revenus totaux</div>
            <div className="text-lg font-bold text-green-700">{revenue.toLocaleString('fr-CA')} $</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
            <div className="text-[9px] text-amber-600 font-medium uppercase">Dernière visite</div>
            <div className="text-lg font-bold text-amber-700">15 avr</div>
          </div>
        </div>

        {/* Recent interventions */}
        <div>
          <div className="text-xs font-semibold text-gray-900 mb-2">Interventions récentes</div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-[9px] text-gray-500 font-medium uppercase text-left px-3 py-2">Date</th>
                  <th className="text-[9px] text-gray-500 font-medium uppercase text-left px-3 py-2">Service</th>
                  <th className="text-[9px] text-gray-500 font-medium uppercase text-left px-3 py-2">Employé</th>
                  <th className="text-[9px] text-gray-500 font-medium uppercase text-right px-3 py-2">Montant</th>
                  <th className="text-[9px] text-gray-500 font-medium uppercase text-right px-3 py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentInterventions.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                    <td className="text-[10px] text-gray-600 px-3 py-2">{row.date}</td>
                    <td className="text-[10px] text-gray-800 font-medium px-3 py-2">{row.service}</td>
                    <td className="text-[10px] text-gray-600 px-3 py-2 flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${row.color}`} />
                      {row.employee}
                    </td>
                    <td className="text-[10px] text-gray-800 font-medium px-3 py-2 text-right">{row.amount}</td>
                    <td className="text-[10px] text-right px-3 py-2">
                      <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full text-[9px] font-medium">{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-900">Notes</span>
            <button className="text-[9px] text-indigo-600 font-medium">+ Ajouter</button>
          </div>
          <div className="space-y-2">
            {notes.map((note, idx) => (
              <div key={idx} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <div className="text-[8px] text-amber-600 font-medium mb-0.5">{note.date}</div>
                <div className="text-[10px] text-gray-700">{note.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
