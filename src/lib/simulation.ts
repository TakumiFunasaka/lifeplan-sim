import {
  SimulationConfig,
  YearlyResult,
  SimulationResult,
  SimulationSummary,
  HousingPhase,
  Expenses,
  ExpensePhase,
  IncomePhase,
  SalaryIncome,
  BusinessIncome,
} from './types';
import { calcNetIncome } from './tax';
import { calcMortgageSchedule, calcRentalLoanSchedule, MortgagePayment } from './mortgage';
import { calcTotalEducationCost } from './education';
import { getPensionIncomeForAge } from './pension';
import { CURRENT_YEAR } from './constants';

/**
 * 各年齢でどの収入フェーズかを判定
 */
function getIncomePhaseForAge(phases: IncomePhase[], age: number): IncomePhase | null {
  if (!phases || phases.length === 0) return null;
  const sorted = [...phases].sort((a, b) => a.startAge - b.startAge);
  let current: IncomePhase | null = null;
  for (const p of sorted) {
    if (age >= p.startAge) current = p;
    else break;
  }
  return current;
}

/**
 * 収入フェーズから年間額面収入を計算
 */
function calcPhaseIncome(phase: IncomePhase, age: number, startAge: number): number {
  if (phase.type === 'none') return 0;

  if (phase.type === 'salary') {
    const sp = phase as SalaryIncome;
    const yearsInPhase = age - phase.startAge;
    const growthYears = Math.min(yearsInPhase, sp.peakAge - phase.startAge);
    const growthFactor = growthYears > 0 ? Math.pow(1 + sp.growthRate / 100, growthYears) : 1;
    return Math.round((sp.annualSalary + sp.annualBonus) * growthFactor);
  }

  if (phase.type === 'business') {
    const bp = phase as BusinessIncome;
    const yearsInBusiness = age - phase.startAge;
    // 立ち上げ期
    const rampUp = yearsInBusiness === 0 ? bp.rampUpYear1
      : yearsInBusiness === 1 ? bp.rampUpYear2 : 1.0;
    // 客数成長(3年目以降)
    const growthFactor = yearsInBusiness >= 2
      ? Math.pow(1 + bp.growthRate / 100, yearsInBusiness - 2) : 1;
    const effectiveCustomers = bp.dailyCustomers * rampUp * growthFactor;
    // 月売上 = 客単価 × 客数 × 営業日
    const monthlySales = (bp.customerPrice / 10000) * effectiveCustomers * bp.workDaysPerMonth;
    // 月経費
    const monthlyExpenses = bp.monthlyRent + bp.staffCount * bp.staffMonthlyCost + bp.otherMonthlyCost;
    // 年間オーナー取り分(万円)→円に変換して返す
    return Math.max(0, Math.round((monthlySales - monthlyExpenses) * 12)) * 10000;
  }

  return 0;
}

/**
 * 各年齢でどの支出フェーズかを判定
 */
