'use client';

import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';

export function PensionPanel() {
  const pension = useStore((s) => s.config.pension);
  const updatePension = useStore((s) => s.updatePension);
  const hasSpouse = useStore((s) => s.config.profile.spouseAge !== null);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-[11px] font-semibold text-gray-500 mb-2">本人</h4>
        <div className="flex gap-4 mb-2">
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={pension.kousei} onChange={(e) => updatePension({ kousei: e.target.checked })} />
            厚生年金
          </label>
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={pension.kokumin} onChange={(e) => updatePension({ kokumin: e.target.checked })} />
            国民年金
          </label>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <NumberField label="加入年数(見込み)" value={pension.enrollmentYears} onChange={(v) => updatePension({ enrollmentYears: v })} suffix="年" />
          <NumberField label="平均標準報酬月額" value={pension.averageStandardRemuneration} onChange={(v) => updatePension({ averageStandardRemuneration: v })} step={10000} suffix="円" />
          <NumberField label="受給開始年齢" value={pension.pensionStartAge} onChange={(v) => updatePension({ pensionStartAge: v })} suffix="歳" />
        </div>
      </div>
      {hasSpouse && (
        <div>
          <h4 className="text-[11px] font-semibold text-gray-500 mb-2">配偶者</h4>
          <label className="flex items-center gap-1 text-xs mb-2">
            <input type="checkbox" checked={pension.spouseKousei} onChange={(e) => updatePension({ spouseKousei: e.target.checked })} />
            厚生年金加入
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NumberField label="加入年数" value={pension.spouseEnrollmentYears} onChange={(v) => updatePension({ spouseEnrollmentYears: v })} suffix="年" />
            <NumberField label="平均標準報酬月額" value={pension.spouseAverageRemuneration} onChange={(v) => updatePension({ spouseAverageRemuneration: v })} step={10000} suffix="円" />
            <NumberField label="受給開始年齢" value={pension.spousePensionStartAge} onChange={(v) => updatePension({ spousePensionStartAge: v })} suffix="歳" />
          </div>
        </div>
      )}
      <div>
        <h4 className="text-[11px] font-semibold text-gray-500 mb-2">企業年金</h4>
        <NumberField label="企業年金(月額)" value={pension.corporatePensionMonthly} onChange={(v) => updatePension({ corporatePensionMonthly: v })} step={10000} suffix="円" />
      </div>
    </div>
  );
}
