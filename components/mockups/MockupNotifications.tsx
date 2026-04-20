'use client';

import BrowserFrame from './BrowserFrame';

const toggles = [
  { label: 'Rappel d\'intervention (24h avant)', on: true },
  { label: 'Notification "En route"', on: true },
  { label: 'Intervention complétée', on: true },
  { label: 'Facture envoyée', on: true },
  { label: 'Paiement reçu', on: true },
  { label: 'Facture en retard', on: false },
];

export default function MockupNotifications() {
  return (
    <BrowserFrame url="app.gestivio.ca/parametres/notifications">
      <div className="flex min-h-[380px]">
        {/* Left: Settings panel */}
        <div className="w-1/2 border-r border-gray-100 p-5">
          <div className="text-sm font-semibold text-gray-900 mb-4">Notifications automatiques</div>
          <div className="space-y-3">
            {toggles.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-[11px] text-gray-700">{t.label}</span>
                <div className={`relative w-8 h-[18px] rounded-full transition-colors ${t.on ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${t.on ? 'left-[16px]' : 'left-[2px]'}`} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="text-[10px] text-gray-500 uppercase font-medium mb-2">Canal d&apos;envoi</div>
            <div className="flex gap-2">
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-200">Courriel</span>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 font-medium border border-gray-200">SMS (Pro)</span>
            </div>
          </div>
        </div>

        {/* Right: Email preview */}
        <div className="w-1/2 p-5 bg-gray-50">
          <div className="text-[10px] text-gray-500 uppercase font-medium mb-3">Aperçu du courriel</div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Email header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-indigo-600">G</span>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-gray-900">Gestivio</div>
                  <div className="text-[8px] text-gray-400">noreply@gestivio.ca</div>
                </div>
              </div>
            </div>

            {/* Email body */}
            <div className="px-4 py-4">
              <div className="text-xs font-bold text-gray-900 mb-3">
                Rappel de votre intervention demain
              </div>
              <div className="text-[10px] text-gray-600 leading-relaxed space-y-2">
                <p>Bonjour Jean,</p>
                <p>
                  Votre intervention de déneigement est prévue demain à 8h00
                  au 270 rue des Érables, Québec.
                </p>
                <p className="text-[9px] text-gray-500">
                  Notre technicien Jean Roy sera sur place. Assurez-vous que l&apos;accès est dégagé.
                </p>
              </div>
              <button className="mt-4 inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-200 hover:bg-indigo-100 transition-colors">
                Voir les détails &rarr;
              </button>
            </div>

            {/* Email footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <div className="text-[8px] text-gray-400 text-center">
                Gestivio Inc. &middot; Se désabonner
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
