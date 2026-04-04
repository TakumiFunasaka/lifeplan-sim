'use client';

import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';
import { SelectField } from '../SelectField';
import { HousingPhase, HousingType, PropertyStatus } from '@/lib/types';

const typeOptions: { value: HousingType; label: string }[] = [
  { value: 'rent', label: '賃貸' },
  { value: 'condo', label: 'マンション購入' },
  { value: 'house', label: '戸建て購入' },
];

const statusOptions: { value: PropertyStatus; label: string }[] = [
  { value: 'new_purchase', label: '新規購入' },
  { value: 'already_owned', label: '既に所有' },
];

function newPhase(): HousingPhase {
  return {
    id: `phase-${Date.now()}`,
    name: '新しい住居',
    type: 'rent',
    startAge: 35,
    monthlyRent: 100_000,
    rentRenewalFee: 100_000,
    rentRenewalIntervalYears: 2,
    propertyStatus: 'new_purchase',
    propertyPrice: 0,
    downPayment: 0,
    loanAmount: 0,
    currentLoanBalance: 0,
    interestRate: 0.5,
    interestRateType: 'variable',
    variableRateChanges: [],
    loanTermYears: 35,
    mortgageType: 'payment_equal',
    propertyTax: 0,
    managementFee: 0,
    repairReserveFee: 0,
    annualRepairCost: 0,
    renovationSchedule: [],
    sellAtEnd: false,
    salePrice: 0,
    saleCost: 0,
  };
}

