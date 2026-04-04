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
  { id: 'profile', label: '基本' },
  { id: 'income', label: '収入' },
  { id: 'expense', label: '支出' },
  { id: 'housing', label: '住居' },
  { id: 'rental', label: '不動産' },
  { id: 'children', label: '教育' },
  { id: 'insurance', label: '保険' },
  { id: 'investment', label: '投資' },
  { id: 'pension', label: '年金' },
  { id: 'events', label: 'イベント' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function Home() {
  const simulate = useStore((s) => s.simulate);
  const result = useStore((s) => s.result);
  const config = useStore((s) => s.config);
  const scenarios = useStore((s) => s.scenarios);
  const activeId = useStore((s) => s.activeId);
  const openScenario = useStore((s) => s.openScenario);
  const closeScenario = useStore((s) => s.closeScenario);
  const switchScenario = useStore((s) => s.switchScenario);
  const renameScenario = useStore((s) => s.renameScenario);
  const saveScenario = useStore((s) => s.saveScenario);
  const resetAll = useStore((s) => s.resetAll);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);

  useEffect(() => {
    if (scenarios.length > 0 && !result) simulate();
  }, [scenarios, result, simulate]);

  const handleOpenFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const name = file.name.replace(/\.json$/, '');
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const ok = openScenario(text, name);
        if (!ok) alert(`${file.name} の読み込みに失敗しました。`);
      };
      reader.readAsText(file);
    }
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

  const hasScenarios = scenarios.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <h1 className="text-sm font-bold tracking-tight">LifePlan Sim</h1>
          <div className="flex gap-1.5 items-center">
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleOpenFile} className="hidden" multiple />
            <button onClick={() => fileInputRef.current?.click()} className="text-xs px-2.5 py-1 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600">
              Open
            </button>
            {hasScenarios && (
              <>
                <button onClick={saveScenario} className="text-xs px-2.5 py-1 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600">
                  Save
                </button>
                <button onClick={simulate} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
                  Run
                </button>
              </>
            )}
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button onClick={resetAll} className="text-xs px-2.5 py-1 text-gray-400 hover:text-red-500">
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* シナリオタブバー */}
      {hasScenarios && (
        <div className="bg-white border-b">
          <div className="max-w-screen-2xl mx-auto px-4 flex items-center gap-0 overflow-x-auto">
            {scenarios.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center gap-1 px-3 py-2 text-xs cursor-pointer border-b-2 transition-colors min-w-0 ${
                  s.id === activeId
                    ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => switchScenario(s.id)}
              >
                {editingNameId === s.id ? (
                  <input
                    type="text"
                    defaultValue={s.name}
                    autoFocus
                    className="text-xs border border-blue-300 rounded px-1 py-0.5 w-32 outline-none"
                    onBlur={(e) => { renameScenario(s.id, e.target.value); setEditingNameId(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { renameScenario(s.id, e.currentTarget.value); setEditingNameId(null); } }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="truncate max-w-[150px]"
                    onDoubleClick={(e) => { e.stopPropagation(); setEditingNameId(s.id); }}
                  >
                    {s.name}
                  </span>
                )}
                {/* 枯渇インジケータ */}
                {s.result && (
                  <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
                    s.result.summary.negativeAge ? 'bg-red-500' : 'bg-emerald-500'
                  }`} />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); closeScenario(s.id); }}
                  className="flex-shrink-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                >
                  x
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 px-3 py-2 text-xs text-gray-400 hover:text-blue-600"
            >
              +
            </button>
          </div>
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto">
        {!hasScenarios ? (
          /* 空の状態 */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-6xl mb-4 text-gray-200">$</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">ライフプランシミュレーター</h2>
            <p className="text-sm text-gray-400 mb-6">JSONファイルを開いてシミュレーションを開始</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              JSONファイルを開く
            </button>
            <p className="text-xs text-gray-300 mt-4">複数ファイルを同時に選択できます</p>
          </div>
        ) : (
          <>
            {/* 設定エリア */}
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

                {/* 複数シナリオ比較(2つ以上開いている時) */}
                {scenarios.length >= 2 && scenarios.every(s => s.result) && (
                  <ScenarioCompare />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
