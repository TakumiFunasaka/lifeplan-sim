'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SimulationConfig, SimulationResult, Child, Insurance, InvestmentAccount, LifeEvent } from '@/lib/types';
import { DEFAULT_EDUCATION_PATH } from '@/lib/constants';
import { runSimulation } from '@/lib/simulation';

interface Store {
  config: SimulationConfig;
  result: SimulationResult | null;
  // actions
  updateConfig: (partial: Partial<SimulationConfig>) => void;
  updateProfile: (partial: Partial<SimulationConfig['profile']>) => void;
  updateIncome: (partial: Partial<SimulationConfig['income']>) => void;
  updateExpenses: (partial: Partial<SimulationConfig['expenses']>) => void;
  updateHousing: (partial: Partial<SimulationConfig['housing']>) => void;
  updatePension: (partial: Partial<SimulationConfig['pension']>) => void;
  addChild: () => void;
  updateChild: (index: number, child: Child) => void;
  removeChild: (index: number) => void;
  addInsurance: (insurance: Insurance) => void;
  updateInsurance: (index: number, insurance: Insurance) => void;
  removeInsurance: (index: number) => void;
  addInvestment: (account: InvestmentAccount) => void;
  updateInvestment: (index: number, account: InvestmentAccount) => void;
  removeInvestment: (index: number) => void;
  addLifeEvent: (event: LifeEvent) => void;
  updateLifeEvent: (index: number, event: LifeEvent) => void;
  removeLifeEvent: (index: number) => void;
  simulate: () => void;
  resetAll: () => void;
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
    housing: 100_000,
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
  housing: {
    isOwner: false,
    purchaseAge: 33,
    propertyPrice: 45_000_000,
    downPayment: 5_000_000,
    loanAmount: 40_000_000,
    interestRate: 0.5,
    interestRateType: 'variable',
    variableRateChanges: [
      { age: 43, rate: 1.0 },
      { age: 53, rate: 1.5 },
    ],
    loanTermYears: 35,
    mortgageType: 'payment_equal',
    propertyTax: 150_000,
    maintenanceFee: 300_000,
    renovationSchedule: [
      { age: 48, cost: 1_500_000 },
      { age: 58, cost: 2_000_000 },
    ],
  },
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
      name: 'つみたてNISA',
      type: 'tsumitate_nisa',
      monthlyContribution: 100_000,
      expectedReturn: 5.0,
      startAge: 31,
      endAge: 65,
      currentBalance: 500_000,
      annualLimit: 1_200_000,
    },
    {
      name: 'iDeCo',
      type: 'ideco',
      monthlyContribution: 23_000,
      expectedReturn: 4.0,
      startAge: 31,
      endAge: 65,
      currentBalance: 0,
      annualLimit: 276_000,
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

      updateHousing: (partial) =>
        set((state) => ({
          config: { ...state.config, housing: { ...state.config.housing, ...partial } },
        })),

      updatePension: (partial) =>
        set((state) => ({
          config: { ...state.config, pension: { ...state.config.pension, ...partial } },
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
    }),
    {
      name: 'lifeplan-sim-storage',
    }
  )
);
