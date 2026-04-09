'use client';

import { useState } from 'react';
import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';
import { Expenses, ExpensePhase } from '@/lib/types';

const defaultExpenses: Expenses = {
  food: 60_000, utilities: 25_000, transportation: 15_000, clothing: 10_000,
  medical: 10_000, entertainment: 20_000, education: 10_000, miscellaneous: 15_000,
  otherMonthly: 0, annualSpecial: 300_000, inflationRate: 1.5,
};

const FIELDS: { key: keyof Expenses; label: string; step: number; suffix: string; isMonthly: boolean }[] = [
  { key: 'food', label: '食費', step: 5000, suffix: '円/月', isMonthly: true },
  { key: 'utilities', label: '光熱・通信', step: 1000, suffix: '円/月', isMonthly: true },
  { key: 'transportation', label: '交通費', step: 1000, suffix: '円/月', isMonthly: true },
  { key: 'clothing', label: '被服費', step: 1000, suffix: '円/月', isMonthly: true },
  { key: 'medical', label: '医療費', step: 1000, suffix: '円/月', isMonthly: true },
  { key: 'entertainment', label: '娯楽・交際', step: 1000, suffix: '円/月', isMonthly: true },
  { key: 'education', label: '自己投資', step: 1000, suffix: '円/月', isMonthly: true },
  { key: 'miscellaneous', label: '日用品・雑費', step: 1000, suffix: '円/月', isMonthly: true },
  { key: 'otherMonthly', label: 'その他月額', step: 1000, suffix: '円/月', isMonthly: true },
  { key: 'annualSpecial', label: '年間特別支出', step: 10000, suffix: '円/年', isMonthly: false },
  { key: 'inflationRate', label: 'インフレ率', step: 0.1, suffix: '%', isMonthly: false },
];

function monthlyTotal(e: Expenses): number {
  return FIELDS.filter(f => f.isMonthly).reduce((s, f) => s + (e[f.key] as number), 0);
}

function fmtMan(v: number) {
  return `${(v / 10000).toFixed(1)}万`;
}

function newPhase(startAge: number, base?: Expenses): ExpensePhase {
  return {
    id: `ep-${Date.now()}`,
    name: '新しいフェーズ',
    startAge,
    expenses: { ...(base ?? defaultExpenses) },
  };
}

