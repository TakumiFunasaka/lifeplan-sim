'use client';

import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
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

export function AssetChart({ data, retirementAge }: Props) {
  const chartData = data.map((d) => ({
    age: d.age,
    現金: d.cashSavings,
    投資: d.investmentBalance,
    総資産: d.totalAssets,
    純資産: d.netWorth,
  }));

  // Y軸のdomainを自動計算(マイナスも含む)
  const allValues = chartData.flatMap(d => [d.現金, d.投資, d.総資産, d.純資産]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const padding = Math.abs(maxVal - minVal) * 0.05;

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">資産推移</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: '年齢', position: 'insideBottomRight', offset: -5, fontSize: 11 }} />
          <YAxis
            tickFormatter={fmt}
            tick={{ fontSize: 11 }}
            width={60}
            domain={[Math.floor((minVal - padding) / 10000) * 10000, 'auto']}
          />
          <Tooltip
            formatter={(value, name) => [fmt(Number(value)) + '円', name]}
            labelFormatter={(label) => `${label}歳`}
          />
          <Legend />
          <ReferenceLine x={retirementAge} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '退職', fill: '#ef4444', fontSize: 11 }} />
          <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1.5} />
          <Area type="monotone" dataKey="総資産" fill="#2563eb" fillOpacity={0.1} stroke="none" legendType="none" tooltipType="none" />
          <Line type="monotone" dataKey="現金" stroke="#34d399" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="投資" stroke="#818cf8" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="総資産" stroke="#2563eb" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="純資産" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
