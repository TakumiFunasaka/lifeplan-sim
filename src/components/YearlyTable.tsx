'use client';

import { useState } from 'react';
import { YearlyResult } from '@/lib/types';

const fmtM = (v: number) => `${Math.round(v / 10_000).toLocaleString()}万`;

interface Props {
  data: YearlyResult[];
}

export function YearlyTable({ data }: Props) {
  const [expanded, setExpanded] = useState(false);
  const display = expanded ? data : data.filter((_, i) => i % 5 === 0 || i === data.length - 1);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">年次データ</h3>
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-500 hover:underline">
          {expanded ? '5年毎に表示' : '全年表示'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-2 py-1 sticky left-0 bg-gray-50">年齢</th>
              <th className="border px-2 py-1">額面収入</th>
              <th className="border px-2 py-1">手取計</th>
              <th className="border px-2 py-1">年金</th>
              <th className="border px-2 py-1">生活費</th>
              <th className="border px-2 py-1">住居費</th>
              <th className="border px-2 py-1">教育費</th>
              <th className="border px-2 py-1">保険料</th>
              <th className="border px-2 py-1">支出計</th>
              <th className="border px-2 py-1">年間収支</th>
              <th className="border px-2 py-1">現金</th>
              <th className="border px-2 py-1">投資</th>
              <th className="border px-2 py-1">総資産</th>
              <th className="border px-2 py-1">ローン残</th>
              <th className="border px-2 py-1">純資産</th>
              <th className="border px-2 py-1">イベント</th>
            </tr>
          </thead>
          <tbody>
            {display.map((d) => (
              <tr key={d.age} className={d.totalAssets < 0 ? 'bg-red-50' : d.age % 10 === 0 ? 'bg-blue-50/30' : ''}>
                <td className="border px-2 py-1 sticky left-0 bg-inherit font-semibold">{d.age}</td>
                <td className="border px-2 py-1 text-right">{fmtM(d.grossIncome)}</td>
                <td className="border px-2 py-1 text-right">{fmtM(d.totalIncome)}</td>
                <td className="border px-2 py-1 text-right">{fmtM(d.pensionIncome)}</td>
                <td className="border px-2 py-1 text-right">{fmtM(d.livingExpenses)}</td>
                <td className="border px-2 py-1 text-right">{fmtM(d.housingCost)}</td>
                <td className="border px-2 py-1 text-right">{fmtM(d.childEducationCost)}</td>
                <td className="border px-2 py-1 text-right">{fmtM(d.insurancePremium)}</td>
                <td className="border px-2 py-1 text-right">{fmtM(d.totalExpenses)}</td>
                <td className={`border px-2 py-1 text-right ${d.annualCashflow < 0 ? 'text-red-600' : ''}`}>{fmtM(d.annualCashflow)}</td>
                <td className="border px-2 py-1 text-right">{fmtM(d.cashSavings)}</td>
                <td className="border px-2 py-1 text-right">{fmtM(d.investmentBalance)}</td>
                <td className={`border px-2 py-1 text-right font-semibold ${d.totalAssets < 0 ? 'text-red-600' : ''}`}>{fmtM(d.totalAssets)}</td>
                <td className="border px-2 py-1 text-right">{fmtM(d.mortgageBalance)}</td>
                <td className={`border px-2 py-1 text-right ${d.netWorth < 0 ? 'text-red-600' : ''}`}>{fmtM(d.netWorth)}</td>
                <td className="border px-2 py-1 text-xs">{d.eventLabels.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
