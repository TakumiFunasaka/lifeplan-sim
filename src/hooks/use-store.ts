'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SimulationConfig, SimulationResult, Child, Insurance, InvestmentAccount, LifeEvent, HousingPhase, RentalProperty, ExpensePhase, IncomePhase } from '@/lib/types';
import { DEFAULT_EDUCATION_PATH } from '@/lib/constants';
import { runSimulation } from '@/lib/simulation';

export interface Scenario {
  id: string;
  name: string;
  config: SimulationConfig;
  result: SimulationResult | null;
}

interface Store {
  // マルチシナリオ
  scenarios: Scenario[];
  activeId: string | null;

  // アクティブシナリオのショートカット(パネル互換用)
  config: SimulationConfig;
  result: SimulationResult | null;

  // シナリオ管理
  openScenario: (json: string, name: string) => boolean;
  newScenario: (name?: string) => void;
  closeScenario: (id: string) => void;
  switchScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  duplicateScenario: () => void;
  saveScenario: () => void; // アクティブシナリオをJSONダウンロード

  // 設定変更(アクティブシナリオに適用)
  updateConfig: (partial: Partial<SimulationConfig>) => void;
  updateProfile: (partial: Partial<SimulationConfig['profile']>) => void;
  updateIncome: (partial: Partial<SimulationConfig['income']>) => void;
  updateExpenses: (partial: Partial<SimulationConfig['expenses']>) => void;
  addExpensePhase: (phase: ExpensePhase) => void;
  updateExpensePhase: (index: number, phase: ExpensePhase) => void;
  removeExpensePhase: (index: number) => void;
  // Income phases
  addIncomePhase: (target: 'self' | 'spouse', phase: IncomePhase) => void;
  updateIncomePhase: (target: 'self' | 'spouse', index: number, phase: IncomePhase) => void;
  removeIncomePhase: (target: 'self' | 'spouse', index: number) => void;
  updatePension: (partial: Partial<SimulationConfig['pension']>) => void;
  addHousingPhase: (phase: HousingPhase) => void;
  updateHousingPhase: (index: number, phase: HousingPhase) => void;
  removeHousingPhase: (index: number) => void;
  addRentalProperty: (prop: RentalProperty) => void;
  updateRentalProperty: (index: number, prop: RentalProperty) => void;
  removeRentalProperty: (index: number) => void;
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
  exportConfig: (filename?: string) => void;
  importConfig: (json: string) => boolean;
}

const defaultConfig: SimulationConfig = {
  profile: { currentAge: 30, retirementAge: 65, endAge: 95, spouseAge: null, spouseRetirementAge: 65 },
  income: { annualSalary: 4_000_000, annualBonus: 800_000, salaryGrowthRate: 2.0, peakAge: 55, spouseAnnualSalary: 0, spouseBonus: 0, spouseSalaryGrowthRate: 1.5, spousePeakAge: 55, sideIncomeMonthly: 0, otherAnnualIncome: 0 },
  incomePhases: [],
  spouseIncomePhases: [],
  expenses: { food: 40_000, utilities: 15_000, transportation: 10_000, clothing: 10_000, medical: 5_000, entertainment: 20_000, education: 5_000, miscellaneous: 10_000, otherMonthly: 0, annualSpecial: 200_000, inflationRate: 1.5 },
  expensePhases: [],
  housingPhases: [],
  rentalProperties: [],
  children: [],
  insurances: [],
  investments: [],
  pension: { kousei: true, kokumin: true, enrollmentYears: 40, averageStandardRemuneration: 350_000, spouseKousei: false, spouseEnrollmentYears: 0, spouseAverageRemuneration: 0, corporatePensionMonthly: 0, pensionStartAge: 65, spousePensionStartAge: 65 },
  lifeEvents: [],
  currentSavings: 1_000_000,
  currentInvestmentBalance: 0,
  investmentCapToSurplus: true,
  retirementDrawdown: true,
  retirementDrawdownBuffer: 3_000_000,
  postRetirementReturn: 1.5,
};

function parseConfig(json: string): SimulationConfig | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.profile || typeof parsed.profile.currentAge !== 'number') return null;
    if (!Array.isArray(parsed.housingPhases)) parsed.housingPhases = [];
    if (!Array.isArray(parsed.rentalProperties)) parsed.rentalProperties = [];
    if (!Array.isArray(parsed.expensePhases)) parsed.expensePhases = [];
    if (!Array.isArray(parsed.incomePhases)) parsed.incomePhases = [];
    if (!Array.isArray(parsed.spouseIncomePhases)) parsed.spouseIncomePhases = [];
    return { ...defaultConfig, ...parsed };
  } catch {
    return null;
  }
}

