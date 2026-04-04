'use client';

import { SimulationSummary } from '@/lib/types';

const fmt = (v: number) => {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(2)}億`;
  return `${sign}${Math.round(abs / 10_000).toLocaleString()}万`;
};

interface Props {
  summary: SimulationSummary;
}

export function Summary({ summary }: Props) {
  const hasNegative = summary.negativeAge !== null;

  return (
    <div>
      {/* メイン指標 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div className={`rounded-lg p-4 ${hasNegative ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-100'}`}>
          <div className="text-[11px] text-gray-500">退職時 純資産</div>
          <div className="text-xl font-bold mt-1">{fmt(summary.retirementNetWorth)}</div>
        </div>
        <div className={`rounded-lg p-4 ${summary.endNetWorth < 0 ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-100'}`}>
          <div className="text-[11px] text-gray-500">100歳時 純資産</div>
          <div className={`text-xl font-bold mt-1 ${summary.endNetWorth < 0 ? 'text-red-600' : ''}`}>{fmt(summary.endNetWorth)}</div>
        </div>
        <div className={`rounded-lg p-4 ${summary.assetBottomAmount < 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
          <div className="text-[11px] text-gray-500">資産最低</div>
          <div className={`text-lg font-bold mt-1 ${summary.assetBottomAmount < 0 ? 'text-red-600' : ''}`}>{fmt(summary.assetBottomAmount)}</div>
          <div className="text-[11px] text-gray-400">{summary.assetBottomAge}歳時点</div>
        </div>
        {hasNegative ? (
          <div className="rounded-lg p-4 bg-red-600 text-white">
            <div className="text-[11px] opacity-80">資産枯渇</div>
            <div className="text-xl font-bold mt-1">{summary.negativeAge}歳</div>
          </div>
        ) : (
          <div className="rounded-lg p-4 bg-emerald-50 border border-emerald-100">
            <div className="text-[11px] text-gray-500">資産枯渇</div>
            <div className="text-lg font-bold mt-1 text-emerald-600">なし</div>
          </div>
        )}
      </div>

      {/* サブ指標 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: '退職時 総資産', value: fmt(summary.retirementAssets) },
          { label: 'ローン利息合計', value: fmt(summary.totalMortgageInterest) },
          { label: '保険料合計', value: fmt(summary.totalInsurancePremium) },
          { label: '教育費合計', value: fmt(summary.totalEducationCost) },
          { label: '投資利益合計', value: fmt(summary.totalInvestmentGain) },
        ].map((item) => (
          <div key={item.label} className="rounded-md bg-gray-50 px-3 py-2">
            <div className="text-[11px] text-gray-400">{item.label}</div>
            <div className="text-sm font-semibold mt-0.5">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
