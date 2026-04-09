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

// ===== 支出フェーズ =====
export interface ExpensePhase {
  id: string;
  name: string; // "現在", "購入後(節約)", "子供独立後", "退職後" など
  startAge: number;
  expenses: Expenses;
}

// ===== 住宅 =====
export type MortgageType = 'principal_equal' | 'payment_equal'; // 元金均等 / 元利均等
export type InterestRateType = 'fixed' | 'variable';
export type HousingType = 'rent' | 'condo' | 'house'; // 賃貸 / マンション購入 / 戸建て購入
export type PropertyStatus = 'new_purchase' | 'already_owned'; // 新規購入 / 既に所有

export interface HousingPhase {
  id: string;
  name: string; // 表示名 (例: "現在のマンション", "賃貸(仮住まい)", "戸建て新居")
  type: HousingType;
  startAge: number; // この住居に住み始める年齢

  // === 賃貸の場合 ===
  monthlyRent: number; // 月額家賃
  rentRenewalFee: number; // 更新料(2年毎等)
  rentRenewalIntervalYears: number; // 更新間隔

  // === 購入(condo/house)の場合 ===
  propertyStatus: PropertyStatus;
  propertyPrice: number; // 物件価格(already_ownedの場合は参考値)
  downPayment: number; // 頭金(新規購入時のみ)
  loanAmount: number; // 借入額(0=ローンなし)
  interestRate: number; // 金利 %
  interestRateType: InterestRateType;
  variableRateChanges: { age: number; rate: number }[];
  loanTermYears: number;
  mortgageType: MortgageType;
  // 残ローン(already_ownedの場合: 現在のローン残高、残期間は loanTermYears で設定)
  currentLoanBalance: number;

  // === 維持費(購入の場合) ===
  propertyTax: number; // 固定資産税(年額)
  managementFee: number; // 管理費(月額、マンションのみ)
  repairReserveFee: number; // 修繕積立金(月額、マンションのみ)
  annualRepairCost: number; // 年間修繕費(戸建ての場合の積立目安)
  renovationSchedule: { yearsAfterStart: number; cost: number }[]; // リフォーム(住み始めてからN年後)

  // === 売却設定 ===
  sellAtEnd: boolean; // このフェーズ終了時に売却するか
  salePrice: number; // 売却見込み額
  saleCost: number; // 売却諸費用(仲介手数料等)
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

// ===== 不動産資産(賃貸経営) =====
export type RentalPropertyType = 'condo' | 'house';

export interface RentalProperty {
  id: string;
  name: string; // "旧マンション(賃貸運用)" etc.
  propertyType: RentalPropertyType;
  startAge: number; // 賃貸運用開始年齢

  // 賃料収入
  monthlyRent: number; // 月額賃料
  vacancyRate: number; // 空室率 %
  managementCommissionRate: number; // 管理委託手数料 (賃料に対する %)

  // 維持費
  propertyTax: number; // 固定資産税(年額)
  managementFee: number; // 管理費(月額、マンションのみ)
  repairReserveFee: number; // 修繕積立金(月額、マンションのみ)
  annualRepairCost: number; // 修繕費(年額、戸建てのみ)
  otherAnnualCost: number; // その他年間経費(保険等)

  // ローン(継続中の場合)
  hasLoan: boolean;
  loanBalance: number; // 運用開始時のローン残高
  loanInterestRate: number; // %
  loanRemainingYears: number;
  loanInterestRateType: InterestRateType;
  loanVariableRateChanges: { age: number; rate: number }[];
  loanMortgageType: MortgageType;

  // 売却
  sellAge: number | null; // null = 売却しない
  salePrice: number;
  saleCost: number; // 売却諸費用
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
  expenses: Expenses; // 後方互換用(expensePhasesが空の場合のフォールバック)
  expensePhases: ExpensePhase[];
  housingPhases: HousingPhase[];
  rentalProperties: RentalProperty[];
  children: Child[];
  insurances: Insurance[];
  investments: InvestmentAccount[];
  pension: Pension;
  lifeEvents: LifeEvent[];
  currentSavings: number; // 現在の貯蓄額
  currentInvestmentBalance: number; // 現在の投資残高(個別設定以外)
  investmentCapToSurplus: boolean; // 投資額を余剰資金で自動キャップ
  retirementDrawdown: boolean; // 退職後に投資を取り崩して生活費に充当
  retirementDrawdownBuffer: number; // 取り崩し時の現金キープ額(これ以下になったら取り崩す)
  postRetirementReturn: number; // 退職後の期待リターン % (リスク資産比率低下を反映)
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
  // 不動産資産
  rentalIncome: number;
  rentalExpense: number;
  rentalNetIncome: number; // 賃料収入 - 経費 - ローン(マイナス=持ち出し)
  rentalLoanBalance: number; // 賃貸物件のローン残高合計
  // netWorth
  netWorth: number; // totalAssets - mortgageBalance - rentalLoanBalance
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
