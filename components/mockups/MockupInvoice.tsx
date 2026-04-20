'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import BrowserFrame from './BrowserFrame';

const clients = ['Jean Tremblay', 'Marie Bouchard', 'Robert Martin', 'Sophie Côté'];

const lineItems = [
  { desc: 'Déneigement — Entrée principale', qty: 1, price: 65, total: 65 },
  { desc: 'Sel déglaçant (sac 20kg)', qty: 2, price: 12, total: 24 },
];

const autocompleteItems = ['Déneigement — Entrée principale', 'Déneigement — Stationnement', 'Déneigement — Toit'];

export default function MockupInvoice() {
  const [step, setStep] = useState(0);
  const [selectedClient, setSelectedClient] = useState('');
  const [visibleItems, setVisibleItems] = useState(0);
  const [showTotals, setShowTotals] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    timeoutsRef.current.push(setTimeout(fn, delay));
  }, []);

  const runAnimation = useCallback(() => {
    setStep(0);
    setSelectedClient('');
    setVisibleItems(0);
    setShowTotals(false);
    setShowDropdown(false);
    setShowToast(false);
    setShowStamp(false);

    // Step 1: Select client
    schedule(() => { setStep(1); setSelectedClient(clients[0]); }, 800);
    // Step 2: Show autocomplete
    schedule(() => { setStep(2); setShowDropdown(true); }, 1800);
    // Step 3: Add items
    schedule(() => { setShowDropdown(false); setVisibleItems(1); }, 2800);
    schedule(() => { setVisibleItems(2); }, 3400);
    // Step 4: Totals
    schedule(() => { setStep(3); setShowTotals(true); }, 4200);
    // Step 5: Send
    schedule(() => { setStep(4); setShowToast(true); }, 5800);
    // Step 6: Stamp
    schedule(() => { setShowStamp(true); }, 6800);
    // Reset
    schedule(() => { setShowToast(false); }, 7600);
  }, [schedule]);

  useEffect(() => {
    runAnimation();
    const loop = setInterval(() => {
      clearTimeouts();
      runAnimation();
    }, 8000);
    return () => { clearInterval(loop); clearTimeouts(); };
  }, [runAnimation, clearTimeouts]);

  const subtotal = lineItems.reduce((s, i) => s + i.total, 0);
  const tps = subtotal * 0.05;
  const tvq = subtotal * 0.09975;
  const total = subtotal + tps + tvq;

  return (
    <BrowserFrame url="app.gestivio.ca/factures/nouvelle">
      <div className="flex min-h-[400px]">
        {/* Left — Editor */}
        <div className="flex-1 p-4 border-r border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Nouvelle facture</span>
            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">FAC-0042</span>
          </div>

          {/* Client selector */}
          <div>
            <label className="text-[9px] text-gray-500 uppercase font-medium">Client</label>
            <div className={`mt-1 border rounded-md px-2.5 py-1.5 text-[11px] transition-all ${
              selectedClient ? 'border-indigo-300 bg-indigo-50/50 text-gray-900' : 'border-gray-200 text-gray-400'
            }`}>
              {selectedClient || 'Sélectionner un client...'}
            </div>
          </div>

          {/* Line items */}
          <div>
            <label className="text-[9px] text-gray-500 uppercase font-medium">Articles</label>
            <div className="mt-1 space-y-1 relative">
              {/* Table header */}
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

              {/* Autocomplete dropdown */}
              {showDropdown && (
                <div className="absolute top-8 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1">
                  {autocompleteItems.map((item, idx) => (
                    <div key={idx} className={`px-2.5 py-1.5 text-[10px] ${idx === 0 ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'} cursor-default`}>
                      {item}
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
              step >= 4 ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white'
            }`}>
              {step >= 4 ? '✓ Envoyée!' : 'Envoyer →'}
            </button>
          </div>
        </div>

        {/* Right — Preview */}
        <div className="w-48 p-4 bg-gray-50 relative overflow-hidden">
          <div className="text-[9px] text-gray-500 uppercase font-medium mb-2">Aperçu</div>
          <div className="bg-white rounded border border-gray-200 p-3 shadow-sm space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[9px] font-bold text-gray-900">Test Inc.</div>
                <div className="text-[7px] text-gray-500">Québec, QC</div>
              </div>
              <span className="text-[8px] font-mono text-indigo-600">FAC-0042</span>
            </div>
            <div className="border-t border-gray-100 pt-1">
              <div className="text-[7px] text-gray-500">Facturer à</div>
              <div className="text-[8px] font-medium text-gray-800">{selectedClient || '—'}</div>
            </div>
            {visibleItems > 0 && (
              <div className="space-y-0.5">
                {lineItems.slice(0, visibleItems).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[7px] text-gray-700">
                    <span className="truncate max-w-[80px]">{item.desc}</span>
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
          </div>

          {/* PAYÉE stamp */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 transition-all duration-700 pointer-events-none ${
            showStamp ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}>
            <div className="border-4 border-green-500 rounded-lg px-4 py-1.5">
              <span className="text-lg font-black text-green-500 tracking-widest">PAYÉE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="absolute bottom-4 right-4 bg-green-600 text-white text-[10px] font-medium px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>Facture envoyée à Jean Tremblay</span>
        </div>
      )}
    </BrowserFrame>
  );
}
