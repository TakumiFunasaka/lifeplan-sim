import {
  INCOME_TAX_BRACKETS,
  RESIDENT_TAX_RATE,
  RESIDENT_TAX_FLAT,
  SOCIAL_INSURANCE_RATE,
} from './constants';

/**
 * 給与所得控除を計算
 * 令和2年分以降
 */
export function calcSalaryDeduction(grossSalary: number): number {
  if (grossSalary <= 1_625_000) return 550_000;
  if (grossSalary <= 1_800_000) return grossSalary * 0.4 - 100_000;
  if (grossSalary <= 3_600_000) return grossSalary * 0.3 + 80_000;
  if (grossSalary <= 6_600_000) return grossSalary * 0.2 + 440_000;
  if (grossSalary <= 8_500_000) return grossSalary * 0.1 + 1_100_000;
  return 1_950_000; // 上限
}

/**
 * 所得税を計算(基礎控除48万、給与所得控除、社会保険料控除適用後)
 */
export function calcIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxableIncome <= bracket.limit) {
      return Math.floor(taxableIncome * bracket.rate - bracket.deduction);
    }
  }
  // fallback (shouldn't reach)
  const last = INCOME_TAX_BRACKETS[INCOME_TAX_BRACKETS.length - 1];
  return Math.floor(taxableIncome * last.rate - last.deduction);
}

/**
 * 社会保険料を概算
 */
export function calcSocialInsurance(grossSalary: number): number {
  return Math.floor(grossSalary * SOCIAL_INSURANCE_RATE);
}

/**
 * 額面年収から手取りを計算
 * iDeCoの掛金は所得控除として反映
 */
export function calcNetIncome(grossAnnual: number, idecoAnnual: number = 0): {
  netIncome: number;
  incomeTax: number;
  residentTax: number;
  socialInsurance: number;
} {
  if (grossAnnual <= 0) {
    return { netIncome: 0, incomeTax: 0, residentTax: 0, socialInsurance: 0 };
  }

  const socialInsurance = calcSocialInsurance(grossAnnual);
  const salaryDeduction = calcSalaryDeduction(grossAnnual);
  const basicDeduction = 480_000;

  // 課税所得 = 額面 - 給与所得控除 - 社会保険料 - 基礎控除 - iDeCo
  const taxableIncome = Math.max(
    0,
    grossAnnual - salaryDeduction - socialInsurance - basicDeduction - idecoAnnual
  );

  const incomeTax = calcIncomeTax(taxableIncome);
  // 復興特別所得税
  const reconstructionTax = Math.floor(incomeTax * 0.021);
  const residentTax = Math.floor(taxableIncome * RESIDENT_TAX_RATE) + RESIDENT_TAX_FLAT;

  const netIncome = grossAnnual - socialInsurance - incomeTax - reconstructionTax - residentTax;

  return { netIncome: Math.max(0, netIncome), incomeTax, residentTax, socialInsurance };
}
