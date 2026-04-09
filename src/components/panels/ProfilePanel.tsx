'use client';

import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';

export function ProfilePanel() {
  const { profile } = useStore((s) => s.config);
  const updateProfile = useStore((s) => s.updateProfile);
  const { currentSavings } = useStore((s) => s.config);
  const updateConfig = useStore((s) => s.updateConfig);
  const hasSpouse = profile.spouseAge !== null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NumberField label="現在の年齢" value={profile.currentAge} onChange={(v) => updateProfile({ currentAge: v })} suffix="歳" />
        <NumberField label="退職年齢" value={profile.retirementAge} onChange={(v) => updateProfile({ retirementAge: v })} suffix="歳" />
        <NumberField label="シミュレーション終了" value={profile.endAge} onChange={(v) => updateProfile({ endAge: v })} suffix="歳" />
        <NumberField label="現在の貯蓄額" value={currentSavings} onChange={(v) => updateConfig({ currentSavings: v })} step={100000} suffix="円" />
      </div>
      <div>
        <label className="flex items-center gap-2 text-xs mb-2">
          <input
            type="checkbox"
            checked={hasSpouse}
            onChange={(e) => updateProfile({ spouseAge: e.target.checked ? profile.currentAge - 1 : null })}
          />
          配偶者あり
        </label>
        {hasSpouse && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumberField label="配偶者年齢" value={profile.spouseAge ?? 0} onChange={(v) => updateProfile({ spouseAge: v })} suffix="歳" />
            <NumberField label="配偶者退職年齢" value={profile.spouseRetirementAge} onChange={(v) => updateProfile({ spouseRetirementAge: v })} suffix="歳" />
          </div>
        )}
      </div>
    </div>
  );
}
