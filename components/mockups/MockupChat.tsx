'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Message {
  text: string;
  isClient: boolean;
}

const messages: Message[] = [
  { text: "Bonjour, j'ai besoin d'un lavage de vitres pour ma maison", isClient: true },
  { text: 'Bonjour! Bien sûr. Pour quand auriez-vous besoin du service?', isClient: false },
  { text: 'Samedi matin si possible', isClient: true },
  { text: 'Parfait! Quelle est votre adresse et votre numéro de téléphone?', isClient: false },
  { text: '123 Rue Des Érables, 514-555-1234', isClient: true },
  { text: '✓ Réservation confirmée!\nSamedi 9h00 · Lavage de vitres', isClient: false },
];

export default function MockupChat() {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSequence = useCallback(() => {
    setVisibleMessages([]);
    setShowTyping(false);

    let delay = 400;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    messages.forEach((msg, idx) => {
      // Show typing indicator before AI messages
      if (!msg.isClient) {
        timeouts.push(setTimeout(() => setShowTyping(true), delay));
        delay += 600;
      }

      timeouts.push(
        setTimeout(() => {
          setShowTyping(false);
          setVisibleMessages((prev) => [...prev, msg]);
        }, delay)
      );
      delay += 800;

      // Extra pause after idx to let user read
      if (idx < messages.length - 1) {
        delay += 200;
      }
    });

    return timeouts;
  }, []);

  useEffect(() => {
    let timeouts = runSequence();
    const loop = setInterval(() => {
      timeouts.forEach(clearTimeout);
      timeouts = runSequence();
    }, 12000);

    return () => {
      clearInterval(loop);
      timeouts.forEach(clearTimeout);
    };
  }, [runSequence]);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleMessages, showTyping]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Chat header */}
      <div className="bg-indigo-600 px-4 py-2.5 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-indigo-400 flex items-center justify-center">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        <div>
          <div className="text-xs font-semibold text-white">Assistant Gestivio</div>
          <div className="text-[10px] text-indigo-200">En ligne</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="p-3 space-y-2 h-[280px] overflow-y-auto bg-gray-50">
        {visibleMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.isClient ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed transition-all duration-300 ${
                msg.isClient
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
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
