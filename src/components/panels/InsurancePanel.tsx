'use client';

import { useState } from 'react';
import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';
import { SelectField } from '../SelectField';
import { Insurance, InsuranceType } from '@/lib/types';

const typeOptions: { value: InsuranceType; label: string }[] = [
  { value: 'life_term', label: '定期死亡' },
  { value: 'life_whole', label: '終身死亡' },
  { value: 'medical', label: '医療' },
  { value: 'cancer', label: 'がん' },
  { value: 'disability', label: '就業不能' },
  { value: 'income_protection', label: '収入保障' },
  { value: 'individual_annuity', label: '個人年金' },
];

const defaultInsurance: Insurance = {
  name: '新規保険', type: 'medical', monthlyPremium: 3000, startAge: 31, endAge: 65, coverage: 0, maturityRefund: 0, maturityAge: 65,
};

export function InsurancePanel() {
  const insurances = useStore((s) => s.config.insurances);
  const addInsurance = useStore((s) => s.addInsurance);
  const updateInsurance = useStore((s) => s.updateInsurance);
  const removeInsurance = useStore((s) => s.removeInsurance);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const totalMonthly = insurances.reduce((s, ins) => s + ins.monthlyPremium, 0);

  return (
    <div className="space-y-2">
      {totalMonthly > 0 && (
        <div className="text-[11px] text-gray-400">月額合計: <span className="font-semibold text-gray-600">¥{totalMonthly.toLocaleString()}</span></div>
      )}
      {insurances.map((ins, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* サマリー行 */}
          <div
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 text-xs"
            onClick={() => setExpandedId(expandedId === i ? null : i)}
          >
            <input
              type="text"
              value={ins.name}
              onChange={(e) => { e.stopPropagation(); updateInsurance(i, { ...ins, name: e.target.value }); }}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 outline-none w-24"
            />
            <span className="text-gray-400">{typeOptions.find(t => t.value === ins.type)?.label}</span>
            <span className="text-gray-500 ml-auto">¥{ins.monthlyPremium.toLocaleString()}/月</span>
            <span className="text-gray-400">{ins.startAge}-{ins.endAge}歳</span>
            <span className="text-[10px] text-gray-300">{expandedId === i ? '▲' : '▼'}</span>
          </div>
          {/* 展開時の詳細 */}
          {expandedId === i && (
            <div className="px-3 pb-3 pt-1 border-t border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SelectField label="種類" value={ins.type} onChange={(v) => updateInsurance(i, { ...ins, type: v as InsuranceType })} options={typeOptions} />
                <NumberField label="月額保険料" value={ins.monthlyPremium} onChange={(v) => updateInsurance(i, { ...ins, monthlyPremium: v })} step={500} suffix="円" />
                <NumberField label="開始" value={ins.startAge} onChange={(v) => updateInsurance(i, { ...ins, startAge: v })} suffix="歳" />
                <NumberField label="終了" value={ins.endAge} onChange={(v) => updateInsurance(i, { ...ins, endAge: v })} suffix="歳" />
                <NumberField label="保障額" value={ins.coverage} onChange={(v) => updateInsurance(i, { ...ins, coverage: v })} step={100000} suffix="円" />
                <NumberField label="満期返戻金" value={ins.maturityRefund} onChange={(v) => updateInsurance(i, { ...ins, maturityRefund: v })} step={100000} suffix="円" />
                <NumberField label="満期年齢" value={ins.maturityAge} onChange={(v) => updateInsurance(i, { ...ins, maturityAge: v })} suffix="歳" />
              </div>
              <button onClick={() => removeInsurance(i)} className="text-[11px] text-red-400 hover:text-red-600 mt-2">削除</button>
            </div>
          )}
        </div>
      ))}
      <button onClick={() => addInsurance({ ...defaultInsurance })} className="text-xs text-blue-500 hover:underline">+ 保険を追加</button>
    </div>
  );
}
