import { SchoolType, ChildEducationPath } from './types';

// ===== 教育費(年額・万円→円換算済み) =====
// 文部科学省「子供の学習費調査」令和3年度 + 大学は文科省調査
export const EDUCATION_ANNUAL_COST: Record<string, Record<string, number>> = {
  preschool: { public: 165_000, private: 309_000 },      // 3年間
  elementary: { public: 353_000, private: 1_667_000 },    // 6年間
  middleSchool: { public: 539_000, private: 1_437_000 },  // 3年間
  highSchool: { public: 513_000, private: 1_054_000 },    // 3年間
  university: {
    national: 1_350_000,        // 国立: 入学金28万+授業料54万≒82万/年 → 4年均すと初年度込みで約135万
    public: 1_400_000,          // 公立
    private_arts: 1_850_000,    // 私立文系
    private_science: 2_100_000, // 私立理系
    private_medical: 4_500_000, // 私立医歯薬
    none: 0,
  },
};

// 大学一人暮らし追加費用(年額)
export const UNIVERSITY_LIVING_ALONE_COST = 1_200_000; // 家賃+生活費

// 教育ステージと期間
export const EDUCATION_STAGES: { key: keyof ChildEducationPath; startOffset: number; duration: number }[] = [
  { key: 'preschool', startOffset: 3, duration: 3 },
  { key: 'elementary', startOffset: 6, duration: 6 },
  { key: 'middleSchool', startOffset: 12, duration: 3 },
  { key: 'highSchool', startOffset: 15, duration: 3 },
  { key: 'university', startOffset: 18, duration: 4 },
];

// ===== 税率テーブル(所得税) =====
export const INCOME_TAX_BRACKETS: { limit: number; rate: number; deduction: number }[] = [
  { limit: 1_950_000, rate: 0.05, deduction: 0 },
  { limit: 3_300_000, rate: 0.10, deduction: 97_500 },
  { limit: 6_950_000, rate: 0.20, deduction: 427_500 },
  { limit: 9_000_000, rate: 0.23, deduction: 636_000 },
  { limit: 18_000_000, rate: 0.33, deduction: 1_536_000 },
  { limit: 40_000_000, rate: 0.40, deduction: 2_796_000 },
  { limit: Infinity, rate: 0.45, deduction: 4_796_000 },
];

// 住民税率
export const RESIDENT_TAX_RATE = 0.10;
// 住民税均等割
export const RESIDENT_TAX_FLAT = 5_000;

// ===== 社会保険料率(概算) =====
export const SOCIAL_INSURANCE_RATE = 0.15; // 健康保険+厚生年金+雇用保険 ≒ 約15%

// ===== 年金 =====
// 老齢基礎年金(満額・令和5年度)
export const BASIC_PENSION_FULL_ANNUAL = 795_000;
// 老齢厚生年金の乗率
export const KOUSEI_PENSION_MULTIPLIER = 0.005481; // 平成15年4月以降

// ===== iDeCo所得控除 =====
// 掛金は全額所得控除

// ===== デフォルト設定 =====
export const CURRENT_YEAR = 2026;

export const DEFAULT_EDUCATION_PATH: ChildEducationPath = {
  preschool: 'public',
  elementary: 'public',
  middleSchool: 'public',
  highSchool: 'public',
  university: 'private_arts',
  universityLiving: 'home',
};
