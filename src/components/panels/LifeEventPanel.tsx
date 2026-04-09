'use client';

import { useState } from 'react';
import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';
import { LifeEvent } from '@/lib/types';

function fmtMan(v: number) { return v >= 10000 ? `${Math.round(v / 10000).toLocaleString()}万` : `¥${v.toLocaleString()}`; }

export function LifeEventPanel() {
  const lifeEvents = useStore((s) => s.config.lifeEvents);
  const addLifeEvent = useStore((s) => s.addLifeEvent);
  const updateLifeEvent = useStore((s) => s.updateLifeEvent);
  const removeLifeEvent = useStore((s) => s.removeLifeEvent);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const newEvent = (): LifeEvent => ({
    id: String(Date.now()), name: '新規イベント', age: 35, lumpSumCost: 0, annualCost: 0, durationYears: 1,
  });

  const sorted = [...lifeEvents].map((e, i) => ({ ...e, _idx: i })).sort((a, b) => a.age - b.age);

  return (
    <div className="space-y-2">
      {sorted.map((event) => {
        const i = event._idx;
        const summary = [
          event.lumpSumCost ? `一時${fmtMan(event.lumpSumCost)}` : '',
          event.annualCost ? `年${event.annualCost > 0 ? '' : ''}${fmtMan(event.annualCost)}` : '',
          event.durationYears > 0 ? `${event.durationYears}年間` : '',
        ].filter(Boolean).join(' / ');

        return (
          <div key={event.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 text-xs"
              onClick={() => setExpandedId(expandedId === i ? null : i)}
            >
              <span className="text-gray-400 w-8 flex-shrink-0">{event.age}歳</span>
              <input
                type="text"
                value={event.name}
                onChange={(e) => { e.stopPropagation(); updateLifeEvent(i, { ...event, name: e.target.value }); }}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 outline-none w-28"
              />
              <span className="text-gray-400 ml-auto">{summary}</span>
              <span className="text-[10px] text-gray-300">{expandedId === i ? '▲' : '▼'}</span>
            </div>
            {expandedId === i && (
              <div className="px-3 pb-3 pt-1 border-t border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <NumberField label="発生年齢" value={event.age} onChange={(v) => updateLifeEvent(i, { ...event, age: v })} suffix="歳" />
                  <NumberField label="一時費用" value={event.lumpSumCost} onChange={(v) => updateLifeEvent(i, { ...event, lumpSumCost: v })} step={100000} suffix="円" />
                  <NumberField label="年間費用" value={event.annualCost} onChange={(v) => updateLifeEvent(i, { ...event, annualCost: v })} step={10000} suffix="円" />
                  <NumberField label="継続年数" value={event.durationYears} onChange={(v) => updateLifeEvent(i, { ...event, durationYears: v })} suffix="年" />
                </div>
                <button onClick={() => removeLifeEvent(i)} className="text-[11px] text-red-400 hover:text-red-600 mt-2">削除</button>
              </div>
            )}
          </div>
        );
      })}
      <button onClick={() => addLifeEvent(newEvent())} className="text-xs text-blue-500 hover:underline">+ イベントを追加</button>
    </div>
  );
}
