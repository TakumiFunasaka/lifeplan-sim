'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/hooks/use-store';
import { ProfilePanel } from '@/components/panels/ProfilePanel';
import { IncomePanel } from '@/components/panels/IncomePanel';
import { ExpensePanel } from '@/components/panels/ExpensePanel';
import { HousingPanel } from '@/components/panels/HousingPanel';
import { ChildrenPanel } from '@/components/panels/ChildrenPanel';
import { InsurancePanel } from '@/components/panels/InsurancePanel';
import { InvestmentPanel } from '@/components/panels/InvestmentPanel';
import { PensionPanel } from '@/components/panels/PensionPanel';
import { LifeEventPanel } from '@/components/panels/LifeEventPanel';
import { RentalPropertyPanel } from '@/components/panels/RentalPropertyPanel';
import { AssetChart } from '@/components/charts/AssetChart';
import { CashflowChart } from '@/components/charts/CashflowChart';
import { MortgageChart } from '@/components/charts/MortgageChart';
import { ExpenseBreakdownChart } from '@/components/charts/ExpenseBreakdownChart';
import { Summary } from '@/components/Summary';
import { YearlyTable } from '@/components/YearlyTable';
import { MonthlyPL } from '@/components/MonthlyPL';
import { ScenarioCompare } from '@/components/ScenarioCompare';

const TABS = [
  { id: 'profile', label: '基本', icon: 'P' },
  { id: 'income', label: '収入', icon: 'Y' },
  { id: 'expense', label: '支出', icon: 'E' },
  { id: 'housing', label: '住居', icon: 'H' },
  { id: 'rental', label: '不動産', icon: 'R' },
  { id: 'children', label: '教育', icon: 'C' },
  { id: 'insurance', label: '保険', icon: 'I' },
  { id: 'investment', label: '投資', icon: '$' },
  { id: 'pension', label: '年金', icon: 'N' },
  { id: 'events', label: 'イベント', icon: 'L' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function Home() {
  const simulate = useStore((s) => s.simulate);
  const result = useStore((s) => s.result);
  const config = useStore((s) => s.config);
  const resetAll = useStore((s) => s.resetAll);
  const exportConfig = useStore((s) => s.exportConfig);
  const importConfig = useStore((s) => s.importConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportName, setExportName] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [settingsOpen, setSettingsOpen] = useState(true);

  useEffect(() => {
    simulate();
  }, [simulate]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const ok = importConfig(text);
      if (ok) simulate();
      else alert('JSONの読み込みに失敗しました。');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 'profile': return <ProfilePanel />;
      case 'income': return <IncomePanel />;
      case 'expense': return <ExpensePanel />;
      case 'housing': return <HousingPanel />;
      case 'rental': return <RentalPropertyPanel />;
      case 'children': return <ChildrenPanel />;
      case 'insurance': return <InsurancePanel />;
      case 'investment': return <InvestmentPanel />;
      case 'pension': return <PensionPanel />;
      case 'events': return <LifeEventPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <h1 className="text-sm font-bold tracking-tight">LifePlan Sim</h1>
          <div className="flex gap-1.5 items-center">
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="text-xs px-2.5 py-1 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600">
              Import
            </button>
            <input
              type="text"
              value={exportName}
              onChange={(e) => setExportName(e.target.value)}
              placeholder="filename"
              className="text-xs border border-gray-200 rounded-md px-2 py-1 w-24 text-gray-600"
            />
            <button onClick={() => exportConfig(exportName || undefined)} className="text-xs px-2.5 py-1 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600">
              Export
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button onClick={resetAll} className="text-xs px-2.5 py-1 text-gray-400 hover:text-red-500">
              Reset
            </button>
            <button
              onClick={simulate}
              className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Run
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto">
        {/* 設定エリア（折りたたみ可能） */}
        <div className="border-b bg-white">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="w-full px-4 py-2 flex items-center justify-between text-xs text-gray-500 hover:bg-gray-50"
          >
            <span className="font-medium">{settingsOpen ? '設定を閉じる' : '設定を開く'}</span>
            <span>{settingsOpen ? '▲' : '▼'}</span>
          </button>

          {settingsOpen && (
            <div className="flex border-t">
              {/* タブナビ */}
              <nav className="w-20 md:w-28 flex-shrink-0 border-r bg-gray-50/50">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2.5 text-xs transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white border-r-2 border-blue-600 text-blue-700 font-medium'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* パネル */}
              <div className="flex-1 p-4 max-h-[60vh] overflow-y-auto">
                {renderPanel()}
              </div>
            </div>
          )}
        </div>

        {/* 結果エリア */}
        {result && (
          <div className="p-4 space-y-6">
            <Summary summary={result.summary} />
            <MonthlyPL data={result.yearly} retirementAge={config.profile.retirementAge} />
            <AssetChart data={result.yearly} retirementAge={config.profile.retirementAge} />
            <CashflowChart data={result.yearly} retirementAge={config.profile.retirementAge} />
            <MortgageChart data={result.yearly} />
            <ExpenseBreakdownChart data={result.yearly} />
            <YearlyTable data={result.yearly} />
            <ScenarioCompare />
          </div>
        )}
      </div>
    </div>
  );
}
