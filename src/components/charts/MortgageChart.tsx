'use client';

import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { YearlyResult } from '@/lib/types';

const fmt = (v: number) => {
  if (Math.abs(v) >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}億`;
  if (Math.abs(v) >= 10_000) return `${Math.round(v / 10_000)}万`;
  return String(v);
};

interface Props {
  data: YearlyResult[];
}

export function MortgageChart({ data }: Props) {
  const mortgageData = data.filter((d) => d.mortgageBalance > 0 || d.mortgagePayment > 0);
  if (mortgageData.length === 0) return null;

  const chartData = mortgageData.map((d) => ({
    age: d.age,
    残高: d.mortgageBalance,
    元金: d.mortgagePrincipal,
    利息: d.mortgageInterest,
  }));

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">住宅ローン返済推移</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="age" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={60} />
          <Tooltip
            formatter={(value, name) => [fmt(Number(value)) + '円', name]}
            labelFormatter={(label) => `${label}歳`}
          />
          <Legend />
          <Area type="monotone" dataKey="残高" fill="#fbbf24" fillOpacity={0.2} stroke="#f59e0b" strokeWidth={2} />
          <Bar dataKey="元金" stackId="payment" fill="#60a5fa" />
          <Bar dataKey="利息" stackId="payment" fill="#f87171" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
