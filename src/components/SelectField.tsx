'use client';

import React from 'react';

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function SelectField({ label, value, onChange, options, className }: SelectFieldProps) {
  return (
    <label className={`flex flex-col gap-0.5 ${className ?? ''}`}>
      {label && <span className="text-[11px] text-gray-400 leading-tight">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-200 rounded-md px-2 py-1 text-sm bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
