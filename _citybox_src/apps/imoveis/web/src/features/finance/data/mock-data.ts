import type { CommissionConfigState, ExpenseEntry } from '../types';

export const DEFAULT_COMMISSION_CONFIG: CommissionConfigState = {
  global: {
    defaultCommissionPercent: 6,
    defaultSplit: {
      agencyPercent: 50,
      captorPercent: 25,
      sellerPercent: 25,
    },
  },
  agentOverrides: [
    {
      agentId: 'bruno-costa',
      captorPercentOverride: 35,
      sellerPercentOverride: 20,
    },
  ],
};

export const EXPENSES_SEED: readonly ExpenseEntry[] = [
  {
    id: 'exp-1',
    label: 'Marketing digital',
    amountCents: 350_00,
    date: '2026-07-10',
    category: 'Marketing',
  },
  {
    id: 'exp-2',
    label: 'Assinatura CRM',
    amountCents: 199_00,
    date: '2026-07-05',
    category: 'Software',
  },
  {
    id: 'exp-3',
    label: 'Combustível — visitas',
    amountCents: 280_00,
    date: '2026-07-18',
    category: 'Operacional',
  },
  {
    id: 'exp-4',
    label: 'Cartório',
    amountCents: 450_00,
    date: '2026-06-28',
    category: 'Operacional',
  },
] as const;

export function cloneCommissionConfig(state: CommissionConfigState): CommissionConfigState {
  return {
    global: { ...state.global, defaultSplit: { ...state.global.defaultSplit } },
    agentOverrides: state.agentOverrides.map((o) => ({ ...o })),
  };
}

export function cloneExpenses(): ExpenseEntry[] {
  return EXPENSES_SEED.map((e) => ({ ...e }));
}
