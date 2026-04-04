'use client';

import React from 'react';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  className?: string;
}

export function NumberField({ label, value, onChange, step = 1, min, max, suffix, className }: NumberFieldProps) {
  return (
    <label className={`flex flex-col gap-0.5 ${className ?? ''}`}>
      {label && <span className="text-[11px] text-gray-400 leading-tight">{label}</span>}
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          step={step}
          min={min}
          max={max}
          className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm text-right bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-colors"
        />
        {suffix && <span className="text-[11px] text-gray-400 whitespace-nowrap">{suffix}</span>}
      </div>
    </label>
  );
}
