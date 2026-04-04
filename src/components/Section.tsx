'use client';

import React, { useState } from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Section({ title, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-left"
      >
        {title}
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}
