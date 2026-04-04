'use client';

import { useState } from 'react';
import { YearlyResult } from '@/lib/types';

const fmtK = (v: number) => {
  const m = Math.round(v / 1000);
  return `¥${m.toLocaleString()}k`;
};
const fmtE = (v: number) => `¥${Math.round(v).toLocaleString()}`;

interface Props {
  data: YearlyResult[];
  retirementAge: number;
}

export function MonthlyPL({ data, retirementAge }: Props) {
  const [selectedAge, setSelectedAge] = useState(data[0]?.age ?? 31);
  const yearIdx = data.findIndex((d) => d.age === selectedAge);
  const year = data[yearIdx];
  const prevYear = yearIdx > 0 ? data[yearIdx - 1] : null;
  if (!year) return null;

  const monthly = (v: number) => Math.round(v / 12);

  // 収入
  const incomeItems: { label: string; annual: number }[] = [];
  for (const [k, v] of Object.entries(year.incomeBreakdown)) {
    if (v > 0) incomeItems.push({ label: k, annual: v });
  }
  if (year.rentalNetIncome > 0) {
    incomeItems.push({ label: '不動産収益', annual: year.rentalNetIncome });
  }
  const totalIncomeAnnual = incomeItems.reduce((s, i) => s + i.annual, 0);

  // 支出
  const expenseItems: { label: string; annual: number }[] = [];
  for (const [k, v] of Object.entries(year.expenseBreakdown)) {
    if (v > 0) expenseItems.push({ label: k, annual: v });
  }
  if (year.rentalNetIncome < 0) {
    expenseItems.push({ label: '不動産持ち出し', annual: Math.abs(year.rentalNetIncome) });
  }
  const totalExpenseAnnual = expenseItems.reduce((s, i) => s + i.annual, 0);

  // 投資積立(年間収支から逆算)
  const investContrib = totalIncomeAnnual - totalExpenseAnnual - year.annualCashflow;
  const surplus = year.annualCashflow;

  // 投資運用益(今年の投資残高 - 前年の投資残高 - 今年の積立額)
  const prevInvestBal = prevYear?.investmentBalance ?? 0;
  const investGain = year.investmentBalance - prevInvestBal - Math.max(0, investContrib);

  // 総合収支(キャッシュ収支 + 運用益)
  const totalPL = surplus + investGain;

  const isRetired = selectedAge >= retirementAge;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">月次PL</h3>
          {isRetired && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">退職後</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold w-10 text-right">{selectedAge}歳</span>
          <input
            type="range"
            min={data[0]?.age ?? 31}
            max={data[data.length - 1]?.age ?? 100}
            value={selectedAge}
            onChange={(e) => setSelectedAge(Number(e.target.value))}
            className="w-48"
          />
        </div>
      </div>

      {year.eventLabels.length > 0 && (
        <div className="text-xs text-orange-600 mb-2">
          {year.eventLabels.join(' / ')}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 収入 */}
        <div className="border rounded p-3">
          <h4 className="text-xs font-semibold text-green-700 mb-2">収入</h4>
          <div className="space-y-1">
            {incomeItems.map((item) => (
              <div key={item.label} className="flex justify-between text-xs">
                <span className="text-gray-600">{item.label}</span>
                <span>{fmtE(monthly(item.annual))}</span>
              </div>
            ))}
            <div className="border-t pt-1 flex justify-between text-xs font-semibold text-green-700">
              <span>月収合計</span>
              <span>{fmtE(monthly(totalIncomeAnnual))}</span>
            </div>
          </div>
        </div>

        {/* 支出 */}
        <div className="border rounded p-3">
          <h4 className="text-xs font-semibold text-red-700 mb-2">支出</h4>
          <div className="space-y-1">
            {expenseItems.map((item) => (
              <div key={item.label} className="flex justify-between text-xs">
                <span className="text-gray-600">{item.label}</span>
                <span>{fmtE(monthly(item.annual))}</span>
              </div>
            ))}
            {investContrib > 0 && (
              <div className="flex justify-between text-xs text-blue-600">
                <span>投資積立</span>
                <span>{fmtE(monthly(investContrib))}</span>
              </div>
            )}
            <div className="border-t pt-1 flex justify-between text-xs font-semibold text-red-700">
              <span>月支出合計</span>
              <span>{fmtE(monthly(totalExpenseAnnual + Math.max(0, investContrib)))}</span>
            </div>
          </div>
        </div>

        {/* 月次サマリー */}
        <div className="border rounded p-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">月次収支</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">月収入</span>
              <span className="text-green-700">{fmtE(monthly(totalIncomeAnnual))}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">月支出+積立</span>
              <span className="text-red-700">-{fmtE(monthly(totalExpenseAnnual + Math.max(0, investContrib)))}</span>
            </div>
            <div className={`border-t pt-1 flex justify-between text-xs ${surplus >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              <span>キャッシュ収支</span>
              <span>{surplus >= 0 ? '+' : ''}{fmtE(monthly(surplus))}</span>
            </div>

            {/* 運用益 */}
            <div className={`flex justify-between text-xs ${investGain >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              <span>投資運用益</span>
              <span>{investGain >= 0 ? '+' : ''}{fmtE(monthly(investGain))}</span>
            </div>

            <div className={`border-t pt-1 flex justify-between text-sm font-bold ${totalPL >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              <span>総合損益(月)</span>
              <span>{totalPL >= 0 ? '+' : ''}{fmtE(monthly(totalPL))}</span>
            </div>

            <div className="border-t pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>現金残高</span>
                <span>{fmtK(year.cashSavings)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>投資残高</span>
                <span>{fmtK(year.investmentBalance)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>ローン残高</span>
                <span>{year.mortgageBalance > 0 ? `-${fmtK(year.mortgageBalance)}` : '-'}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span>純資産</span>
                <span className={year.netWorth < 0 ? 'text-red-600' : ''}>{fmtK(year.netWorth)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
