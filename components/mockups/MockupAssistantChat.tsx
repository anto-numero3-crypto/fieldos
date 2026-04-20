'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PhoneFrame from './PhoneFrame';

interface Message {
  text: string;
  isOwner: boolean;
}

const messages: Message[] = [
  { text: "Combien j'ai facture ce mois-ci?", isOwner: true },
  { text: "Ce mois-ci vous avez facture 4 320 $ repartis sur 18 factures. 15 sont payees ($3 430) et 3 sont en attente ($890).", isOwner: false },
  { text: "Qui est mon meilleur client?", isOwner: true },
  { text: "Jean Tremblay est votre client le plus actif avec 23 interventions et $1 847 de revenus cette annee.", isOwner: false },
  { text: "Redige un courriel de suivi pour les factures impayees", isOwner: true },
  { text: "Voici un brouillon:\n\nBonjour [Client],\n\nNous vous rappelons que la facture FAC-0042 de 102,33 $ est en attente depuis le 2 avril. Merci de proceder au paiement a votre convenance.\n\nCordialement,\nAntoine", isOwner: false },
];

export default function MockupAssistantChat() {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSequence = useCallback(() => {
    setVisibleMessages([]);
    setShowTyping(false);

    let delay = 600;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    messages.forEach((msg, idx) => {
      if (!msg.isOwner) {
        timeouts.push(setTimeout(() => setShowTyping(true), delay));
        delay += 800;
      }

      timeouts.push(
        setTimeout(() => {
          setShowTyping(false);
          setVisibleMessages((prev) => [...prev, msg]);
        }, delay)
      );
      delay += 900;

      if (idx < messages.length - 1) {
        delay += 400;
      }
    });

    return timeouts;
  }, []);

  useEffect(() => {
    let timeouts = runSequence();
    const loop = setInterval(() => {
      timeouts.forEach(clearTimeout);
      timeouts = runSequence();
    }, 16000);

    return () => {
      clearInterval(loop);
      timeouts.forEach(clearTimeout);
    };
  }, [runSequence]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleMessages, showTyping]);

  return (
    <PhoneFrame>
      {/* Header */}
      <div className="bg-indigo-600 px-4 py-3 flex items-center gap-2 pt-8">
        <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center">
          <span className="text-white text-xs font-bold">IA</span>
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
            Assistant IA
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div className="text-[10px] text-indigo-200">Gestivio</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 p-3 space-y-2.5 h-[360px] overflow-y-auto bg-gray-50">
        {/* Date separator */}
        <div className="flex items-center gap-2 my-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[8px] text-gray-400 font-medium">{"Aujourd'hui 9:15"}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {visibleMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.isOwner ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}
          >
            {!msg.isOwner && (
              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center mr-1.5 mt-auto">
                <span className="text-[8px] text-indigo-600 font-bold">IA</span>
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
                msg.isOwner
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
              }`}
              style={{ whiteSpace: 'pre-line' }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {showTyping && (
          <div className="flex justify-start">
            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center mr-1.5 mt-auto">
              <span className="text-[8px] text-indigo-600 font-bold">IA</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm flex gap-1.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="px-3 py-2 border-t border-gray-200 bg-white flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full px-3 py-1.5 text-[10px] text-gray-400">
          Posez une question...
        </div>
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
          <span className="text-white text-[10px]">↑</span>
        </div>
      </div>
    </PhoneFrame>
  );
}
