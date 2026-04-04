'use client';

import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';
import { SelectField } from '../SelectField';

export function HousingPanel() {
  const housing = useStore((s) => s.config.housing);
  const updateHousing = useStore((s) => s.updateHousing);

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={housing.isOwner}
          onChange={(e) => updateHousing({ isOwner: e.target.checked })}
        />
        住宅購入する
      </label>

      {housing.isOwner && (
        <>
          <div>
            <h4 className="text-xs font-semibold text-gray-600 mb-2">購入条件</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <NumberField label="購入時年齢" value={housing.purchaseAge} onChange={(v) => updateHousing({ purchaseAge: v })} suffix="歳" />
              <NumberField label="物件価格" value={housing.propertyPrice} onChange={(v) => updateHousing({ propertyPrice: v })} step={1000000} suffix="円" />
              <NumberField label="頭金" value={housing.downPayment} onChange={(v) => updateHousing({ downPayment: v })} step={1000000} suffix="円" />
              <NumberField label="借入額" value={housing.loanAmount} onChange={(v) => updateHousing({ loanAmount: v })} step={1000000} suffix="円" />
              <NumberField label="借入期間" value={housing.loanTermYears} onChange={(v) => updateHousing({ loanTermYears: v })} suffix="年" />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-600 mb-2">金利</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <NumberField label="当初金利" value={housing.interestRate} onChange={(v) => updateHousing({ interestRate: v })} step={0.05} suffix="%" />
              <SelectField
                label="金利タイプ"
                value={housing.interestRateType}
                onChange={(v) => updateHousing({ interestRateType: v as 'fixed' | 'variable' })}
                options={[
                  { value: 'fixed', label: '全期間固定' },
                  { value: 'variable', label: '変動金利' },
                ]}
              />
              <SelectField
                label="返済方式"
                value={housing.mortgageType}
                onChange={(v) => updateHousing({ mortgageType: v as 'payment_equal' | 'principal_equal' })}
                options={[
                  { value: 'payment_equal', label: '元利均等' },
                  { value: 'principal_equal', label: '元金均等' },
                ]}
              />
            </div>
          </div>

          {housing.interestRateType === 'variable' && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-2">変動金利シナリオ</h4>
              {housing.variableRateChanges.map((change, i) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                  <NumberField label="" value={change.age} onChange={(v) => {
                    const changes = [...housing.variableRateChanges];
                    changes[i] = { ...changes[i], age: v };
                    updateHousing({ variableRateChanges: changes });
                  }} suffix="歳〜" />
                  <NumberField label="" value={change.rate} onChange={(v) => {
                    const changes = [...housing.variableRateChanges];
                    changes[i] = { ...changes[i], rate: v };
                    updateHousing({ variableRateChanges: changes });
                  }} step={0.05} suffix="%" />
                  <button
                    onClick={() => {
                      updateHousing({ variableRateChanges: housing.variableRateChanges.filter((_, j) => j !== i) });
                    }}
                    className="text-red-400 text-xs hover:text-red-600"
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  updateHousing({
                    variableRateChanges: [...housing.variableRateChanges, { age: 50, rate: 1.5 }],
                  });
                }}
                className="text-xs text-blue-500 hover:underline"
              >
                + 金利変更追加
              </button>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-gray-600 mb-2">維持費(年額)</h4>
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="固定資産税" value={housing.propertyTax} onChange={(v) => updateHousing({ propertyTax: v })} step={10000} suffix="円/年" />
              <NumberField label="管理費+修繕積立金" value={housing.maintenanceFee} onChange={(v) => updateHousing({ maintenanceFee: v })} step={10000} suffix="円/年" />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-600 mb-2">リフォーム計画</h4>
            {housing.renovationSchedule.map((reno, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <NumberField label="" value={reno.age} onChange={(v) => {
                  const schedule = [...housing.renovationSchedule];
                  schedule[i] = { ...schedule[i], age: v };
                  updateHousing({ renovationSchedule: schedule });
                }} suffix="歳" />
                <NumberField label="" value={reno.cost} onChange={(v) => {
                  const schedule = [...housing.renovationSchedule];
                  schedule[i] = { ...schedule[i], cost: v };
                  updateHousing({ renovationSchedule: schedule });
                }} step={100000} suffix="円" />
                <button
                  onClick={() => {
                    updateHousing({ renovationSchedule: housing.renovationSchedule.filter((_, j) => j !== i) });
                  }}
                  className="text-red-400 text-xs hover:text-red-600"
                >
                  削除
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                updateHousing({
                  renovationSchedule: [...housing.renovationSchedule, { age: 60, cost: 2_000_000 }],
                });
              }}
              className="text-xs text-blue-500 hover:underline"
            >
              + リフォーム追加
            </button>
          </div>
        </>
      )}
    </div>
  );
}