// === 比較テーブルビュー ===
function ComparisonTable({ phases, onUpdate, onRemove, onAdd }: {
  phases: ExpensePhase[];
  onUpdate: (index: number, phase: ExpensePhase) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...phases].sort((a, b) => a.startAge - b.startAge);

  // 使われている項目(全フェーズで1つでも>0)
  const activeFields = FIELDS.filter(f =>
    f.key === 'inflationRate' || f.key === 'annualSpecial' || sorted.some(p => (p.expenses[f.key] as number) > 0)
  );
  const displayFields = showAll ? FIELDS : activeFields;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="text-xs w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left px-2 py-1.5 text-gray-400 font-normal w-28"></th>
              {sorted.map((p) => {
                const origIdx = phases.findIndex(ph => ph.id === p.id);
                return (
                  <th key={p.id} className="px-2 py-1.5 text-center min-w-[120px]">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => onUpdate(origIdx, { ...p, name: e.target.value })}
                      className="text-xs font-semibold text-center border-b border-transparent hover:border-gray-300 focus:border-blue-400 outline-none w-full bg-transparent"
                    />
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <input
                        type="number"
                        value={p.startAge}
                        onChange={(e) => onUpdate(origIdx, { ...p, startAge: Number(e.target.value) })}
                        className="w-10 text-center text-[10px] text-gray-400 border border-gray-200 rounded px-1 py-0"
                      />
                      <span className="text-[10px] text-gray-300">歳〜</span>
                      <button onClick={() => onRemove(origIdx)} className="text-gray-300 hover:text-red-500 text-[10px] ml-1">x</button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {displayFields.map((field, fi) => {
              const prevValues = sorted.map(p => p.expenses[field.key] as number);
              return (
                <tr key={field.key} className={fi % 2 === 0 ? 'bg-gray-50/50' : ''}>
                  <td className="px-2 py-1 text-[11px] text-gray-500 whitespace-nowrap">{field.label}</td>
                  {sorted.map((p, pi) => {
                    const origIdx = phases.findIndex(ph => ph.id === p.id);
                    const val = p.expenses[field.key] as number;
                    const prevVal = pi > 0 ? prevValues[pi - 1] : val;
                    const changed = pi > 0 && val !== prevVal;
                    return (
                      <td key={p.id} className="px-1 py-0.5 text-center">
                        <input
                          type="number"
                          value={val}
                          onChange={(e) => {
                            const newExp = { ...p.expenses, [field.key]: Number(e.target.value) };
                            onUpdate(origIdx, { ...p, expenses: newExp });
                          }}
                          step={field.step}
                          className={`w-full text-xs text-right px-1.5 py-0.5 rounded border outline-none transition-colors ${
                            changed
                              ? 'border-blue-300 bg-blue-50 font-semibold text-blue-700'
                              : 'border-gray-200 bg-white text-gray-600'
                          } focus:border-blue-400`}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* 月額合計行 */}
            <tr className="border-t-2 border-gray-300">
              <td className="px-2 py-1.5 text-[11px] font-semibold text-gray-700">月額合計</td>
              {sorted.map((p) => (
                <td key={p.id} className="px-1 py-1.5 text-center text-xs font-bold text-gray-800">
                  {fmtMan(monthlyTotal(p.expenses))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onAdd} className="text-xs text-blue-500 hover:underline">+ フェーズ追加</button>
        {activeFields.length < FIELDS.length && (
          <button onClick={() => setShowAll(!showAll)} className="text-[11px] text-gray-400 hover:text-gray-600">
            {showAll ? '使用中の項目だけ表示' : `全項目を表示(${FIELDS.length - activeFields.length}件非表示)`}
          </button>
        )}
      </div>
    </div>
  );
}

// === メインパネル ===
export function ExpensePanel() {
  const config = useStore((s) => s.config);
  const updateExpenses = useStore((s) => s.updateExpenses);
  const addExpensePhase = useStore((s) => s.addExpensePhase);
  const updateExpensePhase = useStore((s) => s.updateExpensePhase);
  const removeExpensePhase = useStore((s) => s.removeExpensePhase);

  const phases = config.expensePhases ?? [];
  const hasPhases = phases.length > 0;
  const [showAllSingle, setShowAllSingle] = useState(false);

  if (!hasPhases) {
    // 従来の単一支出設定
    const activeFields = FIELDS.filter(f => (config.expenses[f.key] as number) > 0 || f.key === 'inflationRate');
    const display = showAllSingle ? FIELDS : activeFields;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400">月額合計: <span className="font-semibold text-gray-600">{fmtMan(monthlyTotal(config.expenses))}</span></span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {display.map((f) => (
            <NumberField
              key={f.key}
              label={f.label}
              value={config.expenses[f.key] as number}
              onChange={(v) => updateExpenses({ [f.key]: v })}
              step={f.step}
              suffix={f.suffix}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              addExpensePhase({
                id: `ep-${Date.now()}`,
                name: '現在',
                startAge: config.profile.currentAge,
                expenses: { ...config.expenses },
              });
            }}
            className="text-xs text-blue-500 hover:underline"
          >
            + 支出フェーズに切り替える
          </button>
          {activeFields.length < FIELDS.length && (
            <button onClick={() => setShowAllSingle(!showAllSingle)} className="text-[11px] text-gray-400 hover:text-gray-600">
              {showAllSingle ? '使用中の項目だけ' : `全項目(${FIELDS.length - activeFields.length}件非表示)`}
            </button>
          )}
        </div>
      </div>
    );
  }

  // フェーズモード: 比較テーブル
  return (
    <ComparisonTable
      phases={phases}
      onUpdate={updateExpensePhase}
      onRemove={removeExpensePhase}
      onAdd={() => {
        const sorted = [...phases].sort((a, b) => a.startAge - b.startAge);
        const last = sorted[sorted.length - 1];
        addExpensePhase(newPhase(last ? last.startAge + 10 : 40, last?.expenses));
      }}
    />
  );
}
