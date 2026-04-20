'use client';

import { ReactNode } from 'react';

interface BrowserFrameProps {
  url: string;
  children: ReactNode;
  className?: string;
}

export default function BrowserFrame({ url, children, className = '' }: BrowserFrameProps) {
  return (
    <div className={`rounded-lg border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* Chrome bar */}
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>

        {/* URL bar */}
        <div className="flex-1 bg-white rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-500 truncate">
          {url}
        </div>
      </div>

      {/* Content area */}
      <div className="bg-white">
        {children}
      </div>
    </div>
  );
}
