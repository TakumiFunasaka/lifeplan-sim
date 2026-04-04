'use client';

import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';
import { SelectField } from '../SelectField';
import { Insurance, InsuranceType } from '@/lib/types';

const typeOptions: { value: InsuranceType; label: string }[] = [
  { value: 'life_term', label: '定期死亡保険' },
  { value: 'life_whole', label: '終身死亡保険' },
  { value: 'medical', label: '医療保険' },
  { value: 'cancer', label: 'がん保険' },
  { value: 'disability', label: '就業不能保険' },
  { value: 'income_protection', label: '収入保障保険' },
  { value: 'individual_annuity', label: '個人年金保険' },
];

const defaultInsurance: Insurance = {
  name: '新規保険',
  type: 'medical',
  monthlyPremium: 3000,
  startAge: 31,
  endAge: 65,
  coverage: 0,
  maturityRefund: 0,
  maturityAge: 65,
};

export function InsurancePanel() {
  const insurances = useStore((s) => s.config.insurances);
  const addInsurance = useStore((s) => s.addInsurance);
  const updateInsurance = useStore((s) => s.updateInsurance);
  const removeInsurance = useStore((s) => s.removeInsurance);

  return (
    <div className="space-y-4">
      {insurances.map((ins, i) => (
        <div key={i} className="border border-gray-100 rounded p-3 space-y-2">
          <div className="flex justify-between items-center">
            <input
              type="text"
              value={ins.name}
              onChange={(e) => updateInsurance(i, { ...ins, name: e.target.value })}
              className="text-sm font-semibold border-b border-gray-200 focus:border-blue-400 outline-none"
            />
            <button onClick={() => removeInsurance(i)} className="text-red-400 text-xs hover:text-red-600">削除</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <SelectField label="種類" value={ins.type} onChange={(v) => updateInsurance(i, { ...ins, type: v as InsuranceType })} options={typeOptions} />
            <NumberField label="月額保険料" value={ins.monthlyPremium} onChange={(v) => updateInsurance(i, { ...ins, monthlyPremium: v })} step={500} suffix="円" />
            <NumberField label="開始年齢" value={ins.startAge} onChange={(v) => updateInsurance(i, { ...ins, startAge: v })} suffix="歳" />
            <NumberField label="終了年齢" value={ins.endAge} onChange={(v) => updateInsurance(i, { ...ins, endAge: v })} suffix="歳" />
            <NumberField label="保障額" value={ins.coverage} onChange={(v) => updateInsurance(i, { ...ins, coverage: v })} step={100000} suffix="円" />
            <NumberField label="満期返戻金" value={ins.maturityRefund} onChange={(v) => updateInsurance(i, { ...ins, maturityRefund: v })} step={100000} suffix="円" />
            <NumberField label="満期年齢" value={ins.maturityAge} onChange={(v) => updateInsurance(i, { ...ins, maturityAge: v })} suffix="歳" />
          </div>
        </div>
      ))}
      <button onClick={() => addInsurance({ ...defaultInsurance })} className="text-sm text-blue-500 hover:underline">+ 保険を追加</button>
    </div>
  );
}
