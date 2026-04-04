'use client';

import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';
import { SelectField } from '../SelectField';
import { RentalProperty, RentalPropertyType } from '@/lib/types';

const propertyTypeOptions: { value: RentalPropertyType; label: string }[] = [
  { value: 'condo', label: 'マンション' },
  { value: 'house', label: '戸建て' },
];

function newRentalProperty(): RentalProperty {
  return {
    id: `rental-${Date.now()}`,
    name: '賃貸物件',
    propertyType: 'condo',
    startAge: 35,
    monthlyRent: 100_000,
    vacancyRate: 5,
    managementCommissionRate: 5,
    propertyTax: 100_000,
    managementFee: 15_000,
    repairReserveFee: 12_000,
    annualRepairCost: 0,
    otherAnnualCost: 30_000,
    hasLoan: true,
    loanBalance: 20_000_000,
    loanInterestRate: 0.5,
    loanRemainingYears: 25,
    loanInterestRateType: 'variable',
    loanVariableRateChanges: [],
    loanMortgageType: 'payment_equal',
    sellAge: null,
    salePrice: 0,
    saleCost: 0,
  };
}

function PropertyEditor({ prop, index }: { prop: RentalProperty; index: number }) {
  const updateRentalProperty = useStore((s) => s.updateRentalProperty);
  const removeRentalProperty = useStore((s) => s.removeRentalProperty);
  const u = (partial: Partial<RentalProperty>) => updateRentalProperty(index, { ...prop, ...partial });

  // 概算表示
  const grossRent = prop.monthlyRent * 12;
  const effectiveRent = Math.round(grossRent * (1 - prop.vacancyRate / 100));
  const commission = Math.round(effectiveRent * prop.managementCommissionRate / 100);
  let expenses = commission + prop.propertyTax + prop.otherAnnualCost;
  if (prop.propertyType === 'condo') {
    expenses += (prop.managementFee + prop.repairReserveFee) * 12;
  } else {
    expenses += prop.annualRepairCost;
  }
  // ローンは概算（初年度ベース）
  let loanPaymentEstimate = 0;
  if (prop.hasLoan && prop.loanBalance > 0 && prop.loanRemainingYears > 0) {
    const r = prop.loanInterestRate / 100 / 12;
    const n = prop.loanRemainingYears * 12;
    if (r > 0) {
      loanPaymentEstimate = Math.round((prop.loanBalance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) * 12);
    } else {
      loanPaymentEstimate = Math.round(prop.loanBalance / prop.loanRemainingYears);
    }
  }
  const netCashflow = effectiveRent - expenses - loanPaymentEstimate;

  return (
    <div className="border border-gray-200 rounded p-4 space-y-3">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
          <label className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">名前</span>
            <input
              type="text"
              value={prop.name}
              onChange={(e) => u({ name: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </label>
          <SelectField label="物件種別" value={prop.propertyType} onChange={(v) => u({ propertyType: v as RentalPropertyType })} options={propertyTypeOptions} />
          <NumberField label="運用開始年齢" value={prop.startAge} onChange={(v) => u({ startAge: v })} suffix="歳" />
        </div>
        <button onClick={() => removeRentalProperty(index)} className="text-red-400 text-xs hover:text-red-600 mt-4">削除</button>
      </div>

      {/* 概算サマリー */}
      <div className={`text-xs rounded px-3 py-2 ${netCashflow >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        年間概算: 賃料 {Math.round(effectiveRent / 10000)}万 − 経費 {Math.round(expenses / 10000)}万 − ローン {Math.round(loanPaymentEstimate / 10000)}万 = <strong>{netCashflow >= 0 ? '+' : ''}{Math.round(netCashflow / 10000)}万円/年</strong>
        {netCashflow < 0 && ' (持ち出し)'}
      </div>

      {/* 賃料収入 */}
      <div>
        <h5 className="text-xs font-semibold text-gray-500 mb-1">賃料収入</h5>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <NumberField label="月額賃料" value={prop.monthlyRent} onChange={(v) => u({ monthlyRent: v })} step={5_000} suffix="円/月" />
          <NumberField label="空室率" value={prop.vacancyRate} onChange={(v) => u({ vacancyRate: v })} step={1} suffix="%" />
          <NumberField label="管理委託手数料" value={prop.managementCommissionRate} onChange={(v) => u({ managementCommissionRate: v })} step={0.5} suffix="%" />
        </div>
      </div>

      {/* 維持費 */}
      <div>
        <h5 className="text-xs font-semibold text-gray-500 mb-1">維持費</h5>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <NumberField label="固定資産税(年額)" value={prop.propertyTax} onChange={(v) => u({ propertyTax: v })} step={10_000} suffix="円/年" />
          {prop.propertyType === 'condo' && (
            <>
              <NumberField label="管理費(月額)" value={prop.managementFee} onChange={(v) => u({ managementFee: v })} step={1_000} suffix="円/月" />
              <NumberField label="修繕積立金(月額)" value={prop.repairReserveFee} onChange={(v) => u({ repairReserveFee: v })} step={1_000} suffix="円/月" />
            </>
          )}
          {prop.propertyType === 'house' && (
            <NumberField label="修繕費(年額)" value={prop.annualRepairCost} onChange={(v) => u({ annualRepairCost: v })} step={10_000} suffix="円/年" />
          )}
          <NumberField label="その他年間経費" value={prop.otherAnnualCost} onChange={(v) => u({ otherAnnualCost: v })} step={10_000} suffix="円/年" />
        </div>
      </div>

      {/* ローン */}
      <div>
        <label className="flex items-center gap-2 text-sm mb-2">
          <input type="checkbox" checked={prop.hasLoan} onChange={(e) => u({ hasLoan: e.target.checked })} />
          ローン残あり
        </label>
        {prop.hasLoan && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NumberField label="ローン残高" value={prop.loanBalance} onChange={(v) => u({ loanBalance: v })} step={1_000_000} suffix="円" />
            <NumberField label="金利" value={prop.loanInterestRate} onChange={(v) => u({ loanInterestRate: v })} step={0.05} suffix="%" />
            <NumberField label="残年数" value={prop.loanRemainingYears} onChange={(v) => u({ loanRemainingYears: v })} suffix="年" />
            <SelectField
              label="金利タイプ"
              value={prop.loanInterestRateType}
              onChange={(v) => u({ loanInterestRateType: v as 'fixed' | 'variable' })}
              options={[{ value: 'fixed', label: '固定' }, { value: 'variable', label: '変動' }]}
            />
            <SelectField
              label="返済方式"
              value={prop.loanMortgageType}
              onChange={(v) => u({ loanMortgageType: v as 'payment_equal' | 'principal_equal' })}
              options={[{ value: 'payment_equal', label: '元利均等' }, { value: 'principal_equal', label: '元金均等' }]}
            />
          </div>
        )}
        {prop.hasLoan && prop.loanInterestRateType === 'variable' && (
          <div className="mt-2">
            <span className="text-xs text-gray-400">変動金利シナリオ</span>
            {prop.loanVariableRateChanges.map((c, i) => (
              <div key={i} className="flex items-center gap-2 mt-1">
                <NumberField label="" value={c.age} onChange={(v) => {
                  const changes = [...prop.loanVariableRateChanges];
                  changes[i] = { ...c, age: v };
                  u({ loanVariableRateChanges: changes });
                }} suffix="歳〜" />
                <NumberField label="" value={c.rate} onChange={(v) => {
                  const changes = [...prop.loanVariableRateChanges];
                  changes[i] = { ...c, rate: v };
                  u({ loanVariableRateChanges: changes });
                }} step={0.05} suffix="%" />
                <button onClick={() => u({ loanVariableRateChanges: prop.loanVariableRateChanges.filter((_, j) => j !== i) })} className="text-red-400 text-xs">削除</button>
              </div>
            ))}
            <button onClick={() => u({ loanVariableRateChanges: [...prop.loanVariableRateChanges, { age: prop.startAge + 10, rate: 1.0 }] })} className="text-xs text-blue-500 hover:underline mt-1">+ 金利変更</button>
          </div>
        )}
      </div>

      {/* 売却 */}
      <div>
        <h5 className="text-xs font-semibold text-gray-500 mb-1">売却</h5>
        <label className="flex items-center gap-2 text-sm mb-2">
          <input type="checkbox" checked={prop.sellAge !== null} onChange={(e) => u({ sellAge: e.target.checked ? prop.startAge + 10 : null })} />
          売却する
        </label>
        {prop.sellAge !== null && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NumberField label="売却年齢" value={prop.sellAge} onChange={(v) => u({ sellAge: v })} suffix="歳" />
            <NumberField label="売却見込み額" value={prop.salePrice} onChange={(v) => u({ salePrice: v })} step={1_000_000} suffix="円" />
            <NumberField label="売却諸費用" value={prop.saleCost} onChange={(v) => u({ saleCost: v })} step={100_000} suffix="円" />
          </div>
        )}
      </div>
    </div>
  );
}

export function RentalPropertyPanel() {
  const properties = useStore((s) => s.config.rentalProperties ?? []);
  const addRentalProperty = useStore((s) => s.addRentalProperty);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">住居として使わなくなった物件や、投資用物件の賃貸経営を設定します。持ち出し(赤字)の場合も正しく反映されます。</p>

      {properties.map((prop, i) => (
        <PropertyEditor key={prop.id} prop={prop} index={i} />
      ))}

      <button onClick={() => addRentalProperty(newRentalProperty())} className="text-sm text-blue-500 hover:underline">
        + 賃貸物件を追加
      </button>
    </div>
  );
}
