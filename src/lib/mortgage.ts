import { HousingPhase, RentalProperty } from './types';

export interface MortgagePayment {
  year: number;
  payment: number;     // 年間返済額
  principal: number;   // 元金部分
  interest: number;    // 利息部分
  balance: number;     // 残高
}

/**
 * 住宅ローンの返済スケジュールを計算
 * HousingPhase単位で呼び出す
 * already_owned の場合は currentLoanBalance を初期残高として使う
 */
export function calcMortgageSchedule(phase: HousingPhase): MortgagePayment[] {
  if (phase.type === 'rent') return [];

  const initialBalance = phase.propertyStatus === 'already_owned'
    ? phase.currentLoanBalance
    : phase.loanAmount;

  if (initialBalance <= 0) return [];

  const schedule: MortgagePayment[] = [];
  let balance = initialBalance;
  const totalMonths = phase.loanTermYears * 12;

  const rateByAge = new Map<number, number>();
  if (phase.interestRateType === 'variable') {
    for (const change of phase.variableRateChanges) {
      rateByAge.set(change.age, change.rate);
    }
  }

  let currentRate = phase.interestRate / 100;
  let monthlyRate = currentRate / 12;

  if (phase.mortgageType === 'payment_equal') {
    let remainingMonths = totalMonths;

    for (let year = 0; year < phase.loanTermYears; year++) {
      const age = phase.startAge + year;

      if (rateByAge.has(age)) {
        currentRate = rateByAge.get(age)! / 100;
        monthlyRate = currentRate / 12;
      }

      let yearPayment = 0;
      let yearPrincipal = 0;
      let yearInterest = 0;

      for (let m = 0; m < 12; m++) {
        if (balance <= 0 || remainingMonths <= 0) break;

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

      if (balance <= 0) break;
    }
  } else {
    const monthlyPrincipal = initialBalance / totalMonths;

    for (let year = 0; year < phase.loanTermYears; year++) {
      const age = phase.startAge + year;

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

      if (balance <= 0) break;
    }
  }

  return schedule;
}

/**
 * 賃貸物件のローン返済スケジュールを計算
 */
export function calcRentalLoanSchedule(prop: RentalProperty): MortgagePayment[] {
  if (!prop.hasLoan || prop.loanBalance <= 0) return [];

  // HousingPhaseと同じインターフェースに変換して再利用
  const pseudoPhase: HousingPhase = {
    id: prop.id,
    name: prop.name,
    type: prop.propertyType,
    startAge: prop.startAge,
    monthlyRent: 0,
    rentRenewalFee: 0,
    rentRenewalIntervalYears: 0,
    propertyStatus: 'already_owned',
    propertyPrice: 0,
    downPayment: 0,
    loanAmount: 0,
    currentLoanBalance: prop.loanBalance,
    interestRate: prop.loanInterestRate,
    interestRateType: prop.loanInterestRateType,
    variableRateChanges: prop.loanVariableRateChanges,
    loanTermYears: prop.loanRemainingYears,
    mortgageType: prop.loanMortgageType,
    propertyTax: 0,
    managementFee: 0,
    repairReserveFee: 0,
    annualRepairCost: 0,
    renovationSchedule: [],
    sellAtEnd: false,
    salePrice: 0,
    saleCost: 0,
  };

  return calcMortgageSchedule(pseudoPhase);
}