function downloadJson(data: object, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// アクティブシナリオのconfigを更新するヘルパー
function updateActive(state: { scenarios: Scenario[]; activeId: string | null }, newConfig: SimulationConfig) {
  const scenarios = state.scenarios.map(s =>
    s.id === state.activeId ? { ...s, config: newConfig, result: null } : s
  );
  return { scenarios, config: newConfig, result: null };
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      scenarios: [],
      activeId: null,
      config: defaultConfig,
      result: null,

      // === シナリオ管理 ===
      openScenario: (json, name) => {
        const config = parseConfig(json);
        if (!config) return false;
        const id = `s-${Date.now()}`;
        const result = runSimulation(config);
        const scenario: Scenario = { id, name, config, result };
        set((state) => ({
          scenarios: [...state.scenarios, scenario],
          activeId: id,
          config,
          result,
        }));
        return true;
      },

      newScenario: (name = '新規シナリオ') => {
        const config = JSON.parse(JSON.stringify(defaultConfig)) as SimulationConfig;
        const id = `s-${Date.now()}`;
        const result = runSimulation(config);
        const scenario: Scenario = { id, name, config, result };
        set((state) => ({
          scenarios: [...state.scenarios, scenario],
          activeId: id,
          config,
          result,
        }));
      },

      closeScenario: (id) => {
        set((state) => {
          const scenarios = state.scenarios.filter(s => s.id !== id);
          if (state.activeId === id) {
            const next = scenarios[0] ?? null;
            return {
              scenarios,
              activeId: next?.id ?? null,
              config: next?.config ?? defaultConfig,
              result: next?.result ?? null,
            };
          }
          return { scenarios };
        });
      },

      switchScenario: (id) => {
        const state = get();
        // 現在のアクティブを保存
        const scenarios = state.scenarios.map(s =>
          s.id === state.activeId ? { ...s, config: state.config, result: state.result } : s
        );
        const target = scenarios.find(s => s.id === id);
        if (!target) return;
        set({ scenarios, activeId: id, config: target.config, result: target.result });
      },

      renameScenario: (id, name) => {
        set((state) => ({
          scenarios: state.scenarios.map(s => s.id === id ? { ...s, name } : s),
        }));
      },

      duplicateScenario: () => {
        const state = get();
        const active = state.scenarios.find(s => s.id === state.activeId);
        if (!active) return;
        const id = `s-${Date.now()}`;
        const newScenario: Scenario = {
          id,
          name: `${active.name}のコピー`,
          config: JSON.parse(JSON.stringify(state.config)),
          result: state.result,
        };
        set((state) => ({
          scenarios: [...state.scenarios, newScenario],
          activeId: id,
          config: newScenario.config,
          result: newScenario.result,
        }));
      },

      saveScenario: () => {
        const state = get();
        const active = state.scenarios.find(s => s.id === state.activeId);
        if (!active) return;
        // まずscenariosを最新configで更新
        const scenarios = state.scenarios.map(s =>
          s.id === state.activeId ? { ...s, config: state.config, result: state.result } : s
        );
        set({ scenarios });
        downloadJson(state.config, active.name);
      },

      // === 設定変更 ===
      updateConfig: (partial) =>
        set((state) => {
          const newConfig = { ...state.config, ...partial };
          return updateActive(state, newConfig);
        }),

      updateProfile: (partial) =>
        set((state) => {
          const newConfig = { ...state.config, profile: { ...state.config.profile, ...partial } };
          return updateActive(state, newConfig);
        }),

      updateIncome: (partial) =>
        set((state) => {
          const newConfig = { ...state.config, income: { ...state.config.income, ...partial } };
          return updateActive(state, newConfig);
        }),

      updateExpenses: (partial) =>
        set((state) => {
          const newConfig = { ...state.config, expenses: { ...state.config.expenses, ...partial } };
          return updateActive(state, newConfig);
        }),

      addExpensePhase: (phase) =>
        set((state) => {
          return updateActive(state, { ...state.config, expensePhases: [...(state.config.expensePhases ?? []), phase] });
        }),

      updateExpensePhase: (index, phase) =>
        set((state) => {
          const phases = [...(state.config.expensePhases ?? [])];
          phases[index] = phase;
          return updateActive(state, { ...state.config, expensePhases: phases });
        }),

      removeExpensePhase: (index) =>
        set((state) => {
          return updateActive(state, { ...state.config, expensePhases: (state.config.expensePhases ?? []).filter((_, i) => i !== index) });
        }),

      addIncomePhase: (target, phase) =>
        set((state) => {
          const key = target === 'self' ? 'incomePhases' : 'spouseIncomePhases';
          return updateActive(state, { ...state.config, [key]: [...(state.config[key] ?? []), phase] });
        }),

      updateIncomePhase: (target, index, phase) =>
        set((state) => {
          const key = target === 'self' ? 'incomePhases' : 'spouseIncomePhases';
          const phases = [...(state.config[key] ?? [])];
          phases[index] = phase;
          return updateActive(state, { ...state.config, [key]: phases });
        }),

      removeIncomePhase: (target, index) =>
        set((state) => {
          const key = target === 'self' ? 'incomePhases' : 'spouseIncomePhases';
          return updateActive(state, { ...state.config, [key]: (state.config[key] ?? []).filter((_, i) => i !== index) });
        }),

      updatePension: (partial) =>
        set((state) => {
          const newConfig = { ...state.config, pension: { ...state.config.pension, ...partial } };
          return updateActive(state, newConfig);
        }),

      addHousingPhase: (phase) =>
        set((state) => {
          const newConfig = { ...state.config, housingPhases: [...state.config.housingPhases, phase] };
          return updateActive(state, newConfig);
        }),

      updateHousingPhase: (index, phase) =>
        set((state) => {
          const phases = [...state.config.housingPhases];
          phases[index] = phase;
          return updateActive(state, { ...state.config, housingPhases: phases });
        }),

      removeHousingPhase: (index) =>
        set((state) => {
          return updateActive(state, { ...state.config, housingPhases: state.config.housingPhases.filter((_, i) => i !== index) });
        }),

      addRentalProperty: (prop) =>
        set((state) => {
          return updateActive(state, { ...state.config, rentalProperties: [...(state.config.rentalProperties ?? []), prop] });
        }),

      updateRentalProperty: (index, prop) =>
        set((state) => {
          const props = [...(state.config.rentalProperties ?? [])];
          props[index] = prop;
          return updateActive(state, { ...state.config, rentalProperties: props });
        }),

      removeRentalProperty: (index) =>
        set((state) => {
          return updateActive(state, { ...state.config, rentalProperties: (state.config.rentalProperties ?? []).filter((_, i) => i !== index) });
        }),

      addChild: () =>
        set((state) => {
          return updateActive(state, {
            ...state.config,
            children: [...state.config.children, { birthYear: 2028, educationPath: { ...DEFAULT_EDUCATION_PATH }, extracurricular: 10_000 }],
          });
        }),

      updateChild: (index, child) =>
        set((state) => {
          const children = [...state.config.children];
          children[index] = child;
          return updateActive(state, { ...state.config, children });
        }),

      removeChild: (index) =>
        set((state) => {
          return updateActive(state, { ...state.config, children: state.config.children.filter((_, i) => i !== index) });
        }),

      addInsurance: (insurance) =>
        set((state) => {
          return updateActive(state, { ...state.config, insurances: [...state.config.insurances, insurance] });
        }),

      updateInsurance: (index, insurance) =>
        set((state) => {
          const insurances = [...state.config.insurances];
          insurances[index] = insurance;
          return updateActive(state, { ...state.config, insurances });
        }),

      removeInsurance: (index) =>
        set((state) => {
          return updateActive(state, { ...state.config, insurances: state.config.insurances.filter((_, i) => i !== index) });
        }),

      addInvestment: (account) =>
        set((state) => {
          return updateActive(state, { ...state.config, investments: [...state.config.investments, account] });
        }),

      updateInvestment: (index, account) =>
        set((state) => {
          const investments = [...state.config.investments];
          investments[index] = account;
          return updateActive(state, { ...state.config, investments });
        }),

      removeInvestment: (index) =>
        set((state) => {
          return updateActive(state, { ...state.config, investments: state.config.investments.filter((_, i) => i !== index) });
        }),

      addLifeEvent: (event) =>
        set((state) => {
          return updateActive(state, { ...state.config, lifeEvents: [...state.config.lifeEvents, event] });
        }),

      updateLifeEvent: (index, event) =>
        set((state) => {
          const lifeEvents = [...state.config.lifeEvents];
          lifeEvents[index] = event;
          return updateActive(state, { ...state.config, lifeEvents });
        }),

      removeLifeEvent: (index) =>
        set((state) => {
          return updateActive(state, { ...state.config, lifeEvents: state.config.lifeEvents.filter((_, i) => i !== index) });
        }),

      simulate: () => {
        const state = get();
        const result = runSimulation(state.config);
        const scenarios = state.scenarios.map(s =>
          s.id === state.activeId ? { ...s, config: state.config, result } : s
        );
        set({ result, scenarios });
      },

      resetAll: () => set({ scenarios: [], activeId: null, config: defaultConfig, result: null }),

      exportConfig: (filename?: string) => {
        const config = get().config;
        const name = filename || `lifeplan-${new Date().toISOString().slice(0, 10)}`;
        downloadJson(config, name);
      },

      importConfig: (json: string) => {
        const config = parseConfig(json);
        if (!config) return false;
        set({ config, result: null });
        return true;
      },
    }),
    {
      name: 'lifeplan-sim-v7',
      partialize: (state) => ({
        // resultは保存しない(configから再計算可能、サイズが大きくlocalStorageを溢れさせる)
        scenarios: state.scenarios.map(s => ({ id: s.id, name: s.name, config: s.config, result: null })),
        activeId: state.activeId,
        config: state.config,
      }),
      onRehydrateStorage: () => (state) => {
        // 復元後にシミュレーションを再実行
        if (state && state.scenarios.length > 0) {
          const scenarios = state.scenarios.map(s => ({
            ...s,
            result: s.config ? runSimulation(s.config) : null,
          }));
          const active = scenarios.find(s => s.id === state.activeId);
          useStore.setState({
            scenarios,
            result: active?.result ?? null,
          });
        }
      },
    }
  )
);
