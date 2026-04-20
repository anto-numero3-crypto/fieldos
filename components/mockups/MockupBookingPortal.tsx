'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PhoneFrame from './PhoneFrame';

const services = [
  { name: 'Déneigement', price: '65 $', icon: '❄️' },
  { name: 'Tonte de pelouse', price: '50 $', icon: '🌿' },
  { name: 'Nettoyage printanier', price: '120 $', icon: '🧹' },
];

const timeSlots = ['7h30', '8h00', '9h00', '10h30', '13h00', '14h30'];
const calendarDays = [14, 15, 16, 17, 18, 19, 20];

export default function MockupBookingPortal() {
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState(-1);
  const [selectedDay, setSelectedDay] = useState(-1);
  const [selectedTime, setSelectedTime] = useState(-1);
  const [showConfirm, setShowConfirm] = useState(false);
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
    setSelectedService(-1);
    setSelectedDay(-1);
    setSelectedTime(-1);
    setShowConfirm(false);

    // Step 1: Select service
    schedule(() => { setStep(1); setSelectedService(0); }, 1000);
    // Step 2: Calendar
    schedule(() => { setStep(2); }, 2200);
    schedule(() => { setSelectedDay(2); }, 3000);
    // Step 3: Time
    schedule(() => { setStep(3); }, 4000);
    schedule(() => { setSelectedTime(0); }, 4800);
    // Step 4: Client info + confirm
    schedule(() => { setStep(4); }, 5800);
    schedule(() => { setShowConfirm(true); }, 7200);
    // Reset
    schedule(() => { setShowConfirm(false); }, 9000);
  }, [schedule]);

  useEffect(() => {
    runAnimation();
    const loop = setInterval(() => {
      clearTimeouts();
      runAnimation();
    }, 10000);
    return () => { clearInterval(loop); clearTimeouts(); };
  }, [runAnimation, clearTimeouts]);

  return (
    <PhoneFrame>
      {/* Header */}
      <div className="bg-indigo-600 px-4 py-3 pt-8">
        <div className="text-xs font-semibold text-white">Test Inc.</div>
        <div className="text-[10px] text-indigo-200">Réserver un service</div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 bg-white border-b border-gray-100">
        <div className="flex items-center gap-1">
          {['Service', 'Date', 'Heure', 'Infos'].map((label, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div className={`w-full h-1 rounded-full mb-1 transition-all duration-500 ${
                idx < step ? 'bg-indigo-600' : idx === step ? 'bg-indigo-300' : 'bg-gray-200'
              }`} />
              <span className={`text-[7px] font-medium ${idx <= step ? 'text-indigo-600' : 'text-gray-400'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 bg-gray-50 h-[340px] overflow-hidden">
        {/* Step 1: Service selection */}
        {step >= 0 && step <= 1 && (
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-gray-700 mb-2">Choisir un service</div>
            {services.map((svc, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border transition-all duration-300 ${
                  selectedService === idx ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{svc.icon}</span>
                  <span className="text-[11px] font-medium text-gray-800">{svc.name}</span>
                </div>
                <span className="text-[10px] font-semibold text-indigo-600">{svc.price}</span>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Calendar */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="text-[10px] font-semibold text-gray-700">Choisir une date</div>
            <div className="text-[9px] text-gray-500 text-center font-medium">Avril 2026</div>
            <div className="grid grid-cols-7 gap-1">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                <div key={i} className="text-center text-[8px] text-gray-400 font-medium py-1">{d}</div>
              ))}
              {calendarDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`text-center text-[10px] py-2 rounded-lg transition-all ${
                    selectedDay === idx
                      ? 'bg-indigo-600 text-white font-bold'
                      : idx < 5
                      ? 'text-gray-800 bg-white border border-gray-100'
                      : 'text-gray-400 bg-gray-50'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Time slots */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="text-[10px] font-semibold text-gray-700">Choisir une heure</div>
            <div className="text-[9px] text-gray-500">Mercredi 16 avril 2026</div>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((time, idx) => (
                <div
                  key={idx}
                  className={`text-center text-[10px] py-2.5 rounded-lg border transition-all font-medium ${
                    selectedTime === idx
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-200'
                  }`}
                >
                  {time}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Client info */}
        {step === 4 && (
          <div className="space-y-3">
            <div className="text-[10px] font-semibold text-gray-700">Vos informations</div>
            <div className="space-y-2">
              <div>
                <label className="text-[8px] text-gray-500 uppercase font-medium">Nom</label>
                <div className="mt-0.5 bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-[10px] text-gray-800">Jean Tremblay</div>
              </div>
              <div>
                <label className="text-[8px] text-gray-500 uppercase font-medium">Téléphone</label>
                <div className="mt-0.5 bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-[10px] text-gray-800">514-555-3421</div>
              </div>
              <div>
                <label className="text-[8px] text-gray-500 uppercase font-medium">Adresse</label>
                <div className="mt-0.5 bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-[10px] text-gray-800">452 Rue des Bouleaux, Québec</div>
              </div>
            </div>

            {/* Summary card */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mt-2">
              <div className="text-[9px] text-indigo-600 font-medium uppercase mb-1">Résumé</div>
              <div className="text-[10px] text-gray-800 space-y-0.5">
                <div>❄️ Déneigement — 65 $</div>
                <div>📅 Mer. 16 avril, 7h30</div>
                <div>📍 452 Rue des Bouleaux</div>
              </div>
            </div>

            {/* Confirm button */}
            <button className={`w-full py-2.5 rounded-lg text-[11px] font-semibold transition-all duration-500 ${
              showConfirm
                ? 'bg-green-500 text-white'
                : 'bg-indigo-600 text-white'
            }`}>
              {showConfirm ? '✓ Réservation confirmée!' : 'Confirmer la réservation'}
            </button>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}
