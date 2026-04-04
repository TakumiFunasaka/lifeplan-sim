'use client';

import { useRef } from 'react';
import { useStore } from '@/hooks/use-store';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { SimulationResult } from '@/lib/types';

const COLORS = ['#2563eb', '#f97316', '#10b981', '#ef4444'];
const COLOR_NAMES = ['blue', 'orange', 'emerald', 'red'];

const fmt = (v: number) => {
  if (Math.abs(v) >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}億`;
  if (Math.abs(v) >= 10_000) return `${Math.round(v / 10_000)}万`;
  return String(v);
};

const fmtM = (v: number) => `${Math.round(v / 10_000).toLocaleString()}万`;

interface Scenario {
  name: string;
  result: SimulationResult;
}

export function ScenarioCompare() {
  const result = useStore((s) => s.result);
  const compareScenarios = useStore((s) => s.compareScenarios);
  const addCompareScenario = useStore((s) => s.addCompareScenario);
  const removeCompareScenario = useStore((s) => s.removeCompareScenario);
  const clearCompareScenarios = useStore((s) => s.clearCompareScenarios);
  const retirementAge = useStore((s) => s.config.profile.retirementAge);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.replace(/\.json$/, '');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const ok = addCompareScenario(text, name);
      if (!ok) alert('シナリオの読み込みに失敗しました。');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!result) return null;

  const scenarios: Scenario[] = [
    { name: '現在の設定', result },
    ...compareScenarios,
  ];

  const hasComparisons = compareScenarios.length > 0;

  // チャートデータ
  const baseData = result.yearly;
  const chartData = baseData.map((a) => {
    const row: Record<string, number | null> = { age: a.age };
    for (let si = 0; si < scenarios.length; si++) {
      const s = scenarios[si];
      const d = s.result.yearly.find((y) => y.age === a.age);
      row[`純資産_${si}`] = d?.netWorth ?? null;
      row[`収支_${si}`] = d?.annualCashflow ?? null;
      row[`住居費_${si}`] = d?.housingCost ?? null;
    }
    return row;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-sm font-semibold">シナリオ比較</h3>
        <div className="flex gap-2 items-center">
          <input ref={fileRef} type="file" accept=".json" onChange={handleLoad} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            + 比較シナリオ追加
          </button>
          {hasComparisons && (
            <button onClick={clearCompareScenarios} className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
              全解除
            </button>
          )}
        </div>
      </div>

      {/* シナリオ一覧 */}
      <div className="flex flex-wrap gap-2">
        {scenarios.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded" style={{ backgroundColor: COLORS[i] + '15', borderLeft: `3px solid ${COLORS[i]}` }}>
            <span style={{ color: COLORS[i] }} className="font-semibold">{s.name}</span>
            {i > 0 && (
              <button onClick={() => removeCompareScenario(i - 1)} className="text-gray-400 hover:text-red-500 ml-1">×</button>
            )}
          </div>
        ))}
      </div>

      {!hasComparisons && (
        <p className="text-xs text-gray-400 text-center py-4">比較シナリオのJSONを追加してください（最大3つ）</p>
      )}

      {hasComparisons && (
        <>
          {/* サマリー比較テーブル */}
          <div className="overflow-x-auto">
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-1.5 text-left">指標</th>
                  {scenarios.map((s, i) => (
                    <th key={i} className="border px-3 py-1.5 text-right" style={{ color: COLORS[i] }}>{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: '退職時 純資産', key: 'retirementNetWorth' as const },
                  { label: '100歳時 純資産', key: 'endNetWorth' as const },
                  { label: '資産最低額', key: 'assetBottomAmount' as const },
                  { label: 'ローン利息合計', key: 'totalMortgageInterest' as const },
                  { label: '投資利益合計', key: 'totalInvestmentGain' as const },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="border px-3 py-1.5">{row.label}</td>
                    {scenarios.map((s, i) => (
                      <td key={i} className="border px-3 py-1.5 text-right">{fmtM(s.result.summary[row.key])}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="border px-3 py-1.5">資産最低年齢</td>
                  {scenarios.map((s, i) => (
                    <td key={i} className="border px-3 py-1.5 text-right">{s.result.summary.assetBottomAge}歳</td>
                  ))}
                </tr>
                <tr>
                  <td className="border px-3 py-1.5">資産枯渇年齢</td>
                  {scenarios.map((s, i) => (
                    <td key={i} className={`border px-3 py-1.5 text-right ${s.result.summary.negativeAge ? 'text-red-600 font-semibold' : ''}`}>
                      {s.result.summary.negativeAge ? `${s.result.summary.negativeAge}歳` : 'なし'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* 純資産比較チャート */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 mb-1">純資産の推移比較</h4>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={60} />
                <Tooltip formatter={(value, name) => [fmt(Number(value)) + '円', name]} labelFormatter={(l) => `${l}歳`} />
                <Legend />
                <ReferenceLine x={retirementAge} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke="#6b7280" />
                {scenarios.map((s, i) => (
                  <Line key={i} type="monotone" dataKey={`純資産_${i}`} name={s.name} stroke={COLORS[i]} strokeWidth={2} dot={false} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* 年間収支比較チャート */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 mb-1">年間収支の比較</h4>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={60} />
                <Tooltip formatter={(value, name) => [fmt(Number(value)) + '円', name]} labelFormatter={(l) => `${l}歳`} />
                <Legend />
                <ReferenceLine x={retirementAge} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke="#6b7280" />
                {scenarios.map((s, i) => (
                  <Line key={i} type="monotone" dataKey={`収支_${i}`} name={s.name} stroke={COLORS[i]} strokeWidth={2} dot={false} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* 年次比較テーブル */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 mb-1">年次比較(5年毎)</h4>
            <div className="overflow-x-auto">
              <table className="text-xs w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border px-2 py-1">年齢</th>
                    {scenarios.map((s, i) => (
                      <th key={`cf-${i}`} className="border px-2 py-1" style={{ color: COLORS[i] }}>収支</th>
                    ))}
                    {scenarios.map((s, i) => (
                      <th key={`nw-${i}`} className="border px-2 py-1" style={{ color: COLORS[i] }}>純資産</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {baseData.filter((_, i) => i % 5 === 0 || i === baseData.length - 1).map((a) => (
                    <tr key={a.age} className={a.age % 10 === 0 ? 'bg-blue-50/30' : ''}>
                      <td className="border px-2 py-1 font-semibold">{a.age}</td>
                      {scenarios.map((s, i) => {
                        const d = s.result.yearly.find((y) => y.age === a.age);
                        const cf = d?.annualCashflow ?? 0;
                        return <td key={`cf-${i}`} className={`border px-2 py-1 text-right ${cf < 0 ? 'text-red-600' : ''}`}>{d ? fmtM(cf) : '-'}</td>;
                      })}
                      {scenarios.map((s, i) => {
                        const d = s.result.yearly.find((y) => y.age === a.age);
                        const nw = d?.netWorth ?? 0;
                        return <td key={`nw-${i}`} className={`border px-2 py-1 text-right ${nw < 0 ? 'text-red-600' : ''}`}>{d ? fmtM(nw) : '-'}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
