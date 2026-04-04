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
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          step={step}
          min={min}
          max={max}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right"
        />
        {suffix && <span className="text-xs text-gray-400 whitespace-nowrap">{suffix}</span>}
      </div>
    </label>
  );
}
