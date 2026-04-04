'use client';

import { SimulationSummary } from '@/lib/types';

const fmt = (v: number) => {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(2)}億円`;
  return `${sign}${Math.round(abs / 10_000).toLocaleString()}万円`;
};

interface Props {
  summary: SimulationSummary;
}

export function Summary({ summary }: Props) {
  const items: { label: string; value: string; warn?: boolean }[] = [
    { label: '退職時 総資産', value: fmt(summary.retirementAssets) },
    { label: '退職時 純資産', value: fmt(summary.retirementNetWorth) },
    { label: `${100}歳時 総資産`, value: fmt(summary.endAssets), warn: summary.endAssets < 0 },
    { label: `${100}歳時 純資産`, value: fmt(summary.endNetWorth), warn: summary.endNetWorth < 0 },
    { label: '資産最低額', value: `${summary.assetBottomAge}歳: ${fmt(summary.assetBottomAmount)}`, warn: summary.assetBottomAmount < 0 },
    { label: '住宅ローン利息合計', value: fmt(summary.totalMortgageInterest) },
    { label: '保険料合計', value: fmt(summary.totalInsurancePremium) },
    { label: '教育費合計', value: fmt(summary.totalEducationCost) },
    { label: '投資利益合計', value: fmt(summary.totalInvestmentGain) },
  ];

  if (summary.negativeAge !== null) {
    items.push({ label: '資産枯渇年齢', value: `${summary.negativeAge}歳`, warn: true });
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">サマリー</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {items.map((item) => (
          <div key={item.label} className={`rounded p-3 text-center ${item.warn ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
            <div className="text-xs text-gray-500">{item.label}</div>
            <div className={`text-sm font-bold mt-1 ${item.warn ? 'text-red-600' : ''}`}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
