'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const lineItems = [
  { desc: 'Réparation plomberie', qty: '2h', price: '75$', total: '150$' },
  { desc: 'Pièces et matériaux', qty: '1', price: '45$', total: '45$' },
];

export default function MockupInvoice() {
  const [visibleItems, setVisibleItems] = useState(0);
  const [showTotals, setShowTotals] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runAnimation = useCallback(() => {
    setVisibleItems(0);
    setShowTotals(false);
    setShowStamp(false);

    // Show items with stagger
    timerRef.current = setTimeout(() => setVisibleItems(1), 200);
    timerRef.current = setTimeout(() => setVisibleItems(2), 400);
    timerRef.current = setTimeout(() => setShowTotals(true), 600);
    timerRef.current = setTimeout(() => setShowStamp(true), 2000);
  }, []);

  useEffect(() => {
    runAnimation();
    const loop = setInterval(runAnimation, 6000);
    return () => {
      clearInterval(loop);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [runAnimation]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-gray-900">Test Inc.</div>
          <div className="text-[10px] text-gray-500">123 Rue Principale, Québec</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-indigo-600">FAC-0042</div>
          <div className="text-[10px] text-gray-500">20 avril 2026</div>
        </div>
      </div>

      {/* Client */}
      <div className="mb-3 pb-2 border-b border-gray-100">
        <div className="text-[10px] text-gray-500">Facturer à</div>
        <div className="text-xs font-medium text-gray-900">Jean Tremblay</div>
      </div>

      {/* Line items */}
      <div className="space-y-1.5 mb-3">
        <div className="grid grid-cols-4 text-[9px] text-gray-500 font-medium uppercase">
          <span className="col-span-2">Description</span>
          <span className="text-right">Qté × Prix</span>
          <span className="text-right">Total</span>
        </div>
        {lineItems.map((item, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-4 text-[10px] text-gray-800 transition-all duration-300 ${
              idx < visibleItems ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
            }`}
          >
            <span className="col-span-2">{item.desc}</span>
            <span className="text-right text-gray-600">{item.qty} × {item.price}</span>
            <span className="text-right font-medium">{item.total}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div
        className={`border-t border-gray-100 pt-2 space-y-0.5 transition-all duration-500 ${
          showTotals ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>Sous-total</span><span>195,00$</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>TPS (5%)</span><span>9,75$</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>TVQ (9.975%)</span><span>19,46$</span>
        </div>
        <div className="flex justify-between text-xs font-bold text-gray-900 pt-1 border-t border-gray-200">
          <span>Total</span><span>224,21$</span>
        </div>
      </div>

      {/* Pay button */}
      <button className="mt-3 w-full bg-indigo-600 text-white text-xs font-medium py-2 rounded-md hover:bg-indigo-700 transition-colors">
        Payer maintenant →
      </button>

      {/* PAYÉE stamp */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 transition-all duration-700 pointer-events-none ${
          showStamp ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        <div className="border-4 border-green-500 rounded-lg px-6 py-2">
          <span className="text-2xl font-black text-green-500 tracking-widest">PAYÉE ✓</span>
        </div>
      </div>
    </div>
  );
}
