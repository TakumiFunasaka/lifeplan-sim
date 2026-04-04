'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { YearlyResult } from '@/lib/types';

const fmt = (v: number) => {
  if (Math.abs(v) >= 10_000) return `${Math.round(v / 10_000)}万`;
  return String(v);
};

const COLORS: Record<string, string> = {
  '食費': '#34d399',
  '光熱・通信': '#60a5fa',
  '交通費': '#a78bfa',
  '被服': '#f472b6',
  '医療': '#fb923c',
  '娯楽': '#facc15',
  '自己投資': '#2dd4bf',
  '雑費': '#94a3b8',
  '特別支出': '#c084fc',
  '住居費': '#f87171',
  '教育費': '#4ade80',
  '保険料': '#38bdf8',
  'イベント': '#fb7185',
};

interface Props {
  data: YearlyResult[];
}

export function ExpenseBreakdownChart({ data }: Props) {
  // 主要な支出カテゴリのみ表示
  const keys = ['住居費', '食費', '教育費', '保険料', '光熱・通信', '娯楽', 'イベント', '特別支出'];

  const chartData = data.map((d) => {
    const row: Record<string, number> = { age: d.age };
    for (const key of keys) {
      row[key] = d.expenseBreakdown[key] || 0;
    }
    return row;
  });

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">支出内訳推移</h3>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="age" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={60} />
          <Tooltip
            formatter={(value, name) => [fmt(Number(value)) + '円', name]}
            labelFormatter={(label) => `${label}歳`}
          />
          <Legend />
          {keys.map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId="1"
              fill={COLORS[key] || '#94a3b8'}
              fillOpacity={0.7}
              stroke={COLORS[key] || '#94a3b8'}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
