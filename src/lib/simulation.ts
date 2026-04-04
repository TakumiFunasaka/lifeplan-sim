import {
  SimulationConfig,
  YearlyResult,
  SimulationResult,
  SimulationSummary,
  HousingPhase,
} from './types';
import { calcNetIncome } from './tax';
import { calcMortgageSchedule, MortgagePayment } from './mortgage';
import { calcTotalEducationCost } from './education';
import { getPensionIncomeForAge } from './pension';
import { CURRENT_YEAR } from './constants';

/**
 * 各年齢でどのHousingPhaseに住んでいるか判定
 * フェーズはstartAgeでソートし、次のフェーズ開始まで有効
 */
function getPhaseForAge(phases: HousingPhase[], age: number): HousingPhase | null {
  const sorted = [...phases].sort((a, b) => a.startAge - b.startAge);
  let current: HousingPhase | null = null;
  for (const p of sorted) {
    if (age >= p.startAge) {
      current = p;
    } else {
      break;
    }
  }
  return current;
}

/**
 * フェーズの終了年齢(= 次のフェーズの開始年齢、なければendAge)
 */
function getPhaseEndAge(phases: HousingPhase[], phase: HousingPhase, endAge: number): number {
  const sorted = [...phases].sort((a, b) => a.startAge - b.startAge);
  const idx = sorted.findIndex(p => p.id === phase.id);
  if (idx >= 0 && idx < sorted.length - 1) {
    return sorted[idx + 1].startAge;
  }
  return endAge + 1;
}

/**
 * メインシミュレーション実行
 */
