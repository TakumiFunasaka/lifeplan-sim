'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SimulationConfig, SimulationResult, Child, Insurance, InvestmentAccount, LifeEvent, HousingPhase, RentalProperty } from '@/lib/types';
import { DEFAULT_EDUCATION_PATH } from '@/lib/constants';
import { runSimulation } from '@/lib/simulation';

interface Store {
  config: SimulationConfig;
  result: SimulationResult | null;
  updateConfig: (partial: Partial<SimulationConfig>) => void;
  updateProfile: (partial: Partial<SimulationConfig['profile']>) => void;
  updateIncome: (partial: Partial<SimulationConfig['income']>) => void;
  updateExpenses: (partial: Partial<SimulationConfig['expenses']>) => void;
  updatePension: (partial: Partial<SimulationConfig['pension']>) => void;
  // Housing phases
  addHousingPhase: (phase: HousingPhase) => void;
  updateHousingPhase: (index: number, phase: HousingPhase) => void;
  removeHousingPhase: (index: number) => void;
  // Rental properties
  addRentalProperty: (prop: RentalProperty) => void;
  updateRentalProperty: (index: number, prop: RentalProperty) => void;
  removeRentalProperty: (index: number) => void;
  // Children
  addChild: () => void;
  updateChild: (index: number, child: Child) => void;
  removeChild: (index: number) => void;
  // Insurance
  addInsurance: (insurance: Insurance) => void;
  updateInsurance: (index: number, insurance: Insurance) => void;
  removeInsurance: (index: number) => void;
  // Investment
  addInvestment: (account: InvestmentAccount) => void;
  updateInvestment: (index: number, account: InvestmentAccount) => void;
  removeInvestment: (index: number) => void;
  // Life events
  addLifeEvent: (event: LifeEvent) => void;
  updateLifeEvent: (index: number, event: LifeEvent) => void;
  removeLifeEvent: (index: number) => void;
  simulate: () => void;
  resetAll: () => void;
  exportConfig: () => void;
  importConfig: (json: string) => boolean;
}

