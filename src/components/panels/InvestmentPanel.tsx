'use client';

import { useState } from 'react';
import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';
import { SelectField } from '../SelectField';
import { InvestmentAccount } from '@/lib/types';

const typeOptions = [
  { value: 'tsumitate_nisa', label: 'つみたてNISA' },
  { value: 'growth_nisa', label: '成長投資枠' },
  { value: 'ideco', label: 'iDeCo' },
  { value: 'corporate_dc', label: '企業型DC' },
  { value: 'taxable', label: '特定口座' },
];

const defaultAccount: InvestmentAccount = {
  name: '新規口座', type: 'taxable', monthlyContribution: 30000, expectedReturn: 5.0, startAge: 31, endAge: 65, currentBalance: 0,
};

function fmtMan(v: number) { return v >= 10000 ? `${Math.round(v / 10000).toLocaleString()}万` : `¥${v.toLocaleString()}`; }

export function InvestmentPanel() {
  const investments = useStore((s) => s.config.investments);
  const addInvestment = useStore((s) => s.addInvestment);
  const updateInvestment = useStore((s) => s.updateInvestment);
  const removeInvestment = useStore((s) => s.removeInvestment);
  const config = useStore((s) => s.config);
  const updateConfig = useStore((s) => s.updateConfig);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const totalMonthly = investments.reduce((s, a) => s + a.monthlyContribution, 0);

  return (
    <div className="space-y-3">
      {/* オプション(コンパクト) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={config.investmentCapToSurplus ?? true} onChange={(e) => updateConfig({ investmentCapToSurplus: e.target.checked })} />
          余剰連動
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={config.retirementDrawdown ?? true} onChange={(e) => updateConfig({ retirementDrawdown: e.target.checked })} />
          退職後取崩し
        </label>
        {config.retirementDrawdown && (
          <span className="flex items-center gap-1">
            下限<input type="number" value={config.retirementDrawdownBuffer ?? 3000000} onChange={(e) => updateConfig({ retirementDrawdownBuffer: Number(e.target.value) })} step={1000000} className="w-20 text-right border border-gray-200 rounded px-1 py-0 text-xs" />円
          </span>
        )}
        <span className="flex items-center gap-1">
          退職後リターン<input type="number" value={config.postRetirementReturn ?? 2} onChange={(e) => updateConfig({ postRetirementReturn: Number(e.target.value) })} step={0.5} className="w-12 text-right border border-gray-200 rounded px-1 py-0 text-xs" />%
        </span>
      </div>

      {totalMonthly > 0 && (
        <div className="text-[11px] text-gray-400">月額合計: <span className="font-semibold text-gray-600">¥{totalMonthly.toLocaleString()}</span></div>
      )}

      {investments.map((acc, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          <div
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 text-xs"
            onClick={() => setExpandedId(expandedId === i ? null : i)}
          >
            <input
              type="text"
              value={acc.name}
              onChange={(e) => { e.stopPropagation(); updateInvestment(i, { ...acc, name: e.target.value }); }}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 outline-none w-28"
            />
            <span className="text-gray-400">{typeOptions.find(t => t.value === acc.type)?.label}</span>
            <span className="text-gray-500 ml-auto">¥{acc.monthlyContribution.toLocaleString()}/月</span>
            <span className="text-gray-400">{acc.expectedReturn}%</span>
            <span className="text-gray-400">{acc.startAge}-{acc.endAge}歳</span>
            {acc.currentBalance > 0 && <span className="text-gray-400">残{fmtMan(acc.currentBalance)}</span>}
            <span className="text-[10px] text-gray-300">{expandedId === i ? '▲' : '▼'}</span>
          </div>
          {expandedId === i && (
            <div className="px-3 pb-3 pt-1 border-t border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SelectField label="種類" value={acc.type} onChange={(v) => updateInvestment(i, { ...acc, type: v as InvestmentAccount['type'] })} options={typeOptions} />
                <NumberField label="月額積立" value={acc.monthlyContribution} onChange={(v) => updateInvestment(i, { ...acc, monthlyContribution: v })} step={1000} suffix="円" />
                <NumberField label="期待リターン" value={acc.expectedReturn} onChange={(v) => updateInvestment(i, { ...acc, expectedReturn: v })} step={0.1} suffix="%" />
                <NumberField label="現在残高" value={acc.currentBalance} onChange={(v) => updateInvestment(i, { ...acc, currentBalance: v })} step={100000} suffix="円" />
                <NumberField label="開始" value={acc.startAge} onChange={(v) => updateInvestment(i, { ...acc, startAge: v })} suffix="歳" />
                <NumberField label="終了" value={acc.endAge} onChange={(v) => updateInvestment(i, { ...acc, endAge: v })} suffix="歳" />
                {acc.annualLimit !== undefined && (
                  <NumberField label="年間上限" value={acc.annualLimit} onChange={(v) => updateInvestment(i, { ...acc, annualLimit: v })} step={10000} suffix="円" />
                )}
              </div>
              <button onClick={() => removeInvestment(i)} className="text-[11px] text-red-400 hover:text-red-600 mt-2">削除</button>
            </div>
          )}
        </div>
      ))}
      <button onClick={() => addInvestment({ ...defaultAccount })} className="text-xs text-blue-500 hover:underline">+ 口座を追加</button>
    </div>
  );
}
