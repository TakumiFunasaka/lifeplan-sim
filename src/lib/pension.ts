import { Pension, Profile } from './types';
import { BASIC_PENSION_FULL_ANNUAL, KOUSEI_PENSION_MULTIPLIER } from './constants';

/**
 * 年金受給額を計算(年額)
 * 老齢基礎年金 + 老齢厚生年金
 */
export function calcAnnualPension(pension: Pension, profile: Profile): {
  selfPension: number;
  spousePension: number;
} {
  // === 本人 ===
  let selfBasic = 0;
  let selfKousei = 0;

  if (pension.kokumin || pension.kousei) {
    // 老齢基礎年金: 満額 × (加入月数 / 480)
    const months = Math.min(pension.enrollmentYears * 12, 480);
    selfBasic = Math.round(BASIC_PENSION_FULL_ANNUAL * (months / 480));
  }

  if (pension.kousei) {
    // 老齢厚生年金(報酬比例部分)
    // 年額 = 平均標準報酬月額 × 乗率 × 加入月数
    selfKousei = Math.round(
      pension.averageStandardRemuneration * KOUSEI_PENSION_MULTIPLIER * pension.enrollmentYears * 12
    );
  }

  // === 配偶者 ===
  let spouseBasic = 0;
  let spouseKousei = 0;

  if (profile.spouseAge !== null) {
    if (pension.spouseKousei) {
      const spouseMonths = Math.min(pension.spouseEnrollmentYears * 12, 480);
      spouseBasic = Math.round(BASIC_PENSION_FULL_ANNUAL * (spouseMonths / 480));
      spouseKousei = Math.round(
        pension.spouseAverageRemuneration *
          KOUSEI_PENSION_MULTIPLIER *
          pension.spouseEnrollmentYears *
          12
      );
    } else {
      // 第3号被保険者(専業主婦/主夫)の場合も基礎年金は受給
      const spouseMonths = Math.min(pension.spouseEnrollmentYears * 12, 480);
      spouseBasic = Math.round(BASIC_PENSION_FULL_ANNUAL * (spouseMonths / 480));
    }
  }

  return {
    selfPension: selfBasic + selfKousei,
    spousePension: spouseBasic + spouseKousei,
  };
}

/**
 * 特定の年齢で年金収入があるか判定し、年額を返す
 */
export function getPensionIncomeForAge(
  age: number,
  pension: Pension,
  profile: Profile
): number {
  const { selfPension, spousePension } = calcAnnualPension(pension, profile);

  let total = 0;

  // 本人の年金
  if (age >= pension.pensionStartAge) {
    total += selfPension;
  }

  // 配偶者の年金
  if (profile.spouseAge !== null) {
    const spouseAge = age - (profile.currentAge - profile.spouseAge);
    if (spouseAge >= pension.spousePensionStartAge) {
      total += spousePension;
    }
  }

  // 企業年金(退職後)
  if (age >= profile.retirementAge) {
    total += pension.corporatePensionMonthly * 12;
  }

  return total;
}
