'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PhoneFrame from './PhoneFrame';

const contractDetails = [
  { label: 'Service', value: 'Déneigement saisonnier' },
  { label: 'Durée', value: '1er nov. 2026 — 15 avr. 2027' },
  { label: 'Fréquence', value: 'Chaque accumulation > 5cm' },
  { label: 'Adresse', value: '452 Rue des Bouleaux, Québec' },
];

export default function MockupContractApproval() {
  const [signatureProgress, setSignatureProgress] = useState(0);
  const [showApproved, setShowApproved] = useState(false);
  const [step, setStep] = useState<'viewing' | 'signing' | 'done'>('viewing');
  const canvasRef = useRef<SVGSVGElement>(null);
  const animRef = useRef<number | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  const runAnimation = useCallback(() => {
    setSignatureProgress(0);
    setShowApproved(false);
    setStep('viewing');

    // Start signing after 2s
    timeoutsRef.current.push(setTimeout(() => {
      setStep('signing');
      const duration = 2000;
      const startTime = performance.now();
      const animate = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        setSignatureProgress(progress);
        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          // Show approved
          timeoutsRef.current.push(setTimeout(() => {
            setStep('done');
            setShowApproved(true);
          }, 400));
        }
      };
      animRef.current = requestAnimationFrame(animate);
    }, 2000));
  }, []);

  useEffect(() => {
    runAnimation();
    const loop = setInterval(() => {
      clearAll();
      runAnimation();
    }, 8000);
    return () => { clearInterval(loop); clearAll(); };
  }, [runAnimation, clearAll]);

  // Bezier signature path
  const signaturePath = 'M 20 35 C 30 15, 45 50, 60 30 S 80 10, 100 25 S 130 45, 150 20 C 160 15, 170 35, 180 28';

  const subtotal = 3380;
  const tps = subtotal * 0.05;
  const tvq = subtotal * 0.09975;
  const total = subtotal + tps + tvq;

  return (
    <PhoneFrame>
      {/* Header */}
      <div className="bg-indigo-600 px-4 py-3 pt-8">
        <div className="text-xs font-semibold text-white">Test Inc.</div>
        <div className="text-[10px] text-indigo-200">Contrat Déneigement</div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 bg-white h-[420px] overflow-y-auto space-y-3">
        {/* Contract header */}
        <div className="text-center border-b border-gray-100 pb-3">
          <div className="text-[11px] font-bold text-gray-900">Contrat de service — Déneigement saisonnier</div>
          <div className="text-[9px] text-gray-500 mt-0.5">Contrat #CTR-2026-018</div>
        </div>

        {/* Contract details */}
        <div className="space-y-2">
          {contractDetails.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start">
              <span className="text-[9px] text-gray-500 font-medium">{item.label}</span>
              <span className="text-[10px] text-gray-800 font-medium text-right max-w-[60%]">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-1">
          <div className="text-[9px] text-gray-500 font-medium uppercase mb-1">Tarification</div>
          <div className="flex justify-between text-[10px] text-gray-700">
            <span>Déneigement (estimé 26 visites)</span>
            <span className="font-medium">65 $ / visite</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-700">
            <span>Sel déglaçant (inclus)</span>
            <span className="font-medium">Inclus</span>
          </div>
          <div className="border-t border-gray-200 mt-2 pt-2 space-y-0.5">
            <div className="flex justify-between text-[9px] text-gray-600">
              <span>Sous-total (26 × 65 $ + 690 $ sel)</span>
              <span>{subtotal.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-[9px] text-gray-600">
              <span>TPS (5%)</span>
              <span>{tps.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-[9px] text-gray-600">
              <span>TVQ (9,975%)</span>
              <span>{tvq.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-gray-900 pt-1 border-t border-gray-200">
              <span>Total estimé</span>
              <span>{total.toFixed(2)} $</span>
            </div>
          </div>
        </div>

        {/* Signature area */}
        <div className="border border-gray-200 rounded-lg p-3">
          <div className="text-[9px] text-gray-500 font-medium uppercase mb-2">Signature du client</div>
          <div className={`relative bg-gray-50 rounded border border-dashed h-14 flex items-center justify-center ${
            step === 'signing' ? 'border-indigo-300' : 'border-gray-300'
          }`}>
            {step === 'viewing' && (
              <span className="text-[9px] text-gray-400">Touchez pour signer</span>
            )}
            {(step === 'signing' || step === 'done') && (
              <svg ref={canvasRef} viewBox="0 0 200 50" className="w-full h-full px-2">
                <path
                  d={signaturePath}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="300"
                  strokeDashoffset={300 - signatureProgress * 300}
                  className="transition-none"
                />
              </svg>
            )}
          </div>
          <div className="text-[8px] text-gray-400 mt-1 text-center">Jean Tremblay — 14 avril 2026</div>
        </div>

        {/* Approval */}
        <div className={`transition-all duration-500 ${showApproved ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-600">✓ Approuvé!</div>
            <div className="text-[9px] text-green-700 mt-0.5">Contrat signé avec succès. Une copie a été envoyée par courriel.</div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
