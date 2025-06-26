import React, { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  text: string;
}

export function Tooltip({ children, text }: TooltipProps) {
  return (
    <span className="relative group">
      {children}
      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none bg-gray-900 text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap transition-all duration-200">
        {text}
      </span>
    </span>
  );
}