'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import BrowserFrame from './BrowserFrame';

const invoices = [
  { num: 'FAC-0148', client: 'Sophie Côté',     amount: 485.12,  dueIn: -12, status: 'overdue' as const },
  { num: 'FAC-0146', client: 'Robert Martin',   amount: 1240.88, dueIn: -3,  status: 'overdue' as const },
  { num: 'FAC-0143', client: 'Marie Bouchard',  amount: 320.50,  dueIn: 0,   status: 'due' as const },
  { num: 'FAC-0141', client: 'Jean Tremblay',   amount: 898.25,  dueIn: 5,   status: 'upcoming' as const },
];

const reminderSequence = [
  { day: 'J+3',  label: 'Rappel amical',       tone: 'Bonjour, petit rappel que…' },
  { day: 'J+7',  label: 'Rappel ferme',        tone: 'Votre facture est en retard…' },
  { day: 'J+14', label: 'Avis final',          tone: 'Dernier rappel avant…' },
];

export default function MockupPaymentReminder() {
  const [activeReminder, setActiveReminder] = useState(0);
  const [paid, setPaid] = useState<string | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    timeoutsRef.current.push(setTimeout(fn, delay));
  }, []);

  const runAnimation = useCallback(() => {
    setActiveReminder(0);
    setPaid(null);

    schedule(() => setActiveReminder(1), 1600);
    schedule(() => setActiveReminder(2), 3200);
    // Client pays on the second reminder
    schedule(() => setPaid('FAC-0148'), 4400);
  }, [schedule]);

  useEffect(() => {
    runAnimation();
    const loop = setInterval(() => {
      clearTimeouts();
      runAnimation();
    }, 7000);
    return () => { clearInterval(loop); clearTimeouts(); };
  }, [runAnimation, clearTimeouts]);

  return (
    <BrowserFrame url="app.gestivio.ca/factures?status=overdue">
      <div className="flex min-h-[380px]">
        {/* Left: Overdue invoice list */}
        <div className="flex-1 p-4 border-r border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-900">Factures à suivre</span>
            <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-semibold">
              2 en retard
            </span>
          </div>

          <div className="space-y-1.5">
            {invoices.map((inv) => {
              const isPaid = paid === inv.num;
              return (
                <div
                  key={inv.num}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 transition-all ${
                    isPaid
                      ? 'border-green-200 bg-green-50'
                      : inv.status === 'overdue'
                      ? 'border-red-200 bg-red-50/60'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-7 rounded-full ${
                      isPaid ? 'bg-green-500'
                      : inv.status === 'overdue' ? 'bg-red-500'
                      : inv.status === 'due' ? 'bg-amber-400'
                      : 'bg-gray-300'
                    }`} />
                    <div>
                      <div className="text-[11px] font-semibold text-gray-900">{inv.num}</div>
                      <div className="text-[9px] text-gray-500">{inv.client}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-semibold text-gray-900 tabular-nums">{inv.amount.toFixed(2)} $</div>
                    <div className={`text-[9px] font-medium ${
                      isPaid ? 'text-green-600'
                      : inv.status === 'overdue' ? 'text-red-600'
                      : inv.status === 'due' ? 'text-amber-600'
                      : 'text-gray-500'
                    }`}>
                      {isPaid ? 'Payée'
                        : inv.status === 'overdue' ? `Retard ${Math.abs(inv.dueIn)} j`
                        : inv.status === 'due' ? "Échéance aujourd'hui"
                        : `Dans ${inv.dueIn} j`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-500">Total en retard</span>
              <span className="font-bold text-red-600 tabular-nums">
                1 726,00 $
              </span>
            </div>
          </div>
        </div>

        {/* Right: Reminder cadence + Stripe pay button */}
        <div className="w-60 p-4 bg-gray-50 space-y-3">
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-medium mb-2">
              Rappels automatiques
            </div>
            <div className="space-y-1.5">
              {reminderSequence.map((r, idx) => {
                const active = idx < activeReminder;
                const isCurrent = idx === activeReminder - 1;
                return (
                  <div
                    key={r.day}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 border transition-all ${
                      active
                        ? isCurrent
                          ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                          : 'border-gray-200 bg-white'
                        : 'border-dashed border-gray-200 bg-white/50 opacity-60'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {active ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-gray-900">{r.label}</span>
                        <span className="text-[8px] text-gray-500 font-mono">{r.day}</span>
                      </div>
                      <div className="text-[8px] text-gray-500 truncate italic">{r.tone}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stripe Pay mini-preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm space-y-2">
            <div className="text-[9px] text-gray-500 uppercase font-medium">Dans le courriel</div>
            <div className="text-[9px] text-gray-700 leading-relaxed">
              Bonjour Sophie, votre facture <span className="font-semibold">FAC-0148</span> est en retard.
            </div>
            <button
              className={`w-full text-[10px] px-2 py-2 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-all ${
                paid === 'FAC-0148'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-[#635bff] text-white shadow-sm hover:brightness-110'
              }`}
            >
              {paid === 'FAC-0148' ? (
                <>✓ Payée 485,12 $</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 10.9 13 11.5 13 13h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                  </svg>
                  Payer 485,12 $
                </>
              )}
            </button>
            <div className="text-[7px] text-gray-400 text-center">Sécurisé par Stripe</div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