export function runSimulation(config: SimulationConfig): SimulationResult {
  const { profile, income, expenses, children, insurances, investments, pension, lifeEvents } = config;
  const housingPhases = Array.isArray(config.housingPhases) ? config.housingPhases : [];
  const startYear = CURRENT_YEAR;
  const years = profile.endAge - profile.currentAge + 1;

  // 各購入フェーズのローン返済スケジュールを事前計算
  const mortgageSchedules = new Map<string, Map<number, MortgagePayment>>();
  for (const phase of housingPhases) {
    if (phase.type !== 'rent') {
      const schedule = calcMortgageSchedule(phase);
      const byAge = new Map<number, MortgagePayment>();
      schedule.forEach((mp, i) => {
        byAge.set(phase.startAge + i, mp);
      });
      mortgageSchedules.set(phase.id, byAge);
    }
  }

  const idecoAccounts = investments.filter(a => a.type === 'ideco');

  const yearly: YearlyResult[] = [];
  let cashSavings = config.currentSavings;
  const investmentBalances = new Map<number, number>();
  investments.forEach((acc, i) => {
    investmentBalances.set(i, acc.currentBalance);
  });

  // 前年のフェーズIDを追跡(フェーズ切替時の売却判定用)
  let prevPhaseId: string | null = null;

  for (let y = 0; y < years; y++) {
    const age = profile.currentAge + y;
    const year = startYear + y;

    const eventLabels: string[] = [];
    const incomeBreakdown: Record<string, number> = {};
    const expenseBreakdown: Record<string, number> = {};
    const investmentBreakdown: Record<string, number> = {};

    // ========== 収入 ==========
    let grossSalary = 0;
    let spouseGross = 0;

    if (age < profile.retirementAge) {
      const yearsWorked = y;
      const growthYears = Math.min(yearsWorked, income.peakAge - profile.currentAge);
      const growthFactor = growthYears > 0 ? Math.pow(1 + income.salaryGrowthRate / 100, growthYears) : 1;
      grossSalary = Math.round((income.annualSalary + income.annualBonus) * growthFactor);
    }

    const spouseAge = profile.spouseAge !== null ? profile.spouseAge + y : null;
    if (spouseAge !== null && spouseAge < profile.spouseRetirementAge) {
      const spouseYears = y;
      const spouseGrowthYears = Math.min(spouseYears, income.spousePeakAge - (profile.spouseAge ?? 0));
      const spouseGrowthFactor = spouseGrowthYears > 0
        ? Math.pow(1 + income.spouseSalaryGrowthRate / 100, spouseGrowthYears) : 1;
      spouseGross = Math.round((income.spouseAnnualSalary + income.spouseBonus) * spouseGrowthFactor);
    }

    const idecoAnnual = idecoAccounts
      .filter(a => age >= a.startAge && age <= a.endAge)
      .reduce((sum, a) => sum + a.monthlyContribution * 12, 0);

    const selfNet = calcNetIncome(grossSalary, idecoAnnual);
    const spouseNet = calcNetIncome(spouseGross, 0);
    const pensionIncome = getPensionIncomeForAge(age, pension, profile);
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

    // ========== 住居費 ==========
    let housingCost = 0;
    let mortgagePayment = 0;
    let mortgagePrincipal = 0;
    let mortgageInterest = 0;
    let mortgageBalance = 0;

    const currentPhase = getPhaseForAge(housingPhases, age);

    // フェーズ切替時: 前フェーズの売却処理
    if (currentPhase && prevPhaseId && currentPhase.id !== prevPhaseId) {
      const prevPhase = housingPhases.find(p => p.id === prevPhaseId);
      if (prevPhase && prevPhase.sellAtEnd && prevPhase.type !== 'rent') {
        // 売却益 = 売却額 - 諸費用 - ローン残高
        const prevMortgage = mortgageSchedules.get(prevPhase.id);
        let remainingLoan = 0;
        if (prevMortgage) {
          // 前年(= 売却時)のローン残高を取得
          const prevYearAge = age - 1;
          const mp = prevMortgage.get(prevYearAge);
          if (mp) remainingLoan = mp.balance;
        }
        const saleProceeds = prevPhase.salePrice - prevPhase.saleCost - remainingLoan;
        cashSavings += saleProceeds;
        eventLabels.push(`${prevPhase.name}売却(${saleProceeds >= 0 ? '+' : ''}${Math.round(saleProceeds / 10000)}万)`);
      }
    }

    if (currentPhase) {
      if (currentPhase.type === 'rent') {
        // 賃貸
        housingCost = currentPhase.monthlyRent * 12;
        // 更新料
        const yearsInPhase = age - currentPhase.startAge;
        if (currentPhase.rentRenewalIntervalYears > 0 && yearsInPhase > 0 && yearsInPhase % currentPhase.rentRenewalIntervalYears === 0) {
          housingCost += currentPhase.rentRenewalFee;
        }
      } else {
        // 購入(condo/house)
        const phaseSchedule = mortgageSchedules.get(currentPhase.id);

        // フェーズ開始年: 新規購入なら頭金
        if (age === currentPhase.startAge && currentPhase.propertyStatus === 'new_purchase') {
          housingCost += currentPhase.downPayment;
          eventLabels.push(`${currentPhase.name}購入`);
        }

        // ローン返済
        if (phaseSchedule) {
          const mp = phaseSchedule.get(age);
          if (mp) {
            mortgagePayment = mp.payment;
            mortgagePrincipal = mp.principal;
            mortgageInterest = mp.interest;
            mortgageBalance = mp.balance;
            housingCost += mp.payment;
          } else {
            // ローン完済後 or 範囲外
            // 最後のエントリの残高を確認
            const lastAge = Math.max(...Array.from(phaseSchedule.keys()));
            if (age > lastAge) {
              mortgageBalance = 0;
            }
          }
        }

        // 維持費
        housingCost += currentPhase.propertyTax;

        if (currentPhase.type === 'condo') {
          housingCost += (currentPhase.managementFee + currentPhase.repairReserveFee) * 12;
        } else {
          // 戸建て
          housingCost += currentPhase.annualRepairCost;
        }

        // リフォーム
        const yearsInPhase = age - currentPhase.startAge;
        for (const reno of currentPhase.renovationSchedule) {
          if (reno.yearsAfterStart === yearsInPhase) {
            housingCost += reno.cost;
            eventLabels.push(`${currentPhase.name}リフォーム`);
          }
        }
      }
    }

    expenseBreakdown['住居費'] = housingCost;
    prevPhaseId = currentPhase?.id ?? null;

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
      const annualReturn = acc.expectedReturn / 100;
      balance = Math.round(balance * (1 + annualReturn));

      if (age >= acc.startAge && age <= acc.endAge) {
        let annualContribution = acc.monthlyContribution * 12;
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
    const yrs = Math.max(0, Math.min(acc.endAge, profile.endAge) - Math.max(acc.startAge, profile.currentAge) + 1);
    return s + acc.monthlyContribution * 12 * yrs;
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
