'use client';

import { useStore } from '@/hooks/use-store';
import { NumberField } from '../NumberField';
import { SelectField } from '../SelectField';
import { DEFAULT_EDUCATION_PATH } from '@/lib/constants';
import { ChildEducationPath, SchoolType } from '@/lib/types';

const schoolOptions = [
  { value: 'public', label: '公立' },
  { value: 'private', label: '私立' },
];

const uniOptions = [
  { value: 'national', label: '国立大学' },
  { value: 'public', label: '公立大学' },
  { value: 'private_arts', label: '私立文系' },
  { value: 'private_science', label: '私立理系' },
  { value: 'private_medical', label: '私立医歯薬' },
  { value: 'none', label: '進学しない' },
];

const livingOptions = [
  { value: 'home', label: '自宅通学' },
  { value: 'alone', label: '一人暮らし' },
];

export function ChildrenPanel() {
  const children = useStore((s) => s.config.children);
  const addChild = useStore((s) => s.addChild);
  const updateChild = useStore((s) => s.updateChild);
  const removeChild = useStore((s) => s.removeChild);

  return (
    <div className="space-y-4">
      {children.map((child, i) => (
        <div key={i} className="border border-gray-100 rounded p-3 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">子供 {i + 1}</span>
            <button onClick={() => removeChild(i)} className="text-red-400 text-xs hover:text-red-600">削除</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NumberField label="生まれ年(西暦)" value={child.birthYear} onChange={(v) => updateChild(i, { ...child, birthYear: v })} />
            <NumberField label="習い事(月額)" value={child.extracurricular} onChange={(v) => updateChild(i, { ...child, extracurricular: v })} step={5000} suffix="円" />
          </div>
          <div>
            <h5 className="text-xs text-gray-500 mb-1">教育進路</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <SelectField label="幼稚園" value={child.educationPath.preschool} onChange={(v) => updateChild(i, { ...child, educationPath: { ...child.educationPath, preschool: v as SchoolType } })} options={schoolOptions} />
              <SelectField label="小学校" value={child.educationPath.elementary} onChange={(v) => updateChild(i, { ...child, educationPath: { ...child.educationPath, elementary: v as SchoolType } })} options={schoolOptions} />
              <SelectField label="中学校" value={child.educationPath.middleSchool} onChange={(v) => updateChild(i, { ...child, educationPath: { ...child.educationPath, middleSchool: v as SchoolType } })} options={schoolOptions} />
              <SelectField label="高校" value={child.educationPath.highSchool} onChange={(v) => updateChild(i, { ...child, educationPath: { ...child.educationPath, highSchool: v as SchoolType } })} options={schoolOptions} />
              <SelectField label="大学" value={child.educationPath.university} onChange={(v) => updateChild(i, { ...child, educationPath: { ...child.educationPath, university: v as ChildEducationPath['university'] } })} options={uniOptions} />
              <SelectField label="大学住居" value={child.educationPath.universityLiving} onChange={(v) => updateChild(i, { ...child, educationPath: { ...child.educationPath, universityLiving: v as 'home' | 'alone' } })} options={livingOptions} />
            </div>
          </div>
        </div>
      ))}
      <button onClick={addChild} className="text-sm text-blue-500 hover:underline">+ 子供を追加</button>
    </div>
  );
}
