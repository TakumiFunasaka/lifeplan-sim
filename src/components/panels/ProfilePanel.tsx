'use client';

import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';

export function ProfilePanel() {
  const { profile } = useStore((s) => s.config);
  const updateProfile = useStore((s) => s.updateProfile);
  const { currentSavings } = useStore((s) => s.config);
  const updateConfig = useStore((s) => s.updateConfig);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <NumberField label="現在の年齢" value={profile.currentAge} onChange={(v) => updateProfile({ currentAge: v })} suffix="歳" />
      <NumberField label="退職年齢" value={profile.retirementAge} onChange={(v) => updateProfile({ retirementAge: v })} suffix="歳" />
      <NumberField label="シミュレーション終了" value={profile.endAge} onChange={(v) => updateProfile({ endAge: v })} suffix="歳" />
      <NumberField label="配偶者年齢" value={profile.spouseAge ?? 0} onChange={(v) => updateProfile({ spouseAge: v || null })} suffix="歳" />
      <NumberField label="配偶者退職年齢" value={profile.spouseRetirementAge} onChange={(v) => updateProfile({ spouseRetirementAge: v })} suffix="歳" />
      <NumberField label="現在の貯蓄額" value={currentSavings} onChange={(v) => updateConfig({ currentSavings: v })} step={100000} suffix="円" />
    </div>
  );
}
