'use client';

import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';
import { Expenses, ExpensePhase } from '@/lib/types';

const defaultExpenses: Expenses = {
  food: 60_000, utilities: 25_000, transportation: 15_000, clothing: 10_000,
  medical: 10_000, entertainment: 20_000, education: 10_000, miscellaneous: 15_000,
  otherMonthly: 0, annualSpecial: 300_000, inflationRate: 1.5,
};

function newPhase(startAge: number): ExpensePhase {
  return {
    id: `ep-${Date.now()}`,
    name: '新しいフェーズ',
    startAge,
    expenses: { ...defaultExpenses },
  };
}

function ExpenseFields({ expenses, onChange }: { expenses: Expenses; onChange: (e: Expenses) => void }) {
  const u = (partial: Partial<Expenses>) => onChange({ ...expenses, ...partial });
  const monthly = Object.entries(expenses)
    .filter(([k]) => !['annualSpecial', 'inflationRate'].includes(k))
    .reduce((s, [, v]) => s + (v as number), 0);

  return (
    <div className="space-y-2">
      <div className="text-[11px] text-gray-400">月額合計: <span className="font-semibold text-gray-600">{Math.round(monthly / 10000)}万円/月</span></div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <NumberField label="食費" value={expenses.food} onChange={(v) => u({ food: v })} step={5000} suffix="円/月" />
        <NumberField label="光熱・通信費" value={expenses.utilities} onChange={(v) => u({ utilities: v })} step={1000} suffix="円/月" />
        <NumberField label="交通費" value={expenses.transportation} onChange={(v) => u({ transportation: v })} step={1000} suffix="円/月" />
        <NumberField label="被服費" value={expenses.clothing} onChange={(v) => u({ clothing: v })} step={1000} suffix="円/月" />
        <NumberField label="医療費" value={expenses.medical} onChange={(v) => u({ medical: v })} step={1000} suffix="円/月" />
        <NumberField label="娯楽・交際費" value={expenses.entertainment} onChange={(v) => u({ entertainment: v })} step={1000} suffix="円/月" />
        <NumberField label="自己投資" value={expenses.education} onChange={(v) => u({ education: v })} step={1000} suffix="円/月" />
        <NumberField label="日用品・雑費" value={expenses.miscellaneous} onChange={(v) => u({ miscellaneous: v })} step={1000} suffix="円/月" />
        <NumberField label="その他月額" value={expenses.otherMonthly} onChange={(v) => u({ otherMonthly: v })} step={1000} suffix="円/月" />
        <NumberField label="年間特別支出" value={expenses.annualSpecial} onChange={(v) => u({ annualSpecial: v })} step={10000} suffix="円/年" />
        <NumberField label="インフレ率" value={expenses.inflationRate} onChange={(v) => u({ inflationRate: v })} step={0.1} suffix="%" />
      </div>
    </div>
  );
}

export function ExpensePanel() {
  const config = useStore((s) => s.config);
  const updateExpenses = useStore((s) => s.updateExpenses);
  const addExpensePhase = useStore((s) => s.addExpensePhase);
  const updateExpensePhase = useStore((s) => s.updateExpensePhase);
  const removeExpensePhase = useStore((s) => s.removeExpensePhase);

  const phases = config.expensePhases ?? [];
  const hasPhases = phases.length > 0;
  const sorted = [...phases].sort((a, b) => a.startAge - b.startAge);

  return (
    <div className="space-y-4">
      {/* フェーズ未使用時: 従来の単一支出設定 */}
      {!hasPhases && (
        <>
          <p className="text-[11px] text-gray-400">住居費以外の月額支出(住居費は住宅セクションで管理)</p>
          <ExpenseFields expenses={config.expenses} onChange={(e) => updateExpenses(e)} />
          <button
            onClick={() => {
              // 現在の支出を最初のフェーズとして変換
              addExpensePhase({
                id: `ep-${Date.now()}`,
                name: '現在',
                startAge: config.profile.currentAge,
                expenses: { ...config.expenses },
              });
            }}
            className="text-xs text-blue-500 hover:underline"
          >
            + 支出フェーズに切り替える（年齢帯ごとに支出を変える）
          </button>
        </>
      )}

      {/* フェーズ使用時 */}
      {hasPhases && (
        <>
          <p className="text-[11px] text-gray-400">年齢帯ごとに支出の水準を設定できます。開始年齢順に適用されます。</p>

          {/* タイムライン */}
          <div className="flex items-center gap-1 text-[11px] overflow-x-auto py-1">
            {sorted.map((p, i) => (
              <div key={p.id} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-300">→</span>}
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 whitespace-nowrap">
                  {p.startAge}歳〜 {p.name}
                </span>
              </div>
            ))}
          </div>

          {sorted.map((phase) => {
            const originalIndex = phases.findIndex(p => p.id === phase.id);
            return (
              <div key={phase.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <label className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-gray-400">名前</span>
                    <input
                      type="text"
                      value={phase.name}
                      onChange={(e) => updateExpensePhase(originalIndex, { ...phase, name: e.target.value })}
                      className="text-sm border border-gray-200 rounded-md px-2 py-1 w-32"
                    />
                  </label>
                  <NumberField
                    label="開始年齢"
                    value={phase.startAge}
                    onChange={(v) => updateExpensePhase(originalIndex, { ...phase, startAge: v })}
                    suffix="歳"
                  />
                  <button
                    onClick={() => removeExpensePhase(originalIndex)}
                    className="text-red-400 text-xs hover:text-red-600 mt-3"
                  >
                    削除
                  </button>
                </div>
                <ExpenseFields
                  expenses={phase.expenses}
                  onChange={(e) => updateExpensePhase(originalIndex, { ...phase, expenses: e })}
                />
              </div>
            );
          })}

          <button
            onClick={() => {
              const lastAge = sorted.length > 0 ? sorted[sorted.length - 1].startAge + 10 : 40;
              addExpensePhase(newPhase(lastAge));
            }}
            className="text-xs text-blue-500 hover:underline"
          >
            + 支出フェーズを追加
          </button>
        </>
      )}
    </div>
  );
}
