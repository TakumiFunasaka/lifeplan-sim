'use client';

import { useEffect } from 'react';
import { useStore } from '@/hooks/use-store';
import { Section } from '@/components/Section';
import { ProfilePanel } from '@/components/panels/ProfilePanel';
import { IncomePanel } from '@/components/panels/IncomePanel';
import { ExpensePanel } from '@/components/panels/ExpensePanel';
import { HousingPanel } from '@/components/panels/HousingPanel';
import { ChildrenPanel } from '@/components/panels/ChildrenPanel';
import { InsurancePanel } from '@/components/panels/InsurancePanel';
import { InvestmentPanel } from '@/components/panels/InvestmentPanel';
import { PensionPanel } from '@/components/panels/PensionPanel';
import { LifeEventPanel } from '@/components/panels/LifeEventPanel';
import { AssetChart } from '@/components/charts/AssetChart';
import { CashflowChart } from '@/components/charts/CashflowChart';
import { MortgageChart } from '@/components/charts/MortgageChart';
import { ExpenseBreakdownChart } from '@/components/charts/ExpenseBreakdownChart';
import { Summary } from '@/components/Summary';
import { YearlyTable } from '@/components/YearlyTable';

export default function Home() {
  const simulate = useStore((s) => s.simulate);
  const result = useStore((s) => s.result);
  const config = useStore((s) => s.config);
  const resetAll = useStore((s) => s.resetAll);

  useEffect(() => {
    simulate();
  }, [simulate]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">ライフプランシミュレーター</h1>
        <div className="flex gap-2">
          <button
            onClick={resetAll}
            className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            リセット
          </button>
          <button
            onClick={simulate}
            className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
          >
            シミュレーション実行
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-8">
        <Section title="基本プロファイル・貯蓄" defaultOpen={true}>
          <ProfilePanel />
        </Section>
        <Section title="収入">
          <IncomePanel />
        </Section>
        <Section title="支出(月額)">
          <ExpensePanel />
        </Section>
        <Section title="住居(賃貸・購入・売却)">
          <HousingPanel />
        </Section>
        <Section title="子供・教育">
          <ChildrenPanel />
        </Section>
        <Section title="保険">
          <InsurancePanel />
        </Section>
        <Section title="投資・資産運用">
          <InvestmentPanel />
        </Section>
        <Section title="年金">
          <PensionPanel />
        </Section>
        <Section title="ライフイベント">
          <LifeEventPanel />
        </Section>
      </div>

      {result && (
        <div className="space-y-6">
          <Summary summary={result.summary} />
          <AssetChart data={result.yearly} retirementAge={config.profile.retirementAge} />
          <CashflowChart data={result.yearly} retirementAge={config.profile.retirementAge} />
          <MortgageChart data={result.yearly} />
          <ExpenseBreakdownChart data={result.yearly} />
          <YearlyTable data={result.yearly} />
        </div>
      )}
    </main>
  );
}
