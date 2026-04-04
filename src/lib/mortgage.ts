import { Housing } from './types';

export interface MortgagePayment {
  year: number;
  payment: number;     // 年間返済額
  principal: number;   // 元金部分
  interest: number;    // 利息部分
  balance: number;     // 残高
}

/**
 * 住宅ローンの返済スケジュールを計算
 * 元利均等(payment_equal) / 元金均等(principal_equal) 対応
 * 変動金利シナリオ対応
 */
export function calcMortgageSchedule(housing: Housing): MortgagePayment[] {
  if (!housing.isOwner || housing.loanAmount <= 0) return [];

  const schedule: MortgagePayment[] = [];
  let balance = housing.loanAmount;
  const totalMonths = housing.loanTermYears * 12;

  // 変動金利の場合、年齢→金利のマップを構築
  const rateByAge = new Map<number, number>();
  if (housing.interestRateType === 'variable' && housing.variableRateChanges.length > 0) {
    for (const change of housing.variableRateChanges) {
      rateByAge.set(change.age, change.rate);
    }
  }

  let currentRate = housing.interestRate / 100;
  let monthlyRate = currentRate / 12;

  if (housing.mortgageType === 'payment_equal') {
    // === 元利均等返済 ===
    // 変動金利の場合は5年ルール・125%ルールは簡略化して無視
    // 金利変更時に残期間で再計算
    let remainingMonths = totalMonths;

    for (let year = 0; year < housing.loanTermYears; year++) {
      const age = housing.purchaseAge + year;

      // 変動金利チェック
      if (rateByAge.has(age)) {
        currentRate = rateByAge.get(age)! / 100;
        monthlyRate = currentRate / 12;
      }

      let yearPayment = 0;
      let yearPrincipal = 0;
      let yearInterest = 0;

      for (let m = 0; m < 12; m++) {
        if (balance <= 0) break;

        // 月々の返済額を残高と残期間で再計算
        let monthlyPayment: number;
        if (monthlyRate === 0) {
          monthlyPayment = balance / remainingMonths;
        } else {
          monthlyPayment =
            (balance * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
            (Math.pow(1 + monthlyRate, remainingMonths) - 1);
        }

        const interestPart = balance * monthlyRate;
        const principalPart = monthlyPayment - interestPart;

        yearPayment += monthlyPayment;
        yearPrincipal += principalPart;
        yearInterest += interestPart;
        balance = Math.max(0, balance - principalPart);
        remainingMonths--;
      }

      schedule.push({
        year,
        payment: Math.round(yearPayment),
        principal: Math.round(yearPrincipal),
        interest: Math.round(yearInterest),
        balance: Math.round(balance),
      });
    }
  } else {
    // === 元金均等返済 ===
    const monthlyPrincipal = housing.loanAmount / totalMonths;

    for (let year = 0; year < housing.loanTermYears; year++) {
      const age = housing.purchaseAge + year;

      if (rateByAge.has(age)) {
        currentRate = rateByAge.get(age)! / 100;
        monthlyRate = currentRate / 12;
      }

      let yearPayment = 0;
      let yearPrincipal = 0;
      let yearInterest = 0;

      for (let m = 0; m < 12; m++) {
        if (balance <= 0) break;
        const interestPart = balance * monthlyRate;
        const principalPart = Math.min(monthlyPrincipal, balance);
        const payment = principalPart + interestPart;

        yearPayment += payment;
        yearPrincipal += principalPart;
        yearInterest += interestPart;
        balance = Math.max(0, balance - principalPart);
      }

      schedule.push({
        year,
        payment: Math.round(yearPayment),
        principal: Math.round(yearPrincipal),
        interest: Math.round(yearInterest),
        balance: Math.round(balance),
      });
    }
  }

  return schedule;
}
