import {
  SimulationConfig,
  YearlyResult,
  SimulationResult,
  SimulationSummary,
} from './types';
import { calcNetIncome } from './tax';
import { calcMortgageSchedule, MortgagePayment } from './mortgage';
import { calcTotalEducationCost } from './education';
import { getPensionIncomeForAge } from './pension';
import { CURRENT_YEAR } from './constants';

/**
 * メインシミュレーション実行
 */
export function runSimulation(config: SimulationConfig): SimulationResult {
  const { profile, income, expenses, housing, children, insurances, investments, pension, lifeEvents } = config;
  const startYear = CURRENT_YEAR;
  const years = profile.endAge - profile.currentAge + 1;

  // ローン返済スケジュールを事前計算
  const mortgageSchedule = calcMortgageSchedule(housing);
  const mortgageByAge = new Map<number, MortgagePayment>();
  mortgageSchedule.forEach((mp, i) => {
    mortgageByAge.set(housing.purchaseAge + i, mp);
  });

  // iDeCo年額を計算(税控除用)
  const idecoAccounts = investments.filter(a => a.type === 'ideco');

  // 結果配列
  const yearly: YearlyResult[] = [];

  let cashSavings = config.currentSavings;
  // 投資残高は各口座の currentBalance の合計で初期化
  const investmentBalances = new Map<number, number>();
  investments.forEach((acc, i) => {
    investmentBalances.set(i, acc.currentBalance);
  });

  for (let y = 0; y < years; y++) {
    const age = profile.currentAge + y;
    const year = startYear + y;
    const spouseAge = profile.spouseAge !== null ? profile.spouseAge + y : null;

    const eventLabels: string[] = [];
    const incomeBreakdown: Record<string, number> = {};
    const expenseBreakdown: Record<string, number> = {};
    const investmentBreakdown: Record<string, number> = {};

    // ========== 収入 ==========
    let grossSalary = 0;
    let spouseGross = 0;

    if (age < profile.retirementAge) {
      // 昇給計算
      const yearsWorked = y;
      const growthYears = Math.min(yearsWorked, income.peakAge - profile.currentAge);
      const growthFactor = growthYears > 0 ? Math.pow(1 + income.salaryGrowthRate / 100, growthYears) : 1;
      grossSalary = Math.round((income.annualSalary + income.annualBonus) * growthFactor);
    }

    if (spouseAge !== null && spouseAge < profile.spouseRetirementAge) {
      const spouseYears = y;
      const spouseGrowthYears = Math.min(spouseYears, income.spousePeakAge - (profile.spouseAge ?? 0));
      const spouseGrowthFactor = spouseGrowthYears > 0
        ? Math.pow(1 + income.spouseSalaryGrowthRate / 100, spouseGrowthYears) : 1;
      spouseGross = Math.round((income.spouseAnnualSalary + income.spouseBonus) * spouseGrowthFactor);
    }

    // iDeCo控除額
    const idecoAnnual = idecoAccounts
      .filter(a => age >= a.startAge && age <= a.endAge)
      .reduce((sum, a) => sum + a.monthlyContribution * 12, 0);

    const selfNet = calcNetIncome(grossSalary, idecoAnnual);
    const spouseNet = calcNetIncome(spouseGross, 0);

    // 年金
    const pensionIncome = getPensionIncomeForAge(age, pension, profile);

    // 副業・その他
    const sideIncome = age < profile.retirementAge ? income.sideIncomeMonthly * 12 : 0;
    const otherIncome = income.otherAnnualIncome;

    const totalIncome = selfNet.netIncome + spouseNet.netIncome + pensionIncome + sideIncome + otherIncome;

    incomeBreakdown['給与(本人)'] = selfNet.netIncome;
    incomeBreakdown['給与(配偶者)'] = spouseNet.netIncome;
    incomeBreakdown['年金'] = pensionIncome;
    incomeBreakdown['副業'] = sideIncome;
    incomeBreakdown['その他'] = otherIncome;

    // ========== 支出 ==========
    const inflationFactor = Math.pow(1 + expenses.inflationRate / 100, y);

    // 生活費
    const baseLiving = (
      expenses.food + expenses.utilities + expenses.transportation +
      expenses.clothing + expenses.medical + expenses.entertainment +
      expenses.education + expenses.miscellaneous + expenses.otherMonthly
    ) * 12 + expenses.annualSpecial;
    const livingExpenses = Math.round(baseLiving * inflationFactor);

    expenseBreakdown['食費'] = Math.round(expenses.food * 12 * inflationFactor);
    expenseBreakdown['光熱・通信'] = Math.round(expenses.utilities * 12 * inflationFactor);
    expenseBreakdown['交通費'] = Math.round(expenses.transportation * 12 * inflationFactor);
    expenseBreakdown['被服'] = Math.round(expenses.clothing * 12 * inflationFactor);
    expenseBreakdown['医療'] = Math.round(expenses.medical * 12 * inflationFactor);
    expenseBreakdown['娯楽'] = Math.round(expenses.entertainment * 12 * inflationFactor);
    expenseBreakdown['自己投資'] = Math.round(expenses.education * 12 * inflationFactor);
    expenseBreakdown['雑費'] = Math.round(expenses.miscellaneous * 12 * inflationFactor);
    expenseBreakdown['特別支出'] = Math.round(expenses.annualSpecial * inflationFactor);

    // 住居費
    let housingCost = 0;
    let mortgagePayment = 0;
    let mortgagePrincipal = 0;
    let mortgageInterest = 0;
    let mortgageBalance = 0;

    if (housing.isOwner) {
      const mp = mortgageByAge.get(age);
      if (mp) {
        mortgagePayment = mp.payment;
        mortgagePrincipal = mp.principal;
        mortgageInterest = mp.interest;
        mortgageBalance = mp.balance;
        housingCost = mp.payment;
      } else if (age >= housing.purchaseAge) {
        // ローン完済後 → 維持費のみ
        mortgageBalance = 0;
      } else {
        // 購入前 → 家賃
        housingCost = expenses.housing * 12;
      }

      // 頭金(購入年)
      if (age === housing.purchaseAge) {
        housingCost += housing.downPayment;
        eventLabels.push('住宅購入');
      }

      // 維持費(購入後)
      if (age >= housing.purchaseAge) {
        housingCost += housing.propertyTax + housing.maintenanceFee;
      }

      // リフォーム
      for (const reno of housing.renovationSchedule) {
        if (reno.age === age) {
          housingCost += reno.cost;
          eventLabels.push('リフォーム');
        }
      }
    } else {
      housingCost = Math.round(expenses.housing * 12 * inflationFactor);
    }

    expenseBreakdown['住居費'] = housingCost;

    // 教育費
    const eduResult = calcTotalEducationCost(children, year);
    const childEducationCost = eduResult.total;
    expenseBreakdown['教育費'] = childEducationCost;

    for (const detail of eduResult.details) {
      if (detail.stage) {
        const childAge = year - children[detail.childIndex].birthYear;
        if (detail.stage === 'university' && childAge === 18) {
          eventLabels.push(`子${detail.childIndex + 1}大学入学`);
        }
        if (detail.stage === 'elementary' && childAge === 6) {
          eventLabels.push(`子${detail.childIndex + 1}小学校入学`);
        }
      }
    }

    // 保険料
    let insurancePremium = 0;
    for (const ins of insurances) {
      if (age >= ins.startAge && age <= ins.endAge) {
        insurancePremium += ins.monthlyPremium * 12;
      }
      // 満期返戻金
      if (ins.maturityAge === age && ins.maturityRefund > 0) {
        cashSavings += ins.maturityRefund;
        eventLabels.push(`${ins.name}満期`);
      }
    }
    expenseBreakdown['保険料'] = insurancePremium;

    // ライフイベント
    let eventCost = 0;
    for (const event of lifeEvents) {
      if (event.age === age) {
        eventCost += event.lumpSumCost;
        eventLabels.push(event.name);
      }
      if (age >= event.age && age < event.age + event.durationYears) {
        eventCost += event.annualCost;
      }
    }
    expenseBreakdown['イベント'] = eventCost;

    const totalExpenses = livingExpenses + housingCost + childEducationCost + insurancePremium + eventCost;

    // ========== 投資 ==========
    let totalInvestmentBalance = 0;
    let totalContribution = 0;

    investments.forEach((acc, i) => {
      let balance = investmentBalances.get(i) || 0;

      // 運用益
      const annualReturn = acc.expectedReturn / 100;
      balance = Math.round(balance * (1 + annualReturn));

      // 積立
      if (age >= acc.startAge && age <= acc.endAge) {
        let annualContribution = acc.monthlyContribution * 12;
        // 年間上限チェック
        if (acc.annualLimit && annualContribution > acc.annualLimit) {
          annualContribution = acc.annualLimit;
        }
        balance += annualContribution;
        totalContribution += annualContribution;
      }

      investmentBalances.set(i, balance);
      totalInvestmentBalance += balance;
      investmentBreakdown[acc.name] = balance;
    });

    // ========== キャッシュフロー ==========
    const annualCashflow = totalIncome - totalExpenses - totalContribution;
    cashSavings += annualCashflow;

    // ========== 結果格納 ==========
    yearly.push({
      age,
      year,
      grossIncome: grossSalary + spouseGross,
      netIncome: selfNet.netIncome,
      spouseNetIncome: spouseNet.netIncome,
      pensionIncome,
      totalIncome,
      livingExpenses,
      housingCost,
      childEducationCost,
      insurancePremium,
      totalExpenses,
      cashSavings: Math.round(cashSavings),
      investmentBalance: Math.round(totalInvestmentBalance),
      totalAssets: Math.round(cashSavings + totalInvestmentBalance),
      mortgageBalance: Math.round(mortgageBalance),
      mortgagePayment,
      mortgagePrincipal,
      mortgageInterest,
      netWorth: Math.round(cashSavings + totalInvestmentBalance - mortgageBalance),
      annualCashflow: Math.round(annualCashflow),
      eventLabels,
      incomeBreakdown,
      expenseBreakdown,
      investmentBreakdown,
    });
  }

  // ========== サマリー ==========
  const retirementYear = yearly.find(y => y.age === profile.retirementAge);
  const endYear = yearly[yearly.length - 1];
  const bottomYear = yearly.reduce((min, y) => y.totalAssets < min.totalAssets ? y : min, yearly[0]);
  const negativeYear = yearly.find(y => y.totalAssets < 0);

  const totalMortgageInterest = yearly.reduce((s, y) => s + y.mortgageInterest, 0);
  const totalInsurancePremium = yearly.reduce((s, y) => s + y.insurancePremium, 0);
  const totalEducationCost = yearly.reduce((s, y) => s + y.childEducationCost, 0);
  const totalContributions = investments.reduce((s, acc) => {
    const years = Math.max(0, Math.min(acc.endAge, profile.endAge) - Math.max(acc.startAge, profile.currentAge) + 1);
    return s + acc.monthlyContribution * 12 * years;
  }, 0) + investments.reduce((s, a) => s + a.currentBalance, 0);
  const finalInvestment = endYear.investmentBalance;
  const totalInvestmentGain = finalInvestment - totalContributions;

  const summary: SimulationSummary = {
    retirementAssets: retirementYear?.totalAssets ?? 0,
    retirementNetWorth: retirementYear?.netWorth ?? 0,
    endAssets: endYear.totalAssets,
    endNetWorth: endYear.netWorth,
    assetBottomAge: bottomYear.age,
    assetBottomAmount: bottomYear.totalAssets,
    totalMortgageInterest,
    totalInsurancePremium,
    totalEducationCost,
    totalInvestmentGain,
    negativeAge: negativeYear?.age ?? null,
  };

  return { yearly, summary };
}
