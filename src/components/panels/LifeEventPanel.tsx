'use client';

import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';
import { LifeEvent } from '@/lib/types';

export function LifeEventPanel() {
  const lifeEvents = useStore((s) => s.config.lifeEvents);
  const addLifeEvent = useStore((s) => s.addLifeEvent);
  const updateLifeEvent = useStore((s) => s.updateLifeEvent);
  const removeLifeEvent = useStore((s) => s.removeLifeEvent);

  const newEvent = (): LifeEvent => ({
    id: String(Date.now()),
    name: '新規イベント',
    age: 35,
    lumpSumCost: 0,
    annualCost: 0,
    durationYears: 1,
  });

  return (
    <div className="space-y-4">
      {lifeEvents.map((event, i) => (
        <div key={event.id} className="border border-gray-100 rounded p-3 space-y-2">
          <div className="flex justify-between items-center">
            <input
              type="text"
              value={event.name}
              onChange={(e) => updateLifeEvent(i, { ...event, name: e.target.value })}
              className="text-sm font-semibold border-b border-gray-200 focus:border-blue-400 outline-none"
            />
            <button onClick={() => removeLifeEvent(i)} className="text-red-400 text-xs hover:text-red-600">削除</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumberField label="発生年齢" value={event.age} onChange={(v) => updateLifeEvent(i, { ...event, age: v })} suffix="歳" />
            <NumberField label="一時費用" value={event.lumpSumCost} onChange={(v) => updateLifeEvent(i, { ...event, lumpSumCost: v })} step={100000} suffix="円" />
            <NumberField label="年間費用" value={event.annualCost} onChange={(v) => updateLifeEvent(i, { ...event, annualCost: v })} step={10000} suffix="円" />
            <NumberField label="継続年数" value={event.durationYears} onChange={(v) => updateLifeEvent(i, { ...event, durationYears: v })} suffix="年" />
          </div>
        </div>
      ))}
      <button onClick={() => addLifeEvent(newEvent())} className="text-sm text-blue-500 hover:underline">+ イベントを追加</button>
    </div>
  );
}
