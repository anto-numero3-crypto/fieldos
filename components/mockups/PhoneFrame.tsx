'use client';

import { ReactNode } from 'react';

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
}

export default function PhoneFrame({ children, className = '' }: PhoneFrameProps) {
  return (
    <div
      className={`relative w-full max-w-[280px] mx-auto bg-gray-900 rounded-[2.5rem] p-3 shadow-xl ${className}`}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-gray-900 rounded-b-2xl z-10 flex items-center justify-center">
        <div className="w-[60px] h-[4px] bg-gray-700 rounded-full mt-1" />
      </div>

      {/* Screen */}
      <div className="relative bg-white rounded-[2rem] overflow-hidden min-h-[500px]">
        {children}
      </div>

      {/* Home indicator */}
      <div className="flex justify-center mt-2">
        <div className="w-[100px] h-[4px] bg-gray-600 rounded-full" />
      </div>
    </div>
  );
}