function getExpenseForAge(phases: ExpensePhase[], age: number, fallback: Expenses): Expenses {
  if (!phases || phases.length === 0) return fallback;
  const sorted = [...phases].sort((a, b) => a.startAge - b.startAge);
  let current: Expenses = fallback;
  for (const p of sorted) {
    if (age >= p.startAge) current = p.expenses;
    else break;
  }
  return current;
}

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

  // 賃貸物件のローン返済スケジュールを事前計算
  const rentalProperties = Array.isArray(config.rentalProperties) ? config.rentalProperties : [];
  const rentalLoanSchedules = new Map<string, Map<number, MortgagePayment>>();
  for (const prop of rentalProperties) {
    if (prop.hasLoan && prop.loanBalance > 0) {
      const schedule = calcRentalLoanSchedule(prop);
      const byAge = new Map<number, MortgagePayment>();
      schedule.forEach((mp, i) => {
        byAge.set(prop.startAge + i, mp);
      });
      rentalLoanSchedules.set(prop.id, byAge);
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

    const selfIncomePhases = Array.isArray(config.incomePhases) ? config.incomePhases : [];
    const spouseIncomePhases = Array.isArray(config.spouseIncomePhases) ? config.spouseIncomePhases : [];

    if (age < profile.retirementAge) {
      const selfPhase = getIncomePhaseForAge(selfIncomePhases, age);
      if (selfPhase) {
        grossSalary = calcPhaseIncome(selfPhase, age, profile.currentAge);
      } else {
        // フォールバック: 従来のIncome
        const yearsWorked = y;
        const growthYears = Math.min(yearsWorked, income.peakAge - profile.currentAge);
        const growthFactor = growthYears > 0 ? Math.pow(1 + income.salaryGrowthRate / 100, growthYears) : 1;
        grossSalary = Math.round((income.annualSalary + income.annualBonus) * growthFactor);
      }
    }

    const spouseAge = profile.spouseAge !== null ? profile.spouseAge + y : null;
    if (spouseAge !== null && spouseAge < profile.spouseRetirementAge) {
      const spousePhase = getIncomePhaseForAge(spouseIncomePhases, spouseAge);
      if (spousePhase) {
        spouseGross = calcPhaseIncome(spousePhase, spouseAge, profile.spouseAge ?? 0);
      } else {
        const spouseYears = y;
        const spouseGrowthYears = Math.min(spouseYears, income.spousePeakAge - (profile.spouseAge ?? 0));
        const spouseGrowthFactor = spouseGrowthYears > 0
          ? Math.pow(1 + income.spouseSalaryGrowthRate / 100, spouseGrowthYears) : 1;
        spouseGross = Math.round((income.spouseAnnualSalary + income.spouseBonus) * spouseGrowthFactor);
      }
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
    const expensePhases = Array.isArray(config.expensePhases) ? config.expensePhases : [];
    const currentExpenses = getExpenseForAge(expensePhases, age, expenses);
    const inflationFactor = Math.pow(1 + currentExpenses.inflationRate / 100, y);

    const baseLiving = (
      currentExpenses.food + currentExpenses.utilities + currentExpenses.transportation +
      currentExpenses.clothing + currentExpenses.medical + currentExpenses.entertainment +
      currentExpenses.education + currentExpenses.miscellaneous + currentExpenses.otherMonthly
    ) * 12 + currentExpenses.annualSpecial;
    const livingExpenses = Math.round(baseLiving * inflationFactor);

    expenseBreakdown['食費'] = Math.round(currentExpenses.food * 12 * inflationFactor);
    expenseBreakdown['光熱・通信'] = Math.round(currentExpenses.utilities * 12 * inflationFactor);
    expenseBreakdown['交通費'] = Math.round(currentExpenses.transportation * 12 * inflationFactor);
    expenseBreakdown['被服'] = Math.round(currentExpenses.clothing * 12 * inflationFactor);
    expenseBreakdown['医療'] = Math.round(currentExpenses.medical * 12 * inflationFactor);
    expenseBreakdown['娯楽'] = Math.round(currentExpenses.entertainment * 12 * inflationFactor);
    expenseBreakdown['自己投資'] = Math.round(currentExpenses.education * 12 * inflationFactor);
    expenseBreakdown['雑費'] = Math.round(currentExpenses.miscellaneous * 12 * inflationFactor);
    expenseBreakdown['特別支出'] = Math.round(currentExpenses.annualSpecial * inflationFactor);

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

    // まず全口座の運用益を計算(退職後はリターン低下)
    const isRetired = age >= profile.retirementAge;
    const postRetReturn = config.postRetirementReturn ?? 2.0;
    investments.forEach((acc, i) => {
      let balance = investmentBalances.get(i) || 0;
      const annualReturn = (isRetired ? postRetReturn : acc.expectedReturn) / 100;
      balance = Math.round(balance * (1 + annualReturn));
      investmentBalances.set(i, balance);
    });

    // 希望積立額を集計
    let desiredContribution = 0;
    const accountContributions: { index: number; desired: number }[] = [];
    investments.forEach((acc, i) => {
      if (age >= acc.startAge && age <= acc.endAge) {
        let annualContribution = acc.monthlyContribution * 12;
        if (acc.annualLimit && annualContribution > acc.annualLimit) {
          annualContribution = acc.annualLimit;
        }
        desiredContribution += annualContribution;
        accountContributions.push({ index: i, desired: annualContribution });
      }
    });

    // 余剰連動: 投資前の余剰で積立額をキャップ
    let actualTotalContribution = desiredContribution;
    if (config.investmentCapToSurplus && desiredContribution > 0) {
      // 投資前の年間余剰(不動産収支はこの後なので概算)
      const surplusBeforeInvest = totalIncome - totalExpenses;
      actualTotalContribution = Math.max(0, Math.min(desiredContribution, surplusBeforeInvest));
    }

    // 按分して各口座に積立
    const contributionRatio = desiredContribution > 0 ? actualTotalContribution / desiredContribution : 0;
    for (const ac of accountContributions) {
      const actualContrib = Math.round(ac.desired * contributionRatio);
      const balance = investmentBalances.get(ac.index) || 0;
      investmentBalances.set(ac.index, balance + actualContrib);
      totalContribution += actualContrib;
    }

    // 残高集計
    investments.forEach((acc, i) => {
      const balance = investmentBalances.get(i) || 0;
      totalInvestmentBalance += balance;
      investmentBreakdown[acc.name || `口座${i + 1}`] = balance;
    });

    // ========== 不動産資産(賃貸経営) ==========
    let rentalIncome = 0;
    let rentalExpense = 0;
    let rentalLoanBalance = 0;
    let rentalLoanPayment = 0;

    for (const prop of rentalProperties) {
      // 売却済みチェック
      if (prop.sellAge !== null && age >= prop.sellAge) {
        // 売却年にキャッシュ反映
        if (age === prop.sellAge) {
          // 売却時のローン残高
          let loanBal = 0;
          const loanSched = rentalLoanSchedules.get(prop.id);
          if (loanSched) {
            const prevMp = loanSched.get(age - 1);
            if (prevMp) loanBal = prevMp.balance;
          }
          const proceeds = prop.salePrice - prop.saleCost - loanBal;
          cashSavings += proceeds;
          eventLabels.push(`${prop.name}売却(${proceeds >= 0 ? '+' : ''}${Math.round(proceeds / 10000)}万)`);
        }
        continue;
      }

      if (age < prop.startAge) continue;

      // 賃料収入
      const grossRent = prop.monthlyRent * 12;
      const effectiveRent = Math.round(grossRent * (1 - prop.vacancyRate / 100));
      const commission = Math.round(effectiveRent * prop.managementCommissionRate / 100);
      rentalIncome += effectiveRent;

      // 経費
      let propExpense = commission + prop.propertyTax + prop.otherAnnualCost;
      if (prop.propertyType === 'condo') {
        propExpense += (prop.managementFee + prop.repairReserveFee) * 12;
      } else {
        propExpense += prop.annualRepairCost;
      }
      rentalExpense += propExpense;

      // ローン返済
      const loanSched = rentalLoanSchedules.get(prop.id);
      if (loanSched) {
        const mp = loanSched.get(age);
        if (mp) {
          rentalLoanPayment += mp.payment;
          rentalLoanBalance += mp.balance;
        }
      }
    }

    const rentalNetIncome = rentalIncome - rentalExpense - rentalLoanPayment;
    incomeBreakdown['不動産'] = rentalNetIncome;
    if (rentalIncome > 0 || rentalExpense > 0) {
      expenseBreakdown['不動産経費'] = rentalExpense + rentalLoanPayment;
    }

    // ========== キャッシュフロー ==========
    const annualCashflow = totalIncome + rentalNetIncome - totalExpenses - totalContribution;
    cashSavings += annualCashflow;

    // ========== 退職後取り崩し ==========
    // 現金がバッファ以下になったら投資を取り崩して補填
    if (config.retirementDrawdown && age >= profile.retirementAge && totalInvestmentBalance > 0) {
      const buffer = config.retirementDrawdownBuffer || 0;
      if (cashSavings < buffer) {
        const needed = buffer - cashSavings + Math.abs(Math.min(0, annualCashflow)); // 来年分も見越して少し多めに
        const drawdown = Math.min(needed, totalInvestmentBalance);
        if (drawdown > 0) {
          // 各口座から残高按分で取り崩し
          const drawdownRatio = drawdown / totalInvestmentBalance;
          let actualDrawdown = 0;
          investments.forEach((_, i) => {
            const bal = investmentBalances.get(i) || 0;
            const sell = Math.round(bal * drawdownRatio);
            investmentBalances.set(i, bal - sell);
            actualDrawdown += sell;
          });
          cashSavings += actualDrawdown;
          totalInvestmentBalance -= actualDrawdown;
          // investmentBreakdownを更新
          investments.forEach((acc, i) => {
            investmentBreakdown[acc.name || `口座${i + 1}`] = investmentBalances.get(i) || 0;
          });
        }
      }
    }

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
      rentalIncome,
      rentalExpense: rentalExpense + rentalLoanPayment,
      rentalNetIncome,
      rentalLoanBalance: Math.round(rentalLoanBalance),
      netWorth: Math.round(cashSavings + totalInvestmentBalance - mortgageBalance - rentalLoanBalance),
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
