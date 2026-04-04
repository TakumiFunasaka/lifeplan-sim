'use client';

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { YearlyResult } from '@/lib/types';

const fmt = (v: number) => {
  if (Math.abs(v) >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}億`;
  if (Math.abs(v) >= 10_000) return `${Math.round(v / 10_000)}万`;
  return String(v);
};

interface Props {
  data: YearlyResult[];
  retirementAge: number;
}

export function CashflowChart({ data, retirementAge }: Props) {
  const chartData = data.map((d) => ({
    age: d.age,
    収入: d.totalIncome + (d.rentalNetIncome > 0 ? d.rentalNetIncome : 0),
    支出: -(d.totalExpenses + (d.rentalNetIncome < 0 ? Math.abs(d.rentalNetIncome) : 0)),
    収支: d.annualCashflow,
  }));

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">年間収支</h3>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="age" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={60} />
          <Tooltip
            formatter={(value, name) => {
              const v = Number(value);
              return [fmt(v) + '円', name];
            }}
            labelFormatter={(label) => `${label}歳`}
          />
          <Legend />
          <ReferenceLine x={retirementAge} stroke="#ef4444" strokeDasharray="3 3" />
          <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1.5} />
          <Bar dataKey="収入" fill="#34d399" fillOpacity={0.7} />
          <Bar dataKey="支出" fill="#f87171" fillOpacity={0.7} />
          <Line type="monotone" dataKey="収支" stroke="#2563eb" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
