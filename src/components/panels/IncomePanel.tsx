'use client';

import { useState } from 'react';
import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';
import { SelectField } from '../SelectField';
import { IncomePhase, SalaryIncome, BusinessIncome, NoIncome, IncomeType } from '@/lib/types';

const typeOptions: { value: IncomeType; label: string }[] = [
  { value: 'salary', label: '給与' },
  { value: 'business', label: '事業(独立)' },
  { value: 'none', label: '無収入(休職等)' },
];

function newSalaryPhase(startAge: number): SalaryIncome {
  return { id: `ip-${Date.now()}`, name: '給与収入', startAge, type: 'salary', annualSalary: 5_000_000, annualBonus: 0, growthRate: 2, peakAge: 55 };
}

function newBusinessPhase(startAge: number): BusinessIncome {
  return { id: `ip-${Date.now()}`, name: '事業/独立', startAge, type: 'business', annualRevenue: 6_000_000, growthRate: 3, rampUpYear1: 0.5, rampUpYear2: 0.8 };
}

function newNoIncomePhase(startAge: number): NoIncome {
  return { id: `ip-${Date.now()}`, name: '休職', startAge, type: 'none', reason: '産休・育休' };
}

function fmtMan(v: number) { return `${Math.round(v / 10000).toLocaleString()}万`; }

