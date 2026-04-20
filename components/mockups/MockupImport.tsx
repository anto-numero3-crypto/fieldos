'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import BrowserFrame from './BrowserFrame';

const previewRows = [
  { nom: 'Jean Tremblay', courriel: 'jean@email.com', telephone: '514-555-1234' },
  { nom: 'Marie Bouchard', courriel: 'marie@email.com', telephone: '450-555-5678' },
  { nom: 'Robert Martin', courriel: 'robert@email.com', telephone: '514-555-9012' },
];

export default function MockupImport() {
  const [phase, setPhase] = useState<'drop' | 'preview' | 'progress' | 'done'>('drop');
  const [progress, setProgress] = useState(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    timeoutsRef.current.push(setTimeout(fn, delay));
  }, []);

  const runAnimation = useCallback(() => {
    setPhase('drop');
    setProgress(0);

    // After 2s show preview
    schedule(() => setPhase('preview'), 2000);
    // After 4s start progress
    schedule(() => {
      setPhase('progress');
      setProgress(0);
      let count = 0;
      intervalRef.current = setInterval(() => {
        count += 1;
        setProgress(count);
        if (count >= 47) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setPhase('done');
        }
      }, 40);
    }, 4500);
  }, [schedule]);

  useEffect(() => {
    runAnimation();
    const loop = setInterval(() => {
      clearAll();
      runAnimation();
    }, 8000);
    return () => { clearInterval(loop); clearAll(); };
  }, [runAnimation, clearAll]);

  return (
    <BrowserFrame url="app.gestivio.ca/import">
      <div className="p-5 min-h-[380px]">
        {/* Title */}
        <div className="text-sm font-semibold text-gray-900 mb-4">Importer vos données</div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5">
          <span className="text-[10px] font-medium px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
            Clients &#10003;
          </span>
          <span className="text-[10px] font-medium px-3 py-1.5 rounded-md bg-gray-50 text-gray-500 border border-gray-200">
            Factures
          </span>
        </div>

        {/* Drop zone phase */}
        {phase === 'drop' && (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-300 transition-colors">
            <div className="text-2xl mb-2">📁</div>
            <div className="text-[11px] text-gray-600 font-medium">
              Glissez votre fichier CSV ici
            </div>
            <div className="text-[10px] text-gray-400 mt-1">ou cliquez pour parcourir</div>
            <div className="mt-4 flex justify-center">
              <span className="text-[10px] text-indigo-600 font-medium cursor-pointer hover:underline">
                📄 Télécharger le modèle CSV
              </span>
            </div>
          </div>
        )}

        {/* Preview phase */}
        {phase === 'preview' && (
          <div>
            <div className="text-[11px] font-medium text-gray-700 mb-3">
              Aperçu — <span className="text-indigo-600">47 clients trouvés</span>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Nom</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Courriel</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Téléphone</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2 text-gray-800">{row.nom}</td>
                      <td className="px-3 py-2 text-gray-600">{row.courriel}</td>
                      <td className="px-3 py-2 text-gray-600">{row.telephone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-[9px] text-gray-400 mt-2 text-center">... et 44 autres</div>
          </div>
        )}

        {/* Progress phase */}
        {phase === 'progress' && (
          <div className="pt-6">
            <div className="text-[11px] text-gray-700 font-medium mb-2 text-center">
              Import en cours... {progress}/47
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-100"
                style={{ width: `${(progress / 47) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Done phase */}
        {phase === 'done' && (
          <div className="pt-6 text-center">
            <div className="text-2xl mb-2">&#10003;</div>
            <div className="text-[12px] font-semibold text-green-700">47 clients importés!</div>
            <div className="text-[10px] text-gray-500 mt-1">Tout est prêt. Vos données sont disponibles.</div>
          </div>
        )}
      </div>
    </BrowserFrame>
  );
}
