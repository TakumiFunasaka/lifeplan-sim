'use client';

import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';

export function IncomePanel() {
  const income = useStore((s) => s.config.income);
  const updateIncome = useStore((s) => s.updateIncome);
  const hasSpouse = useStore((s) => s.config.profile.spouseAge !== null);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-[11px] font-semibold text-gray-500 mb-2">本人</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumberField label="額面年収(賞与除く)" value={income.annualSalary} onChange={(v) => updateIncome({ annualSalary: v })} step={100000} suffix="円" />
          <NumberField label="賞与(年額)" value={income.annualBonus} onChange={(v) => updateIncome({ annualBonus: v })} step={100000} suffix="円" />
          <NumberField label="昇給率" value={income.salaryGrowthRate} onChange={(v) => updateIncome({ salaryGrowthRate: v })} step={0.1} suffix="%" />
          <NumberField label="昇給停止年齢" value={income.peakAge} onChange={(v) => updateIncome({ peakAge: v })} suffix="歳" />
        </div>
      </div>
      {hasSpouse && (
        <div>
          <h4 className="text-[11px] font-semibold text-gray-500 mb-2">配偶者</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumberField label="額面年収(賞与除く)" value={income.spouseAnnualSalary} onChange={(v) => updateIncome({ spouseAnnualSalary: v })} step={100000} suffix="円" />
            <NumberField label="賞与(年額)" value={income.spouseBonus} onChange={(v) => updateIncome({ spouseBonus: v })} step={100000} suffix="円" />
            <NumberField label="昇給率" value={income.spouseSalaryGrowthRate} onChange={(v) => updateIncome({ spouseSalaryGrowthRate: v })} step={0.1} suffix="%" />
            <NumberField label="昇給停止年齢" value={income.spousePeakAge} onChange={(v) => updateIncome({ spousePeakAge: v })} suffix="歳" />
          </div>
        </div>
      )}
      <div>
        <h4 className="text-[11px] font-semibold text-gray-500 mb-2">その他</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumberField label="副業(月額)" value={income.sideIncomeMonthly} onChange={(v) => updateIncome({ sideIncomeMonthly: v })} step={10000} suffix="円" />
          <NumberField label="その他年収" value={income.otherAnnualIncome} onChange={(v) => updateIncome({ otherAnnualIncome: v })} step={100000} suffix="円" />
        </div>
      </div>
    </div>
  );
}
