import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DashboardExpenseByCategoryCard } from './dashboard-expense-by-category-card';
import { useDashboardExpenseByCategoryQuery } from '../hooks/use-dashboard-expense-by-category-query';

vi.mock('../hooks/use-dashboard-expense-by-category-query', () => ({
  useDashboardExpenseByCategoryQuery: vi.fn(),
}));

vi.mock('@/features/clinic/estoque/lib/use-clinic-id', () => ({
  useClinicId: () => ({ clinicId: 'clinic-1', isReady: true }),
}));

vi.mock('../lib/dashboard-financial', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../lib/dashboard-financial')>();
  return {
    ...actual,
    DEFAULT_DASHBOARD_FINANCIAL_MONTH: 7,
    DEFAULT_DASHBOARD_FINANCIAL_YEAR: 2026,
  };
});

afterEach(cleanup);

function mockExpenseByCategoryQuery() {
  vi.mocked(useDashboardExpenseByCategoryQuery).mockReturnValue({
    data: {
      totalCents: 2_360_898,
      items: [
        {
          categoryId: 'exp-cat-labs',
          label: 'Laboratórios',
          color: '#22c55e',
          amountCents: 1_450_000,
          percent: 61.4,
        },
        {
          categoryId: 'exp-cat-fixed',
          label:
            'Custos Fixos (aluguel, telefone, internet, licença de software)',
          color: '#3b82f6',
          amountCents: 560_000,
          percent: 23.7,
        },
        {
          categoryId: 'exp-cat-commissions',
          label: 'Comissões',
          color: '#eab308',
          amountCents: 350_898,
          percent: 14.9,
        },
      ],
      years: [2026, 2025],
    },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useDashboardExpenseByCategoryQuery>);
}

describe('DashboardExpenseByCategoryCard', () => {
  it('renders title, total, category legend and Ver deep-links', () => {
    mockExpenseByCategoryQuery();
    render(<DashboardExpenseByCategoryCard />);

    expect(screen.getByText('Despesa por categoria')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getAllByText('23.608,98').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Laboratórios').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        'Custos Fixos (aluguel, telefone, internet, licença de software)',
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('Comissões').length).toBeGreaterThan(0);

    const labsLink = screen.getByRole('link', {
      name: 'Ver despesas de Laboratórios',
    });
    expect(labsLink).toHaveAttribute(
      'href',
      expect.stringContaining('/financeiro/fluxo-de-caixa'),
    );
    expect(labsLink).toHaveAttribute(
      'href',
      expect.stringContaining('types=expense'),
    );
    expect(labsLink).toHaveAttribute(
      'href',
      expect.stringContaining('categories=exp-cat-labs'),
    );
  });
});
