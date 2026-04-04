'use client';

import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';

export function ExpensePanel() {
  const expenses = useStore((s) => s.config.expenses);
  const updateExpenses = useStore((s) => s.updateExpenses);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">月額ベース(住居費は住宅セクションで管理する場合は0に)</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <NumberField label="家賃(賃貸の場合)" value={expenses.housing} onChange={(v) => updateExpenses({ housing: v })} step={5000} suffix="円/月" />
        <NumberField label="食費" value={expenses.food} onChange={(v) => updateExpenses({ food: v })} step={5000} suffix="円/月" />
        <NumberField label="光熱・通信費" value={expenses.utilities} onChange={(v) => updateExpenses({ utilities: v })} step={1000} suffix="円/月" />
        <NumberField label="交通費" value={expenses.transportation} onChange={(v) => updateExpenses({ transportation: v })} step={1000} suffix="円/月" />
        <NumberField label="被服費" value={expenses.clothing} onChange={(v) => updateExpenses({ clothing: v })} step={1000} suffix="円/月" />
        <NumberField label="医療費" value={expenses.medical} onChange={(v) => updateExpenses({ medical: v })} step={1000} suffix="円/月" />
        <NumberField label="娯楽費" value={expenses.entertainment} onChange={(v) => updateExpenses({ entertainment: v })} step={1000} suffix="円/月" />
        <NumberField label="自己投資" value={expenses.education} onChange={(v) => updateExpenses({ education: v })} step={1000} suffix="円/月" />
        <NumberField label="雑費" value={expenses.miscellaneous} onChange={(v) => updateExpenses({ miscellaneous: v })} step={1000} suffix="円/月" />
        <NumberField label="その他月額" value={expenses.otherMonthly} onChange={(v) => updateExpenses({ otherMonthly: v })} step={1000} suffix="円/月" />
        <NumberField label="年間特別支出" value={expenses.annualSpecial} onChange={(v) => updateExpenses({ annualSpecial: v })} step={10000} suffix="円/年" />
        <NumberField label="インフレ率" value={expenses.inflationRate} onChange={(v) => updateExpenses({ inflationRate: v })} step={0.1} suffix="%" />
      </div>
    </div>
  );
}