function PhaseEditor({ phase, index }: { phase: HousingPhase; index: number }) {
  const updateHousingPhase = useStore((s) => s.updateHousingPhase);
  const removeHousingPhase = useStore((s) => s.removeHousingPhase);
  const u = (partial: Partial<HousingPhase>) => updateHousingPhase(index, { ...phase, ...partial });

  const isOwned = phase.type !== 'rent';

  return (
    <div className="border border-gray-200 rounded p-4 space-y-3">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
          <label className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">名前</span>
            <input
              type="text"
              value={phase.name}
              onChange={(e) => u({ name: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </label>
          <SelectField label="種別" value={phase.type} onChange={(v) => u({ type: v as HousingType })} options={typeOptions} />
          <NumberField label="開始年齢" value={phase.startAge} onChange={(v) => u({ startAge: v })} suffix="歳" />
        </div>
        <button onClick={() => removeHousingPhase(index)} className="text-red-400 text-xs hover:text-red-600 mt-4">削除</button>
      </div>

      {/* === 賃貸 === */}
      {phase.type === 'rent' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <NumberField label="月額家賃" value={phase.monthlyRent} onChange={(v) => u({ monthlyRent: v })} step={5000} suffix="円/月" />
          <NumberField label="更新料" value={phase.rentRenewalFee} onChange={(v) => u({ rentRenewalFee: v })} step={10000} suffix="円" />
          <NumberField label="更新間隔" value={phase.rentRenewalIntervalYears} onChange={(v) => u({ rentRenewalIntervalYears: v })} suffix="年毎" />
        </div>
      )}

      {/* === 購入(共通) === */}
      {isOwned && (
        <>
          <div>
            <h5 className="text-xs font-semibold text-gray-500 mb-1">取得</h5>
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
                <NumberField label="現在のローン残高" value={phase.currentLoanBalance} onChange={(v) => u({ currentLoanBalance: v })} step={1_000_000} suffix="円" />
              )}
            </div>
          </div>

          {/* ローン設定(残高 or 借入額がある場合) */}
          {(phase.loanAmount > 0 || phase.currentLoanBalance > 0) && (
            <div>
              <h5 className="text-xs font-semibold text-gray-500 mb-1">ローン</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <NumberField label="借入期間(残年数)" value={phase.loanTermYears} onChange={(v) => u({ loanTermYears: v })} suffix="年" />
                <NumberField label="金利" value={phase.interestRate} onChange={(v) => u({ interestRate: v })} step={0.05} suffix="%" />
                <SelectField
                  label="金利タイプ"
                  value={phase.interestRateType}
                  onChange={(v) => u({ interestRateType: v as 'fixed' | 'variable' })}
                  options={[{ value: 'fixed', label: '全期間固定' }, { value: 'variable', label: '変動金利' }]}
                />
                <SelectField
                  label="返済方式"
                  value={phase.mortgageType}
                  onChange={(v) => u({ mortgageType: v as 'payment_equal' | 'principal_equal' })}
                  options={[{ value: 'payment_equal', label: '元利均等' }, { value: 'principal_equal', label: '元金均等' }]}
                />
              </div>
              {phase.interestRateType === 'variable' && (
                <div className="mt-2">
                  <span className="text-xs text-gray-400">変動金利シナリオ</span>
                  {phase.variableRateChanges.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 mt-1">
                      <NumberField label="" value={c.age} onChange={(v) => {
                        const changes = [...phase.variableRateChanges];
                        changes[i] = { ...c, age: v };
                        u({ variableRateChanges: changes });
                      }} suffix="歳〜" />
                      <NumberField label="" value={c.rate} onChange={(v) => {
                        const changes = [...phase.variableRateChanges];
                        changes[i] = { ...c, rate: v };
                        u({ variableRateChanges: changes });
                      }} step={0.05} suffix="%" />
                      <button onClick={() => u({ variableRateChanges: phase.variableRateChanges.filter((_, j) => j !== i) })} className="text-red-400 text-xs">削除</button>
                    </div>
                  ))}
                  <button onClick={() => u({ variableRateChanges: [...phase.variableRateChanges, { age: phase.startAge + 10, rate: 1.0 }] })} className="text-xs text-blue-500 hover:underline mt-1">+ 金利変更</button>
                </div>
              )}
            </div>
          )}

          {/* 維持費 */}
          <div>
            <h5 className="text-xs font-semibold text-gray-500 mb-1">維持費</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <NumberField label="固定資産税(年額)" value={phase.propertyTax} onChange={(v) => u({ propertyTax: v })} step={10_000} suffix="円/年" />
              {phase.type === 'condo' && (
                <>
                  <NumberField label="管理費(月額)" value={phase.managementFee} onChange={(v) => u({ managementFee: v })} step={1_000} suffix="円/月" />
                  <NumberField label="修繕積立金(月額)" value={phase.repairReserveFee} onChange={(v) => u({ repairReserveFee: v })} step={1_000} suffix="円/月" />
                </>
              )}
              {phase.type === 'house' && (
                <NumberField label="修繕費(年額目安)" value={phase.annualRepairCost} onChange={(v) => u({ annualRepairCost: v })} step={10_000} suffix="円/年" />
              )}
            </div>
          </div>

          {/* リフォーム */}
          <div>
            <span className="text-xs text-gray-400">リフォーム計画</span>
            {phase.renovationSchedule.map((reno, i) => (
              <div key={i} className="flex items-center gap-2 mt-1">
                <NumberField label="" value={reno.yearsAfterStart} onChange={(v) => {
                  const schedule = [...phase.renovationSchedule];
                  schedule[i] = { ...reno, yearsAfterStart: v };
                  u({ renovationSchedule: schedule });
                }} suffix="年後" />
                <NumberField label="" value={reno.cost} onChange={(v) => {
                  const schedule = [...phase.renovationSchedule];
                  schedule[i] = { ...reno, cost: v };
                  u({ renovationSchedule: schedule });
                }} step={100_000} suffix="円" />
                <button onClick={() => u({ renovationSchedule: phase.renovationSchedule.filter((_, j) => j !== i) })} className="text-red-400 text-xs">削除</button>
              </div>
            ))}
            <button onClick={() => u({ renovationSchedule: [...phase.renovationSchedule, { yearsAfterStart: 15, cost: 1_500_000 }] })} className="text-xs text-blue-500 hover:underline mt-1">+ リフォーム追加</button>
          </div>

          {/* 売却 */}
          <div>
            <h5 className="text-xs font-semibold text-gray-500 mb-1">売却(次の住居に移る時)</h5>
            <label className="flex items-center gap-2 text-sm mb-2">
              <input type="checkbox" checked={phase.sellAtEnd} onChange={(e) => u({ sellAtEnd: e.target.checked })} />
              次のフェーズ移行時に売却する
            </label>
            {phase.sellAtEnd && (
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="売却見込み額" value={phase.salePrice} onChange={(v) => u({ salePrice: v })} step={1_000_000} suffix="円" />
                <NumberField label="売却諸費用" value={phase.saleCost} onChange={(v) => u({ saleCost: v })} step={100_000} suffix="円" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function HousingPanel() {
  const phases = useStore((s) => s.config.housingPhases);
  const addHousingPhase = useStore((s) => s.addHousingPhase);

  const sorted = [...phases].sort((a, b) => a.startAge - b.startAge);
  const sortedIndices = sorted.map(s => phases.findIndex(p => p.id === s.id));

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">住居フェーズを時系列で追加してください。開始年齢順に自動で適用されます。</p>

      {/* タイムライン表示 */}
      {sorted.length > 0 && (
        <div className="flex items-center gap-1 text-xs overflow-x-auto py-1">
          {sorted.map((p, i) => (
            <div key={p.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-300">→</span>}
              <span className={`px-2 py-0.5 rounded ${
                p.type === 'rent' ? 'bg-blue-100 text-blue-700' :
                p.type === 'condo' ? 'bg-purple-100 text-purple-700' :
                'bg-green-100 text-green-700'
              }`}>
                {p.startAge}歳〜 {p.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {sortedIndices.map((originalIndex, i) => (
        <PhaseEditor key={phases[originalIndex].id} phase={phases[originalIndex]} index={originalIndex} />
      ))}

      <button onClick={() => addHousingPhase(newPhase())} className="text-sm text-blue-500 hover:underline">
        + 住居フェーズを追加
      </button>
    </div>
  );
}
