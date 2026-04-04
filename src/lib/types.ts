// ===== プロファイル =====
export interface Profile {
  currentAge: number;
  retirementAge: number;
  endAge: number; // シミュレーション終了年齢 (デフォ100)
  spouseAge: number | null; // null = 配偶者なし
  spouseRetirementAge: number;
}

// ===== 収入 =====
export interface Income {
  annualSalary: number; // 額面年収
  annualBonus: number; // ボーナス(額面)
  salaryGrowthRate: number; // 昇給率 %
  peakAge: number; // 昇給停止年齢
  spouseAnnualSalary: number;
  spouseBonus: number;
  spouseSalaryGrowthRate: number;
  spousePeakAge: number;
  sideIncomeMonthly: number; // 副業月収
  otherAnnualIncome: number; // その他年収(不動産等)
}

// ===== 支出(月額ベース) =====
export interface Expenses {
  housing: number; // 家賃 (持ち家の場合は0にしてローンで管理)
  food: number;
  utilities: number; // 光熱費・通信費
  transportation: number;
  clothing: number;
  medical: number;
  entertainment: number;
  education: number; // 習い事・自己投資(子供の教育費は別)
  miscellaneous: number;
  otherMonthly: number;
  annualSpecial: number; // 年間特別支出(旅行・帰省等)
  inflationRate: number; // インフレ率 %
}

// ===== 住宅 =====
export type MortgageType = 'principal_equal' | 'payment_equal'; // 元金均等 / 元利均等
export type InterestRateType = 'fixed' | 'variable';

export interface Housing {
  isOwner: boolean;
  // 購入時
  purchaseAge: number;
  propertyPrice: number; // 物件価格
  downPayment: number; // 頭金
  loanAmount: number; // 借入額
  interestRate: number; // 金利 %
  interestRateType: InterestRateType;
  variableRateChanges: { age: number; rate: number }[]; // 変動金利のシナリオ
  loanTermYears: number; // 借入期間
  mortgageType: MortgageType;
  // 維持費(年額)
  propertyTax: number; // 固定資産税
  maintenanceFee: number; // 修繕積立金+管理費(年額)
  renovationSchedule: { age: number; cost: number }[]; // リフォーム計画
}

// ===== 子供 =====
export type SchoolType = 'public' | 'private';
export interface ChildEducationPath {
  preschool: SchoolType;
  elementary: SchoolType;
  middleSchool: SchoolType;
  highSchool: SchoolType;
  university: 'national' | 'public' | 'private_arts' | 'private_science' | 'private_medical' | 'none';
  universityLiving: 'home' | 'alone'; // 自宅通学 or 一人暮らし
}

export interface Child {
  birthYear: number; // 子供が生まれる年(西暦) or すでに生まれている場合はその年
  educationPath: ChildEducationPath;
  extracurricular: number; // 習い事月額
}

// ===== 保険 =====
export type InsuranceType = 'life_term' | 'life_whole' | 'medical' | 'cancer' | 'disability' | 'income_protection' | 'individual_annuity';

export interface Insurance {
  name: string;
  type: InsuranceType;
  monthlyPremium: number;
  startAge: number;
  endAge: number;
  coverage: number; // 保障額(死亡保険金、一時金等)
  maturityRefund: number; // 満期返戻金
  maturityAge: number; // 満期年齢
}

// ===== 投資 =====
export interface InvestmentAccount {
  name: string;
  type: 'tsumitate_nisa' | 'growth_nisa' | 'ideco' | 'taxable' | 'corporate_dc';
  monthlyContribution: number;
  expectedReturn: number; // 期待リターン %
  startAge: number;
  endAge: number; // 積立終了年齢
  currentBalance: number; // 現在の残高
  annualLimit?: number; // 年間上限額
}

// ===== 年金 =====
export interface Pension {
  kousei: boolean; // 厚生年金加入
  kokumin: boolean; // 国民年金
  enrollmentYears: number; // 加入年数(見込み)
  averageStandardRemuneration: number; // 平均標準報酬月額
  spouseKousei: boolean;
  spouseEnrollmentYears: number;
  spouseAverageRemuneration: number;
  corporatePensionMonthly: number; // 企業年金月額
  pensionStartAge: number; // 受給開始年齢
  spousePensionStartAge: number;
}

// ===== ライフイベント =====
export interface LifeEvent {
  id: string;
  name: string;
  age: number;
  lumpSumCost: number; // 一時費用
  annualCost: number; // 年間継続費用
  durationYears: number; // 継続年数
}

// ===== 全設定 =====
export interface SimulationConfig {
  profile: Profile;
  income: Income;
  expenses: Expenses;
  housing: Housing;
  children: Child[];
  insurances: Insurance[];
  investments: InvestmentAccount[];
  pension: Pension;
  lifeEvents: LifeEvent[];
  currentSavings: number; // 現在の貯蓄額
  currentInvestmentBalance: number; // 現在の投資残高(個別設定以外)
}

// ===== シミュレーション結果 =====
export interface YearlyResult {
  age: number;
  year: number;
  // 収入
  grossIncome: number;
  netIncome: number;
  spouseNetIncome: number;
  pensionIncome: number;
  totalIncome: number;
  // 支出
  livingExpenses: number;
  housingCost: number; // ローン返済 or 家賃
  childEducationCost: number;
  insurancePremium: number;
  totalExpenses: number;
  // 資産
  cashSavings: number;
  investmentBalance: number;
  totalAssets: number;
  // ローン
  mortgageBalance: number;
  mortgagePayment: number;
  mortgagePrincipal: number;
  mortgageInterest: number;
  // netWorth
  netWorth: number; // totalAssets - mortgageBalance
  // メタ
  annualCashflow: number;
  eventLabels: string[];
  // 内訳
  incomeBreakdown: Record<string, number>;
  expenseBreakdown: Record<string, number>;
  investmentBreakdown: Record<string, number>;
}

export interface SimulationResult {
  yearly: YearlyResult[];
  summary: SimulationSummary;
}

export interface SimulationSummary {
  retirementAssets: number;
  retirementNetWorth: number;
  endAssets: number;
  endNetWorth: number;
  assetBottomAge: number;
  assetBottomAmount: number;
  totalMortgageInterest: number;
  totalInsurancePremium: number;
  totalEducationCost: number;
  totalInvestmentGain: number;
  negativeAge: number | null; // 資産がマイナスになる年齢
}
