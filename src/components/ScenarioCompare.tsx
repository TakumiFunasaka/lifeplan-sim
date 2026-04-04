'use client';

import { useRef } from 'react';
import { useStore } from '@/hooks/use-store';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { SimulationResult, SimulationSummary } from '@/lib/types';

const fmt = (v: number) => {
  if (Math.abs(v) >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}億`;
  if (Math.abs(v) >= 10_000) return `${Math.round(v / 10_000)}万`;
  return String(v);
};

const fmtM = (v: number) => `${Math.round(v / 10_000).toLocaleString()}万`;

function SummaryDiff({ a, b, nameA, nameB }: { a: SimulationSummary; b: SimulationSummary; nameA: string; nameB: string }) {
  const rows: { label: string; valA: number; valB: number }[] = [
    { label: '退職時 純資産', valA: a.retirementNetWorth, valB: b.retirementNetWorth },
    { label: '100歳時 純資産', valA: a.endNetWorth, valB: b.endNetWorth },
    { label: '資産最低額', valA: a.assetBottomAmount, valB: b.assetBottomAmount },
    { label: 'ローン利息合計', valA: a.totalMortgageInterest, valB: b.totalMortgageInterest },
    { label: '教育費合計', valA: a.totalEducationCost, valB: b.totalEducationCost },
    { label: '投資利益合計', valA: a.totalInvestmentGain, valB: b.totalInvestmentGain },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="text-xs w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border px-3 py-1.5 text-left">指標</th>
            <th className="border px-3 py-1.5 text-right text-blue-600">{nameA}</th>
            <th className="border px-3 py-1.5 text-right text-orange-600">{nameB}</th>
            <th className="border px-3 py-1.5 text-right">差額</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const diff = r.valA - r.valB;
            return (
              <tr key={r.label}>
                <td className="border px-3 py-1.5">{r.label}</td>
                <td className="border px-3 py-1.5 text-right">{fmtM(r.valA)}</td>
                <td className="border px-3 py-1.5 text-right">{fmtM(r.valB)}</td>
                <td className={`border px-3 py-1.5 text-right font-semibold ${diff > 0 ? 'text-blue-600' : diff < 0 ? 'text-orange-600' : ''}`}>
                  {diff > 0 ? '+' : ''}{fmtM(diff)}
                </td>
              </tr>
            );
          })}
          <tr>
            <td className="border px-3 py-1.5">資産枯渇年齢</td>
            <td className="border px-3 py-1.5 text-right">{a.negativeAge ? `${a.negativeAge}歳` : 'なし'}</td>
            <td className="border px-3 py-1.5 text-right">{b.negativeAge ? `${b.negativeAge}歳` : 'なし'}</td>
            <td className="border px-3 py-1.5 text-right">-</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function ScenarioCompare() {
  const result = useStore((s) => s.result);
  const compareScenario = useStore((s) => s.compareScenario);
  const loadCompareScenario = useStore((s) => s.loadCompareScenario);
  const clearCompareScenario = useStore((s) => s.clearCompareScenario);
  const retirementAge = useStore((s) => s.config.profile.retirementAge);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.replace(/\.json$/, '');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const ok = loadCompareScenario(text, name);
      if (!ok) alert('比較シナリオの読み込みに失敗しました。');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!result) return null;

  // 比較シナリオ未読み込み
  if (!compareScenario) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <h3 className="text-sm font-semibold mb-2">シナリオ比較</h3>
        <p className="text-xs text-gray-500 mb-3">別のシナリオのJSONを読み込んで、現在の設定と並べて比較できます</p>
        <input ref={fileRef} type="file" accept=".json" onChange={handleLoad} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="text-sm px-4 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          比較シナリオを読み込む
        </button>
      </div>
    );
  }

  const nameA = '現在の設定';
  const nameB = compareScenario.name;
  const dataA = result.yearly;
  const dataB = compareScenario.result.yearly;

  // チャートデータ: 年齢をキーにマージ
  const chartData = dataA.map((a) => {
    const b = dataB.find((d) => d.age === a.age);
    return {
      age: a.age,
      [`純資産(${nameA})`]: a.netWorth,
      [`純資産(${nameB})`]: b?.netWorth ?? null,
      [`総資産(${nameA})`]: a.totalAssets,
      [`総資産(${nameB})`]: b?.totalAssets ?? null,
      [`収支(${nameA})`]: a.annualCashflow,
      [`収支(${nameB})`]: b?.annualCashflow ?? null,
    };
  });

  const allVals = chartData.flatMap(d => Object.values(d).filter((v): v is number => typeof v === 'number' && d.age !== v));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">シナリオ比較: <span className="text-blue-600">{nameA}</span> vs <span className="text-orange-600">{nameB}</span></h3>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".json" onChange={handleLoad} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">別のシナリオに変更</button>
          <button onClick={clearCompareScenario} className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">比較を解除</button>
        </div>
      </div>

      <SummaryDiff a={result.summary} b={compareScenario.result.summary} nameA={nameA} nameB={nameB} />

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
            <Line type="monotone" dataKey={`純資産(${nameA})`} stroke="#2563eb" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey={`純資産(${nameB})`} stroke="#f97316" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey={`総資産(${nameA})`} stroke="#2563eb" strokeWidth={1} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey={`総資産(${nameB})`} stroke="#f97316" strokeWidth={1} strokeDasharray="5 5" dot={false} />
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
            <Line type="monotone" dataKey={`収支(${nameA})`} stroke="#2563eb" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey={`収支(${nameB})`} stroke="#f97316" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 年次差分テーブル */}
      <div>
        <h4 className="text-xs font-semibold text-gray-600 mb-1">年次比較(5年毎)</h4>
        <div className="overflow-x-auto">
          <table className="text-xs w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-2 py-1">年齢</th>
                <th className="border px-2 py-1 text-blue-600">収支A</th>
                <th className="border px-2 py-1 text-orange-600">収支B</th>
                <th className="border px-2 py-1 text-blue-600">純資産A</th>
                <th className="border px-2 py-1 text-orange-600">純資産B</th>
                <th className="border px-2 py-1">差(A-B)</th>
                <th className="border px-2 py-1 text-blue-600">住居費A</th>
                <th className="border px-2 py-1 text-orange-600">住居費B</th>
              </tr>
            </thead>
            <tbody>
              {dataA.filter((_, i) => i % 5 === 0 || i === dataA.length - 1).map((a) => {
                const b = dataB.find((d) => d.age === a.age);
                const diff = a.netWorth - (b?.netWorth ?? 0);
                return (
                  <tr key={a.age} className={a.age % 10 === 0 ? 'bg-blue-50/30' : ''}>
                    <td className="border px-2 py-1 font-semibold">{a.age}</td>
                    <td className={`border px-2 py-1 text-right ${a.annualCashflow < 0 ? 'text-red-600' : ''}`}>{fmtM(a.annualCashflow)}</td>
                    <td className={`border px-2 py-1 text-right ${(b?.annualCashflow ?? 0) < 0 ? 'text-red-600' : ''}`}>{b ? fmtM(b.annualCashflow) : '-'}</td>
                    <td className="border px-2 py-1 text-right">{fmtM(a.netWorth)}</td>
                    <td className="border px-2 py-1 text-right">{b ? fmtM(b.netWorth) : '-'}</td>
                    <td className={`border px-2 py-1 text-right font-semibold ${diff > 0 ? 'text-blue-600' : diff < 0 ? 'text-orange-600' : ''}`}>
                      {diff > 0 ? '+' : ''}{fmtM(diff)}
                    </td>
                    <td className="border px-2 py-1 text-right">{fmtM(a.housingCost)}</td>
                    <td className="border px-2 py-1 text-right">{b ? fmtM(b.housingCost) : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
