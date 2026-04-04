'use client';

import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';
import { SelectField } from '../SelectField';
import { InvestmentAccount } from '@/lib/types';

const typeOptions = [
  { value: 'tsumitate_nisa', label: 'つみたてNISA' },
  { value: 'growth_nisa', label: '成長投資枠(NISA)' },
  { value: 'ideco', label: 'iDeCo' },
  { value: 'corporate_dc', label: '企業型DC' },
  { value: 'taxable', label: '特定口座' },
];

const defaultAccount: InvestmentAccount = {
  name: '新規口座',
  type: 'taxable',
  monthlyContribution: 30000,
  expectedReturn: 5.0,
  startAge: 31,
  endAge: 65,
  currentBalance: 0,
};

export function InvestmentPanel() {
  const investments = useStore((s) => s.config.investments);
  const addInvestment = useStore((s) => s.addInvestment);
  const updateInvestment = useStore((s) => s.updateInvestment);
  const removeInvestment = useStore((s) => s.removeInvestment);

  return (
    <div className="space-y-4">
      {investments.map((acc, i) => (
        <div key={i} className="border border-gray-100 rounded p-3 space-y-2">
          <div className="flex justify-between items-center">
            <input
              type="text"
              value={acc.name}
              onChange={(e) => updateInvestment(i, { ...acc, name: e.target.value })}
              className="text-sm font-semibold border-b border-gray-200 focus:border-blue-400 outline-none"
            />
            <button onClick={() => removeInvestment(i)} className="text-red-400 text-xs hover:text-red-600">削除</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <SelectField label="種類" value={acc.type} onChange={(v) => updateInvestment(i, { ...acc, type: v as InvestmentAccount['type'] })} options={typeOptions} />
            <NumberField label="月額積立" value={acc.monthlyContribution} onChange={(v) => updateInvestment(i, { ...acc, monthlyContribution: v })} step={1000} suffix="円" />
            <NumberField label="期待リターン" value={acc.expectedReturn} onChange={(v) => updateInvestment(i, { ...acc, expectedReturn: v })} step={0.1} suffix="%" />
            <NumberField label="開始年齢" value={acc.startAge} onChange={(v) => updateInvestment(i, { ...acc, startAge: v })} suffix="歳" />
            <NumberField label="終了年齢" value={acc.endAge} onChange={(v) => updateInvestment(i, { ...acc, endAge: v })} suffix="歳" />
            <NumberField label="現在残高" value={acc.currentBalance} onChange={(v) => updateInvestment(i, { ...acc, currentBalance: v })} step={100000} suffix="円" />
            {acc.annualLimit !== undefined && (
              <NumberField label="年間上限" value={acc.annualLimit} onChange={(v) => updateInvestment(i, { ...acc, annualLimit: v })} step={10000} suffix="円" />
            )}
          </div>
        </div>
      ))}
      <button onClick={() => addInvestment({ ...defaultAccount })} className="text-sm text-blue-500 hover:underline">+ 投資口座を追加</button>
    </div>
  );
}
