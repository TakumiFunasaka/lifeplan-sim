'use client';

import { useState } from 'react';
import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';
import { SelectField } from '../SelectField';
import { HousingPhase, HousingType, PropertyStatus } from '@/lib/types';

const typeOptions: { value: HousingType; label: string }[] = [
  { value: 'rent', label: '賃貸' },
  { value: 'condo', label: 'マンション' },
  { value: 'house', label: '戸建て' },
];

const statusOptions: { value: PropertyStatus; label: string }[] = [
  { value: 'new_purchase', label: '新規購入' },
  { value: 'already_owned', label: '既に所有' },
];

function fmtMan(v: number) { return v >= 10000 ? `${Math.round(v / 10000).toLocaleString()}万` : `${v.toLocaleString()}`; }

function newPhase(): HousingPhase {
  return {
    id: `phase-${Date.now()}`, name: '新しい住居', type: 'rent', startAge: 35,
    monthlyRent: 100_000, rentRenewalFee: 100_000, rentRenewalIntervalYears: 2,
    propertyStatus: 'new_purchase', propertyPrice: 0, downPayment: 0, loanAmount: 0, currentLoanBalance: 0,
    interestRate: 0.5, interestRateType: 'variable', variableRateChanges: [], loanTermYears: 35, mortgageType: 'payment_equal',
    propertyTax: 0, managementFee: 0, repairReserveFee: 0, annualRepairCost: 0, renovationSchedule: [],
    sellAtEnd: false, salePrice: 0, saleCost: 0,
  };
}

