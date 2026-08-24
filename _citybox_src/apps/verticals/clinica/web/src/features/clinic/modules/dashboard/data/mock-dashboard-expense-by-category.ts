import type { DashboardExpenseByCategoryEntry } from '../types/clinic-dashboard';

/** Cores fixas por categoria (mock): verde, azul, amarelo. */
export const EXPENSE_CATEGORY_COLORS = {
  'exp-cat-labs': '#16a34a',
  'exp-cat-fixed': '#2563eb',
  'exp-cat-commissions': '#eab308',
} as const;

export const EXPENSE_CATEGORY_LABELS = {
  'exp-cat-labs': 'Laboratórios',
  'exp-cat-fixed':
    'Custos Fixos (aluguel, telefone, internet, licença de software)',
  'exp-cat-commissions': 'Comissões',
} as const;

/**
 * Lançamentos de despesa por categoria (mock).
 * Jul/2026 soma ≈ R$ 23.608,98 (Labs 14.500 / Fixos 5.600 / Comissões 3.508,98).
 */
export const MOCK_DASHBOARD_EXPENSE_BY_CATEGORY: DashboardExpenseByCategoryEntry[] =
  [
    {
      id: 'exp-001',
      date: '2026-07-03',
      categoryId: 'exp-cat-labs',
      categoryName: EXPENSE_CATEGORY_LABELS['exp-cat-labs'],
      amountCents: 800_000,
    },
    {
      id: 'exp-002',
      date: '2026-07-10',
      categoryId: 'exp-cat-labs',
      categoryName: EXPENSE_CATEGORY_LABELS['exp-cat-labs'],
      amountCents: 650_000,
    },
    {
      id: 'exp-003',
      date: '2026-07-18',
      categoryId: 'exp-cat-fixed',
      categoryName: EXPENSE_CATEGORY_LABELS['exp-cat-fixed'],
      amountCents: 560_000,
    },
    {
      id: 'exp-004',
      date: '2026-07-22',
      categoryId: 'exp-cat-commissions',
      categoryName: EXPENSE_CATEGORY_LABELS['exp-cat-commissions'],
      amountCents: 350_898,
    },
    {
      id: 'exp-005',
      date: '2026-06-05',
      categoryId: 'exp-cat-labs',
      categoryName: EXPENSE_CATEGORY_LABELS['exp-cat-labs'],
      amountCents: 420_000,
    },
    {
      id: 'exp-006',
      date: '2026-06-12',
      categoryId: 'exp-cat-fixed',
      categoryName: EXPENSE_CATEGORY_LABELS['exp-cat-fixed'],
      amountCents: 560_000,
    },
    {
      id: 'exp-007',
      date: '2026-06-20',
      categoryId: 'exp-cat-commissions',
      categoryName: EXPENSE_CATEGORY_LABELS['exp-cat-commissions'],
      amountCents: 210_000,
    },
    {
      id: 'exp-008',
      date: '2025-11-08',
      categoryId: 'exp-cat-labs',
      categoryName: EXPENSE_CATEGORY_LABELS['exp-cat-labs'],
      amountCents: 300_000,
    },
    {
      id: 'exp-009',
      date: '2025-11-15',
      categoryId: 'exp-cat-fixed',
      categoryName: EXPENSE_CATEGORY_LABELS['exp-cat-fixed'],
      amountCents: 480_000,
    },
    {
      id: 'exp-010',
      date: '2026-03-04',
      categoryId: 'exp-cat-commissions',
      categoryName: EXPENSE_CATEGORY_LABELS['exp-cat-commissions'],
      amountCents: 180_500,
    },
  ];