const defaultConfig: SimulationConfig = {
  profile: {
    currentAge: 31,
    retirementAge: 65,
    endAge: 100,
    spouseAge: 30,
    spouseRetirementAge: 65,
  },
  income: {
    annualSalary: 5_000_000,
    annualBonus: 1_000_000,
    salaryGrowthRate: 2.0,
    peakAge: 55,
    spouseAnnualSalary: 3_000_000,
    spouseBonus: 500_000,
    spouseSalaryGrowthRate: 1.5,
    spousePeakAge: 55,
    sideIncomeMonthly: 0,
    otherAnnualIncome: 0,
  },
  expenses: {
    food: 60_000,
    utilities: 25_000,
    transportation: 15_000,
    clothing: 10_000,
    medical: 10_000,
    entertainment: 20_000,
    education: 10_000,
    miscellaneous: 15_000,
    otherMonthly: 0,
    annualSpecial: 300_000,
    inflationRate: 1.0,
  },
  housingPhases: [
    {
      id: 'phase-1',
      name: '現在のマンション',
      type: 'condo',
      startAge: 31,
      propertyStatus: 'already_owned',
      propertyPrice: 35_000_000,
      downPayment: 0,
      loanAmount: 0,
      currentLoanBalance: 28_000_000,
      interestRate: 0.5,
      interestRateType: 'variable',
      variableRateChanges: [],
      loanTermYears: 30,
      mortgageType: 'payment_equal',
      monthlyRent: 0,
      rentRenewalFee: 0,
      rentRenewalIntervalYears: 0,
      propertyTax: 120_000,
      managementFee: 15_000,
      repairReserveFee: 12_000,
      annualRepairCost: 0,
      renovationSchedule: [],
      sellAtEnd: true,
      salePrice: 32_000_000,
      saleCost: 1_500_000,
    },
    {
      id: 'phase-2',
      name: '仮住まい(賃貸)',
      type: 'rent',
      startAge: 35,
      propertyStatus: 'new_purchase',
      propertyPrice: 0,
      downPayment: 0,
      loanAmount: 0,
      currentLoanBalance: 0,
      interestRate: 0,
      interestRateType: 'fixed',
      variableRateChanges: [],
      loanTermYears: 0,
      mortgageType: 'payment_equal',
      monthlyRent: 120_000,
      rentRenewalFee: 120_000,
      rentRenewalIntervalYears: 2,
      propertyTax: 0,
      managementFee: 0,
      repairReserveFee: 0,
      annualRepairCost: 0,
      renovationSchedule: [],
      sellAtEnd: false,
      salePrice: 0,
      saleCost: 0,
    },
    {
      id: 'phase-3',
      name: '戸建て新居',
      type: 'house',
      startAge: 36,
      propertyStatus: 'new_purchase',
      propertyPrice: 50_000_000,
      downPayment: 10_000_000,
      loanAmount: 40_000_000,
      currentLoanBalance: 0,
      interestRate: 0.6,
      interestRateType: 'variable',
      variableRateChanges: [
        { age: 46, rate: 1.0 },
        { age: 56, rate: 1.5 },
      ],
      loanTermYears: 35,
      mortgageType: 'payment_equal',
      monthlyRent: 0,
      rentRenewalFee: 0,
      rentRenewalIntervalYears: 0,
      propertyTax: 150_000,
      managementFee: 0,
      repairReserveFee: 0,
      annualRepairCost: 200_000,
      renovationSchedule: [
        { yearsAfterStart: 15, cost: 1_500_000 },
        { yearsAfterStart: 25, cost: 2_500_000 },
      ],
      sellAtEnd: false,
      salePrice: 0,
      saleCost: 0,
    },
  ],
  rentalProperties: [],
  children: [
    {
      birthYear: 2027,
      educationPath: { ...DEFAULT_EDUCATION_PATH },
      extracurricular: 10_000,
    },
  ],
  insurances: [
    {
      name: '収入保障保険',
      type: 'income_protection',
      monthlyPremium: 3_000,
      startAge: 31,
      endAge: 65,
      coverage: 100_000,
      maturityRefund: 0,
      maturityAge: 65,
    },
    {
      name: '医療保険',
      type: 'medical',
      monthlyPremium: 2_500,
      startAge: 31,
      endAge: 100,
      coverage: 5_000,
      maturityRefund: 0,
      maturityAge: 100,
    },
  ],
  investments: [
    {
      name: 'NISA(本人)',
      type: 'tsumitate_nisa',
      monthlyContribution: 100_000,
      expectedReturn: 5.0,
      startAge: 31,
      endAge: 65,
      currentBalance: 7_800_000,
      annualLimit: 3_600_000,
    },
    {
      name: 'NISA(配偶者)',
      type: 'tsumitate_nisa',
      monthlyContribution: 100_000,
      expectedReturn: 5.0,
      startAge: 31,
      endAge: 65,
      currentBalance: 3_300_000,
      annualLimit: 3_600_000,
    },
  ],
  pension: {
    kousei: true,
    kokumin: true,
    enrollmentYears: 38,
    averageStandardRemuneration: 350_000,
    spouseKousei: true,
    spouseEnrollmentYears: 30,
    spouseAverageRemuneration: 250_000,
    corporatePensionMonthly: 0,
    pensionStartAge: 65,
    spousePensionStartAge: 65,
  },
  lifeEvents: [
    { id: '1', name: '車購入', age: 35, lumpSumCost: 3_000_000, annualCost: 400_000, durationYears: 10 },
    { id: '2', name: '車買替', age: 45, lumpSumCost: 3_000_000, annualCost: 400_000, durationYears: 10 },
  ],
  currentSavings: 3_000_000,
  currentInvestmentBalance: 0,
  investmentCapToSurplus: true,
  retirementDrawdown: true,
  retirementDrawdownBuffer: 3_000_000,
  postRetirementReturn: 2.0,
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      result: null,

      updateConfig: (partial) =>
        set((state) => ({ config: { ...state.config, ...partial } })),

      updateProfile: (partial) =>
        set((state) => ({
          config: { ...state.config, profile: { ...state.config.profile, ...partial } },
        })),

      updateIncome: (partial) =>
        set((state) => ({
          config: { ...state.config, income: { ...state.config.income, ...partial } },
        })),

      updateExpenses: (partial) =>
        set((state) => ({
          config: { ...state.config, expenses: { ...state.config.expenses, ...partial } },
        })),

      updatePension: (partial) =>
        set((state) => ({
          config: { ...state.config, pension: { ...state.config.pension, ...partial } },
        })),

      addHousingPhase: (phase) =>
        set((state) => ({
          config: { ...state.config, housingPhases: [...state.config.housingPhases, phase] },
        })),

      updateHousingPhase: (index, phase) =>
        set((state) => {
          const phases = [...state.config.housingPhases];
          phases[index] = phase;
          return { config: { ...state.config, housingPhases: phases } };
        }),

      removeHousingPhase: (index) =>
        set((state) => ({
          config: {
            ...state.config,
            housingPhases: state.config.housingPhases.filter((_, i) => i !== index),
          },
        })),

      addRentalProperty: (prop) =>
        set((state) => ({
          config: { ...state.config, rentalProperties: [...(state.config.rentalProperties ?? []), prop] },
        })),

      updateRentalProperty: (index, prop) =>
        set((state) => {
          const props = [...(state.config.rentalProperties ?? [])];
          props[index] = prop;
          return { config: { ...state.config, rentalProperties: props } };
        }),

      removeRentalProperty: (index) =>
        set((state) => ({
          config: {
            ...state.config,
            rentalProperties: (state.config.rentalProperties ?? []).filter((_, i) => i !== index),
          },
        })),

      addChild: () =>
        set((state) => ({
          config: {
            ...state.config,
            children: [
              ...state.config.children,
              { birthYear: 2028, educationPath: { ...DEFAULT_EDUCATION_PATH }, extracurricular: 10_000 },
            ],
          },
        })),

      updateChild: (index, child) =>
        set((state) => {
          const children = [...state.config.children];
          children[index] = child;
          return { config: { ...state.config, children } };
        }),

      removeChild: (index) =>
        set((state) => ({
          config: {
            ...state.config,
            children: state.config.children.filter((_, i) => i !== index),
          },
        })),

      addInsurance: (insurance) =>
        set((state) => ({
          config: { ...state.config, insurances: [...state.config.insurances, insurance] },
        })),

      updateInsurance: (index, insurance) =>
        set((state) => {
          const insurances = [...state.config.insurances];
          insurances[index] = insurance;
          return { config: { ...state.config, insurances } };
        }),

      removeInsurance: (index) =>
        set((state) => ({
          config: {
            ...state.config,
            insurances: state.config.insurances.filter((_, i) => i !== index),
          },
        })),

      addInvestment: (account) =>
        set((state) => ({
          config: { ...state.config, investments: [...state.config.investments, account] },
        })),

      updateInvestment: (index, account) =>
        set((state) => {
          const investments = [...state.config.investments];
          investments[index] = account;
          return { config: { ...state.config, investments } };
        }),

      removeInvestment: (index) =>
        set((state) => ({
          config: {
            ...state.config,
            investments: state.config.investments.filter((_, i) => i !== index),
          },
        })),

      addLifeEvent: (event) =>
        set((state) => ({
          config: { ...state.config, lifeEvents: [...state.config.lifeEvents, event] },
        })),

      updateLifeEvent: (index, event) =>
        set((state) => {
          const lifeEvents = [...state.config.lifeEvents];
          lifeEvents[index] = event;
          return { config: { ...state.config, lifeEvents } };
        }),

      removeLifeEvent: (index) =>
        set((state) => ({
          config: {
            ...state.config,
            lifeEvents: state.config.lifeEvents.filter((_, i) => i !== index),
          },
        })),

      simulate: () => {
        const result = runSimulation(get().config);
        set({ result });
      },

      resetAll: () => set({ config: defaultConfig, result: null }),

      exportConfig: () => {
        const config = get().config;
        const json = JSON.stringify(config, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        a.download = `lifeplan-${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

      importConfig: (json: string) => {
        try {
          const parsed = JSON.parse(json);
          // 最低限のバリデーション: profileが存在するか
          if (!parsed.profile || typeof parsed.profile.currentAge !== 'number') {
            return false;
          }
          // housingPhasesがなければデフォルトにフォールバック
          if (!Array.isArray(parsed.housingPhases)) {
            parsed.housingPhases = defaultConfig.housingPhases;
          }
          set({ config: { ...defaultConfig, ...parsed }, result: null });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'lifeplan-sim-v4',
      merge: (persisted, current) => {
        const p = persisted as Partial<Store> | undefined;
        if (!p || !p.config) return current;
        // configのマージ: defaultConfigをベースに上書き、配列フィールドはpersistedを優先
        const mergedConfig = { ...current.config, ...p.config };
        if (!Array.isArray(mergedConfig.housingPhases)) {
          mergedConfig.housingPhases = defaultConfig.housingPhases;
        }
        if (!Array.isArray(mergedConfig.rentalProperties)) {
          mergedConfig.rentalProperties = [];
        }
        return { ...current, config: mergedConfig };
      },
    }
  )
);
