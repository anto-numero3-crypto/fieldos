'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import BrowserFrame from './BrowserFrame';

const lineItems = [
  { desc: 'Lavage de vitres extérieures', qty: 18, price: 15, total: 270 },
  { desc: 'Lavage de vitres intérieures', qty: 18, price: 12, total: 216 },
  { desc: 'Nettoyage moustiquaires',     qty: 6,  price: 8,  total: 48 },
];

const catalogItems = [
  'Lavage de vitres extérieures',
  'Lavage de vitres intérieures',
  'Nettoyage moustiquaires',
  'Nettoyage gouttières',
];

export default function MockupQuote() {
  const [visibleItems, setVisibleItems] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTotals, setShowTotals] = useState(false);
  const [sent, setSent] = useState(false);
  const [clientViewed, setClientViewed] = useState(false);
  const [approved, setApproved] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    timeoutsRef.current.push(setTimeout(fn, delay));
  }, []);

  const runAnimation = useCallback(() => {
    setVisibleItems(0);
    setShowDropdown(false);
    setShowTotals(false);
    setSent(false);
    setClientViewed(false);
    setApproved(false);

    // Build the quote
    schedule(() => setShowDropdown(true), 800);
    schedule(() => { setShowDropdown(false); setVisibleItems(1); }, 1700);
    schedule(() => setVisibleItems(2), 2200);
    schedule(() => setVisibleItems(3), 2700);
    schedule(() => setShowTotals(true), 3300);
    // Send
    schedule(() => setSent(true), 4500);
    // Client views
    schedule(() => setClientViewed(true), 5800);
    // Client approves
    schedule(() => setApproved(true), 7200);
  }, [schedule]);

  useEffect(() => {
    runAnimation();
    const loop = setInterval(() => {
      clearTimeouts();
      runAnimation();
    }, 9500);
    return () => { clearInterval(loop); clearTimeouts(); };
  }, [runAnimation, clearTimeouts]);

  const subtotal = lineItems.reduce((s, i) => s + i.total, 0);
  const tps = subtotal * 0.05;
  const tvq = subtotal * 0.09975;
  const total = subtotal + tps + tvq;

  return (
    <BrowserFrame url="app.gestivio.ca/devis/nouveau">
      <div className="flex min-h-[400px]">
        {/* Left — Quote builder */}
        <div className="flex-1 p-4 border-r border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Nouveau devis</span>
            <span className="text-xs font-mono text-violet-600 bg-violet-50 px-2 py-0.5 rounded">SOU-0128</span>
          </div>

          {/* Client */}
          <div>
            <label className="text-[9px] text-gray-500 uppercase font-medium">Client</label>
            <div className="mt-1 border border-violet-300 bg-violet-50/50 rounded-md px-2.5 py-1.5 text-[11px] text-gray-900">
              Marie Bouchard
            </div>
          </div>

          {/* Catalog line items */}
          <div>
            <label className="text-[9px] text-gray-500 uppercase font-medium">Articles du catalogue</label>
            <div className="mt-1 space-y-1 relative">
              <div className="grid grid-cols-[2fr_0.5fr_0.5fr_0.5fr] text-[8px] text-gray-500 font-medium uppercase px-1">
                <span>Description</span>
                <span className="text-right">Qté</span>
                <span className="text-right">Prix</span>
                <span className="text-right">Total</span>
              </div>

              {lineItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-[2fr_0.5fr_0.5fr_0.5fr] text-[10px] text-gray-800 bg-gray-50 rounded px-2 py-1.5 transition-all duration-300 ${
                    idx < visibleItems ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                  }`}
                >
                  <span className="truncate">{item.desc}</span>
                  <span className="text-right text-gray-600">{item.qty}</span>
                  <span className="text-right text-gray-600">{item.price} $</span>
                  <span className="text-right font-medium">{item.total} $</span>
                </div>
              ))}

              {/* Catalog dropdown */}
              {showDropdown && (
                <div className="absolute top-8 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1">
                  {catalogItems.map((item, idx) => (
                    <div key={idx} className={`px-2.5 py-1.5 text-[10px] flex items-center justify-between ${idx === 0 ? 'bg-violet-50 text-violet-700' : 'text-gray-700'}`}>
                      <span>{item}</span>
                      <span className="text-[8px] text-gray-400">Catalogue</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className={`border-t border-gray-100 pt-2 space-y-0.5 transition-all duration-500 ${showTotals ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>Sous-total</span><span>{subtotal.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>TPS (5%)</span><span>{tps.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>TVQ (9,975%)</span><span>{tvq.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-gray-900 pt-1 border-t border-gray-200">
              <span>Total</span><span>{total.toFixed(2)} $</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button className="flex-1 text-[10px] px-3 py-1.5 bg-gray-100 rounded-md text-gray-600 font-medium">Brouillon</button>
            <button className={`flex-1 text-[10px] px-3 py-1.5 rounded-md font-medium transition-all ${
              sent ? 'bg-green-500 text-white' : 'bg-violet-600 text-white'
            }`}>
              {sent ? '✓ Envoyé!' : 'Envoyer le devis →'}
            </button>
          </div>
        </div>

        {/* Right — Client view */}
        <div className="w-56 p-4 bg-gray-50 relative overflow-hidden">
          <div className="text-[9px] text-gray-500 uppercase font-medium mb-2 flex items-center justify-between">
            <span>Vue client</span>
            {clientViewed && (
              <span className="inline-flex items-center gap-1 text-[8px] text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ouvert
              </span>
            )}
          </div>
          <div className="bg-white rounded border border-gray-200 p-3 shadow-sm space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[9px] font-bold text-gray-900">Test Inc.</div>
                <div className="text-[7px] text-gray-500">Québec, QC</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-mono text-violet-600">SOU-0128</div>
                <div className="text-[7px] text-gray-400">Valide 30 jours</div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-1">
              <div className="text-[7px] text-gray-500">Devis pour</div>
              <div className="text-[8px] font-medium text-gray-800">Marie Bouchard</div>
            </div>
            {visibleItems > 0 && (
              <div className="space-y-0.5">
                {lineItems.slice(0, visibleItems).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[7px] text-gray-700">
                    <span className="truncate max-w-[100px]">{item.desc}</span>
                    <span>{item.total} $</span>
                  </div>
                ))}
              </div>
            )}
            {showTotals && (
              <div className="border-t border-gray-100 pt-1">
                <div className="flex justify-between text-[8px] font-bold text-gray-900">
                  <span>Total</span><span>{total.toFixed(2)} $</span>
                </div>
              </div>
            )}

            {/* Approve button (client-facing) */}
            {sent && (
              <button
                className={`w-full text-[9px] px-2 py-1.5 rounded-md font-semibold transition-all ${
                  approved
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-violet-600 text-white shadow-sm hover:bg-violet-700'
                }`}
              >
                {approved ? '✓ Devis accepté' : 'Accepter en 1 clic'}
              </button>
            )}
          </div>

          {/* Approved stamp */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] -rotate-12 transition-all duration-700 pointer-events-none ${
            approved ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}>
            <div className="border-4 border-green-500 rounded-lg px-3 py-1">
              <span className="text-base font-black text-green-500 tracking-widest">ACCEPTÉ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {approved && (
        <div className="absolute bottom-4 right-4 bg-green-600 text-white text-[10px] font-medium px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <span>✓</span>
          <span>Devis accepté — converti en facture</span>
        </div>
      )}
    </BrowserFrame>
  );
}