function PhaseEditor({ phase, target, index }: { phase: IncomePhase; target: 'self' | 'spouse'; index: number }) {
  const updateIncomePhase = useStore((s) => s.updateIncomePhase);
  const removeIncomePhase = useStore((s) => s.removeIncomePhase);
  const [expanded, setExpanded] = useState(false);

  const u = (p: IncomePhase) => updateIncomePhase(target, index, p);

  // サマリー
  let summary = '';
  if (phase.type === 'salary') {
    const sp = phase as SalaryIncome;
    summary = `${fmtMan(sp.annualSalary)}+賞与${fmtMan(sp.annualBonus)} 昇給${sp.growthRate}%`;
  } else if (phase.type === 'business') {
    const bp = phase as BusinessIncome;
    summary = `報酬${fmtMan(bp.annualRevenue)} 成長${bp.growthRate}% (1年目${Math.round(bp.rampUpYear1 * 100)}%)`;
  } else {
    summary = (phase as NoIncome).reason;
  }

  const changeType = (newType: IncomeType) => {
    if (newType === 'salary') u(newSalaryPhase(phase.startAge));
    else if (newType === 'business') u(newBusinessPhase(phase.startAge));
    else u(newNoIncomePhase(phase.startAge));
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(!expanded)}>
        <input type="text" value={phase.name} onChange={(e) => { e.stopPropagation(); u({ ...phase, name: e.target.value }); }} onClick={(e) => e.stopPropagation()} className="font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 outline-none w-24" />
        <span className="text-gray-400">{phase.startAge}歳〜</span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] ${phase.type === 'salary' ? 'bg-blue-50 text-blue-600' : phase.type === 'business' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
          {typeOptions.find(t => t.value === phase.type)?.label}
        </span>
        <span className="text-gray-400 ml-auto truncate max-w-[180px]">{summary}</span>
        <button onClick={(e) => { e.stopPropagation(); removeIncomePhase(target, index); }} className="text-gray-300 hover:text-red-500 text-[10px]">x</button>
        <span className="text-[10px] text-gray-300">{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="開始年齢" value={phase.startAge} onChange={(v) => u({ ...phase, startAge: v })} suffix="歳" />
            <SelectField label="種別" value={phase.type} onChange={(v) => changeType(v as IncomeType)} options={typeOptions} />
          </div>

          {phase.type === 'salary' && (() => {
            const sp = phase as SalaryIncome;
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <NumberField label="額面年収" value={sp.annualSalary} onChange={(v) => u({ ...sp, annualSalary: v })} step={100000} suffix="円" />
                <NumberField label="賞与(年額)" value={sp.annualBonus} onChange={(v) => u({ ...sp, annualBonus: v })} step={100000} suffix="円" />
                <NumberField label="昇給率" value={sp.growthRate} onChange={(v) => u({ ...sp, growthRate: v })} step={0.1} suffix="%" />
                <NumberField label="昇給停止" value={sp.peakAge} onChange={(v) => u({ ...sp, peakAge: v })} suffix="歳" />
              </div>
            );
          })()}

          {phase.type === 'business' && (() => {
            const bp = phase as BusinessIncome;
            return (
              <div className="space-y-3">
                <p className="text-[10px] text-gray-400">自分に払う年間報酬(額面)を設定。法人なら役員報酬、フリーランスなら売上-経費。税・社保の控除は給与所得と同等で近似計算しています。</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <NumberField label="年間報酬(額面)" value={bp.annualRevenue} onChange={(v) => u({ ...bp, annualRevenue: v })} step={100000} suffix="円" />
                  <NumberField label="年間成長率" value={bp.growthRate} onChange={(v) => u({ ...bp, growthRate: v })} step={0.5} suffix="%" />
                  <NumberField label="1年目" value={Math.round(bp.rampUpYear1 * 100)} onChange={(v) => u({ ...bp, rampUpYear1: v / 100 })} suffix="%" />
                  <NumberField label="2年目" value={Math.round(bp.rampUpYear2 * 100)} onChange={(v) => u({ ...bp, rampUpYear2: v / 100 })} suffix="%" />
                </div>
              </div>
            );
          })()}

          {phase.type === 'none' && (() => {
            const np = phase as NoIncome;
            return (
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-gray-400">理由</span>
                <input type="text" value={np.reason} onChange={(e) => u({ ...np, reason: e.target.value })} className="border border-gray-200 rounded-md px-2 py-1 text-sm w-48" />
              </label>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function PhaseList({ target, label }: { target: 'self' | 'spouse'; label: string }) {
  const config = useStore((s) => s.config);
  const addIncomePhase = useStore((s) => s.addIncomePhase);
  const phases = target === 'self' ? (config.incomePhases ?? []) : (config.spouseIncomePhases ?? []);
  const sorted = [...phases].sort((a, b) => a.startAge - b.startAge);
  const hasPhases = phases.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold text-gray-500">{label}</h4>
        {!hasPhases && (
          <button
            onClick={() => addIncomePhase(target, newSalaryPhase(config.profile.currentAge))}
            className="text-[11px] text-blue-500 hover:underline"
          >
            + フェーズ化する
          </button>
        )}
      </div>

      {hasPhases && (
        <>
          {sorted.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] overflow-x-auto py-1">
              {sorted.map((p, i) => (
                <div key={p.id} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-300">→</span>}
                  <span className={`px-2 py-0.5 rounded whitespace-nowrap ${p.type === 'salary' ? 'bg-blue-50 text-blue-600' : p.type === 'business' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                    {p.startAge}歳〜 {p.name}
                  </span>
                </div>
              ))}
            </div>
          )}
          {sorted.map((p) => {
            const origIdx = phases.findIndex(ph => ph.id === p.id);
            return <PhaseEditor key={p.id} phase={p} target={target} index={origIdx} />;
          })}
          <button
            onClick={() => {
              const lastAge = sorted.length > 0 ? sorted[sorted.length - 1].startAge + 5 : 35;
              addIncomePhase(target, newSalaryPhase(lastAge));
            }}
            className="text-xs text-blue-500 hover:underline"
          >
            + フェーズ追加
          </button>
        </>
      )}

      {!hasPhases && (
        <p className="text-[11px] text-gray-400">従来の設定(単一の昇給カーブ)で計算されます</p>
      )}
    </div>
  );
}

export function IncomePanel() {
  const income = useStore((s) => s.config.income);
  const updateIncome = useStore((s) => s.updateIncome);
  const hasSpouse = useStore((s) => s.config.profile.spouseAge !== null);
  const selfPhases = useStore((s) => s.config.incomePhases ?? []);
  const spousePhases = useStore((s) => s.config.spouseIncomePhases ?? []);

  return (
    <div className="space-y-4">
      <PhaseList target="self" label="本人" />

      {/* フェーズ未使用時のフォールバックUI */}
      {selfPhases.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumberField label="額面年収(賞与除く)" value={income.annualSalary} onChange={(v) => updateIncome({ annualSalary: v })} step={100000} suffix="円" />
          <NumberField label="賞与(年額)" value={income.annualBonus} onChange={(v) => updateIncome({ annualBonus: v })} step={100000} suffix="円" />
          <NumberField label="昇給率" value={income.salaryGrowthRate} onChange={(v) => updateIncome({ salaryGrowthRate: v })} step={0.1} suffix="%" />
          <NumberField label="昇給停止年齢" value={income.peakAge} onChange={(v) => updateIncome({ peakAge: v })} suffix="歳" />
        </div>
      )}

      {hasSpouse && (
        <>
          <PhaseList target="spouse" label="配偶者" />
          {spousePhases.length === 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <NumberField label="額面年収(賞与除く)" value={income.spouseAnnualSalary} onChange={(v) => updateIncome({ spouseAnnualSalary: v })} step={100000} suffix="円" />
              <NumberField label="賞与(年額)" value={income.spouseBonus} onChange={(v) => updateIncome({ spouseBonus: v })} step={100000} suffix="円" />
              <NumberField label="昇給率" value={income.spouseSalaryGrowthRate} onChange={(v) => updateIncome({ spouseSalaryGrowthRate: v })} step={0.1} suffix="%" />
              <NumberField label="昇給停止年齢" value={income.spousePeakAge} onChange={(v) => updateIncome({ spousePeakAge: v })} suffix="歳" />
            </div>
          )}
        </>
      )}

      <div>
        <h4 className="text-[11px] font-semibold text-gray-500 mb-2">その他</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumberField label="副業(月額)" value={income.sideIncomeMonthly} onChange={(v) => updateIncome({ sideIncomeMonthly: v })} step={10000} suffix="円" />
          <NumberField label="その他年収" value={income.otherAnnualIncome} onChange={(v) => updateIncome({ otherAnnualIncome: v })} step={100000} suffix="円" />
        </div>
      </div>
    </div>
  );
}