// 折りたたみ可能なサブセクション
function Sub({ title, preview, defaultOpen = false, children }: { title: string; preview?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-100 pt-2">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-left group">
        <span className="text-[11px] font-semibold text-gray-500 group-hover:text-gray-700">{title}</span>
        <div className="flex items-center gap-2">
          {!open && preview && <span className="text-[10px] text-gray-400">{preview}</span>}
          <span className="text-[10px] text-gray-300">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

function PhaseEditor({ phase, index }: { phase: HousingPhase; index: number }) {
  const updateHousingPhase = useStore((s) => s.updateHousingPhase);
  const removeHousingPhase = useStore((s) => s.removeHousingPhase);
  const u = (partial: Partial<HousingPhase>) => updateHousingPhase(index, { ...phase, ...partial });

  const isOwned = phase.type !== 'rent';
  const loanBal = phase.propertyStatus === 'already_owned' ? phase.currentLoanBalance : phase.loanAmount;
  const hasLoan = loanBal > 0;

  // サマリープレビュー文字列
  const loanPreview = hasLoan ? `${fmtMan(loanBal)} / ${phase.interestRate}% / ${phase.loanTermYears}年` : 'なし';
  const maintPreview = phase.type === 'condo'
    ? `税${fmtMan(phase.propertyTax)} 管理${fmtMan(phase.managementFee)}/月 修繕${fmtMan(phase.repairReserveFee)}/月`
    : `税${fmtMan(phase.propertyTax)} 修繕${fmtMan(phase.annualRepairCost)}/年`;
  const renoPreview = phase.renovationSchedule.length > 0
    ? phase.renovationSchedule.map(r => `${r.yearsAfterStart}年後${fmtMan(r.cost)}`).join(', ')
    : 'なし';
  const sellPreview = phase.sellAtEnd ? `${fmtMan(phase.salePrice)} (費用${fmtMan(phase.saleCost)})` : 'なし';

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
      {/* ヘッダー: 名前・種別・年齢を1行に */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          value={phase.name}
          onChange={(e) => u({ name: e.target.value })}
          className="text-sm font-semibold border-b border-transparent hover:border-gray-300 focus:border-blue-400 outline-none bg-transparent w-36"
        />
        <select
          value={phase.type}
          onChange={(e) => u({ type: e.target.value as HousingType })}
          className="text-[11px] border border-gray-200 rounded px-1.5 py-0.5 text-gray-500"
        >
          {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={phase.startAge}
            onChange={(e) => u({ startAge: Number(e.target.value) })}
            className="w-10 text-center text-[11px] border border-gray-200 rounded px-1 py-0.5"
          />
          <span className="text-[11px] text-gray-400">歳〜</span>
        </div>
        <button onClick={() => removeHousingPhase(index)} className="text-gray-300 hover:text-red-500 text-[11px] ml-auto">削除</button>
      </div>

      {/* 賃貸 */}
      {phase.type === 'rent' && (
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="月額家賃" value={phase.monthlyRent} onChange={(v) => u({ monthlyRent: v })} step={5000} suffix="円/月" />
          <NumberField label="更新料" value={phase.rentRenewalFee} onChange={(v) => u({ rentRenewalFee: v })} step={10000} suffix="円" />
          <NumberField label="更新間隔" value={phase.rentRenewalIntervalYears} onChange={(v) => u({ rentRenewalIntervalYears: v })} suffix="年毎" />
        </div>
      )}

      {/* 購入 */}
      {isOwned && (
        <>
          <Sub title="取得" defaultOpen={true} preview={`${fmtMan(phase.propertyPrice)} ${phase.propertyStatus === 'already_owned' ? '(所有済)' : '(新規)'}`}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <SelectField label="状態" value={phase.propertyStatus} onChange={(v) => u({ propertyStatus: v as PropertyStatus })} options={statusOptions} />
              <NumberField label="物件価格" value={phase.propertyPrice} onChange={(v) => u({ propertyPrice: v })} step={1_000_000} suffix="円" />
              {phase.propertyStatus === 'new_purchase' && (
                <>
                  <NumberField label="頭金" value={phase.downPayment} onChange={(v) => u({ downPayment: v })} step={1_000_000} suffix="円" />
                  <NumberField label="借入額" value={phase.loanAmount} onChange={(v) => u({ loanAmount: v })} step={1_000_000} suffix="円" />
                </>
              )}
              {phase.propertyStatus === 'already_owned' && (
                <NumberField label="ローン残高" value={phase.currentLoanBalance} onChange={(v) => u({ currentLoanBalance: v })} step={1_000_000} suffix="円" />
              )}
            </div>
          </Sub>

          {hasLoan && (
            <Sub title="ローン" preview={loanPreview}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <NumberField label="借入期間" value={phase.loanTermYears} onChange={(v) => u({ loanTermYears: v })} suffix="年" />
                <NumberField label="金利" value={phase.interestRate} onChange={(v) => u({ interestRate: v })} step={0.05} suffix="%" />
                <SelectField label="金利タイプ" value={phase.interestRateType} onChange={(v) => u({ interestRateType: v as 'fixed' | 'variable' })} options={[{ value: 'fixed', label: '固定' }, { value: 'variable', label: '変動' }]} />
                <SelectField label="返済方式" value={phase.mortgageType} onChange={(v) => u({ mortgageType: v as 'payment_equal' | 'principal_equal' })} options={[{ value: 'payment_equal', label: '元利均等' }, { value: 'principal_equal', label: '元金均等' }]} />
              </div>
              {phase.interestRateType === 'variable' && (
                <div className="mt-2 space-y-1">
                  {phase.variableRateChanges.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <NumberField label="" value={c.age} onChange={(v) => { const ch = [...phase.variableRateChanges]; ch[i] = { ...c, age: v }; u({ variableRateChanges: ch }); }} suffix="歳〜" />
                      <NumberField label="" value={c.rate} onChange={(v) => { const ch = [...phase.variableRateChanges]; ch[i] = { ...c, rate: v }; u({ variableRateChanges: ch }); }} step={0.05} suffix="%" />
                      <button onClick={() => u({ variableRateChanges: phase.variableRateChanges.filter((_, j) => j !== i) })} className="text-red-400 text-[11px]">x</button>
                    </div>
                  ))}
                  <button onClick={() => u({ variableRateChanges: [...phase.variableRateChanges, { age: phase.startAge + 10, rate: 1.0 }] })} className="text-[11px] text-blue-500 hover:underline">+ 金利変更</button>
                </div>
              )}
            </Sub>
          )}

          <Sub title="維持費" preview={maintPreview}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <NumberField label="固定資産税(年額)" value={phase.propertyTax} onChange={(v) => u({ propertyTax: v })} step={10_000} suffix="円/年" />
              {phase.type === 'condo' && (
                <>
                  <NumberField label="管理費(月額)" value={phase.managementFee} onChange={(v) => u({ managementFee: v })} step={1_000} suffix="円/月" />
                  <NumberField label="修繕積立金(月額)" value={phase.repairReserveFee} onChange={(v) => u({ repairReserveFee: v })} step={1_000} suffix="円/月" />
                </>
              )}
              {phase.type === 'house' && (
                <NumberField label="修繕費(年額)" value={phase.annualRepairCost} onChange={(v) => u({ annualRepairCost: v })} step={10_000} suffix="円/年" />
              )}
            </div>
          </Sub>

          <Sub title="リフォーム" preview={renoPreview}>
            {phase.renovationSchedule.map((reno, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <NumberField label="" value={reno.yearsAfterStart} onChange={(v) => { const s = [...phase.renovationSchedule]; s[i] = { ...reno, yearsAfterStart: v }; u({ renovationSchedule: s }); }} suffix="年後" />
                <NumberField label="" value={reno.cost} onChange={(v) => { const s = [...phase.renovationSchedule]; s[i] = { ...reno, cost: v }; u({ renovationSchedule: s }); }} step={100_000} suffix="円" />
                <button onClick={() => u({ renovationSchedule: phase.renovationSchedule.filter((_, j) => j !== i) })} className="text-red-400 text-[11px]">x</button>
              </div>
            ))}
            <button onClick={() => u({ renovationSchedule: [...phase.renovationSchedule, { yearsAfterStart: 15, cost: 1_500_000 }] })} className="text-[11px] text-blue-500 hover:underline">+ リフォーム追加</button>
          </Sub>

          <Sub title="売却" preview={sellPreview}>
            <label className="flex items-center gap-2 text-xs mb-2">
              <input type="checkbox" checked={phase.sellAtEnd} onChange={(e) => u({ sellAtEnd: e.target.checked })} />
              次のフェーズ移行時に売却
            </label>
            {phase.sellAtEnd && (
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="売却見込み額" value={phase.salePrice} onChange={(v) => u({ salePrice: v })} step={1_000_000} suffix="円" />
                <NumberField label="売却諸費用" value={phase.saleCost} onChange={(v) => u({ saleCost: v })} step={100_000} suffix="円" />
              </div>
            )}
          </Sub>
        </>
      )}
    </div>
  );
}

export function HousingPanel() {
  const phases = useStore((s) => s.config.housingPhases);
  const addHousingPhase = useStore((s) => s.addHousingPhase);
  const sorted = [...phases].sort((a, b) => a.startAge - b.startAge);

  return (
    <div className="space-y-3">
      {sorted.length > 0 && (
        <div className="flex items-center gap-1 text-[11px] overflow-x-auto py-1">
          {sorted.map((p, i) => (
            <div key={p.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-300">→</span>}
              <span className={`px-2 py-0.5 rounded whitespace-nowrap ${
                p.type === 'rent' ? 'bg-blue-50 text-blue-600' :
                p.type === 'condo' ? 'bg-purple-50 text-purple-600' :
                'bg-green-50 text-green-600'
              }`}>
                {p.startAge}歳〜 {p.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {sorted.map((p) => {
        const origIdx = phases.findIndex(ph => ph.id === p.id);
        return <PhaseEditor key={p.id} phase={p} index={origIdx} />;
      })}

      <button onClick={() => addHousingPhase(newPhase())} className="text-xs text-blue-500 hover:underline">+ 住居フェーズ追加</button>
    </div>
  );
}
