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
  const duplicateScenario = useStore((s) => s.duplicateScenario);
  const saveScenario = useStore((s) => s.saveScenario);
  const resetAll = useStore((s) => s.resetAll);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);

  // 設定変更時に自動実行(500msデバウンス)
  const configRef = useRef(config);
  configRef.current = config;
  useEffect(() => {
    if (scenarios.length === 0) return;
    const timer = setTimeout(() => simulate(), 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, scenarios.length]);

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
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-4 h-11 flex items-center justify-between">
          <h1 className="text-sm font-semibold tracking-tight text-gray-800">LifePlan Sim</h1>
          <div className="flex gap-1.5 items-center">
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleOpenFile} className="hidden" multiple />
            <button onClick={() => fileInputRef.current?.click()} className="text-[11px] px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
              Open
            </button>
            {hasScenarios && (
              <>
                <button onClick={saveScenario} className="text-[11px] px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
                  Save
                </button>
                <button onClick={duplicateScenario} className="text-[11px] px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
                  Duplicate
                </button>
                <button onClick={() => {
                  const active = scenarios.find(s => s.id === activeId);
                  const name = prompt('ファイル名を入力', active?.name ?? 'lifeplan');
                  if (name) {
                    renameScenario(activeId!, name);
                    // 少し待ってからsave(rename反映後)
                    setTimeout(() => saveScenario(), 50);
                  }
                }} className="text-[11px] px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
                  Save as
                </button>
              </>
            )}
            <div className="w-px h-3.5 bg-gray-200 mx-0.5" />
            <button onClick={resetAll} className="text-[11px] px-2 py-1 text-gray-400 hover:text-red-500 transition-colors">
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* シナリオタブバー */}
      {hasScenarios && (
        <div className="bg-white border-b border-gray-200/60">
          <div className="max-w-screen-2xl mx-auto px-2 flex items-end gap-0 overflow-x-auto">
            {scenarios.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center gap-1.5 px-3.5 py-2 text-[11px] cursor-pointer border-b-2 transition-all min-w-0 ${
                  s.id === activeId
                    ? 'border-blue-600 text-blue-700 font-medium'
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => switchScenario(s.id)}
              >
                {editingNameId === s.id ? (
                  <input
                    type="text"
                    defaultValue={s.name}
                    autoFocus
                    className="text-[11px] border border-blue-300 rounded px-1.5 py-0.5 w-36 outline-none bg-blue-50"
                    onBlur={(e) => { renameScenario(s.id, e.target.value); setEditingNameId(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { renameScenario(s.id, e.currentTarget.value); setEditingNameId(null); } }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="truncate max-w-[160px]"
                    onDoubleClick={(e) => { e.stopPropagation(); setEditingNameId(s.id); }}
                  >
                    {s.name}
                  </span>
                )}
                {s.result && (
                  <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${
                    s.result.summary.negativeAge ? 'bg-red-400' : 'bg-emerald-400'
                  }`} />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); closeScenario(s.id); }}
                  className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all ml-0.5 text-[10px]"
                >
                  x
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 px-3 py-2 text-[11px] text-gray-300 hover:text-blue-500 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto">
        {!hasScenarios ? (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
              <span className="text-2xl text-white font-bold">LP</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">LifePlan Simulator</h2>
            <p className="text-sm text-gray-400 mb-8 max-w-xs">住宅購入、投資、保険、教育費を精密にシミュレーション。複数シナリオの比較が可能です。</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-md shadow-blue-200 hover:shadow-lg transition-all"
            >
              JSONファイルを開く
            </button>
            <p className="text-[11px] text-gray-300 mt-3">複数ファイルを同時に選択できます</p>
          </div>
        ) : (
          <>
            {/* 設定エリア */}
            <div className="bg-white border-b border-gray-200/60">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-full px-4 py-1.5 flex items-center justify-between text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50/50 transition-colors"
              >
                {!settingsOpen && result ? (
                  <span className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span>{config.profile.currentAge}歳</span>
                    <span className="text-gray-300">|</span>
                    <span>退職{config.profile.retirementAge}歳</span>
                    <span className="text-gray-300">|</span>
                    <span>世帯年収{Math.round((config.income.annualSalary + config.income.annualBonus + config.income.spouseAnnualSalary + config.income.spouseBonus) / 10000)}万</span>
                    <span className="text-gray-300">|</span>
                    <span className="font-medium">設定を開く</span>
                  </span>
                ) : (
                  <span>{settingsOpen ? '設定を閉じる' : '設定を開く'}</span>
                )}
                <span className="text-[10px]">{settingsOpen ? '▲' : '▼'}</span>
              </button>

              {settingsOpen && (
                <div className="flex border-t border-gray-100">
                  <nav className="w-20 md:w-28 flex-shrink-0 border-r border-gray-100 bg-gray-50/30">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-3 py-2 text-[11px] transition-all ${
                          activeTab === tab.id
                            ? 'bg-white border-r-2 border-blue-500 text-blue-600 font-medium shadow-sm'
                            : 'text-gray-400 hover:bg-white/60 hover:text-gray-600'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                  <div className="flex-1 p-4 max-h-[40vh] overflow-y-auto bg-white">
                    {renderPanel()}
                  </div>
                </div>
              )}
            </div>

            {/* 結果エリア */}
            {result && (
              <div className="p-4 md:p-6 space-y-5">
                <Summary summary={result.summary} />

                <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm">
                  <MonthlyPL data={result.yearly} retirementAge={config.profile.retirementAge} />
                </div>

                <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm">
                  <AssetChart data={result.yearly} retirementAge={config.profile.retirementAge} />
                </div>

                <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm">
                  <CashflowChart data={result.yearly} retirementAge={config.profile.retirementAge} />
                </div>

                <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm">
                  <MortgageChart data={result.yearly} />
                </div>

                <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm">
                  <ExpenseBreakdownChart data={result.yearly} />
                </div>

                <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm overflow-hidden">
                  <YearlyTable data={result.yearly} />
                </div>

                {scenarios.length >= 2 && scenarios.every(s => s.result) && (
                  <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm">
                    <ScenarioCompare />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
