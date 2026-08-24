import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DashboardBudgetsCard } from './dashboard-budgets-card';
import { useDashboardBudgetAnalysisStatusQuery } from '../hooks/use-dashboard-budget-analysis-status-query';
import { useDashboardBudgetAnalysisQuery } from '../hooks/use-dashboard-budget-analysis-query';
import type { DashboardBudgetAnalysisStatusResult } from '../types/clinic-dashboard';

vi.mock('@/features/clinic/estoque/lib/use-clinic-id', () => ({
  useClinicId: () => ({ clinicId: 'store-1', isReady: true }),
}));

vi.mock('../hooks/use-dashboard-budget-analysis-status-query', () => ({
  useDashboardBudgetAnalysisStatusQuery: vi.fn(),
}));

vi.mock('../hooks/use-dashboard-budget-analysis-query', () => ({
  useDashboardBudgetAnalysisQuery: vi.fn(),
}));

vi.mock('../hooks/use-dashboard-budget-analysis-details-query', () => ({
  useDashboardBudgetAnalysisDetailsQuery: () => ({
    items: [],
    meta: {
      total: 0,
      totalValueCents: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    },
    isLoading: false,
    isError: false,
    isFetching: false,
  }),
}));

afterEach(cleanup);

const STATUS_RESULT: DashboardBudgetAnalysisStatusResult = {
  summary: {
    open: { count: 2, totalCents: 100_000 },
    approved: { count: 4, totalCents: 400_000 },
    rejected: { count: 4, totalCents: 200_000 },
    totalCount: 10,
    approvalRate: 40,
  },
  timeline: Array.from({ length: 12 }, (_, index) => ({
    key: `2026-${String(index + 1).padStart(2, '0')}`,
    label: String(index + 1),
    approved: { count: index === 0 ? 1 : 0, totalCents: index === 0 ? 50_000 : 0 },
    rejected: { count: 0, totalCents: 0 },
    open: { count: 0, totalCents: 0 },
  })),
  professionals: [
    { id: 'pro-dra-marina', name: 'Dra. Marina Alves' },
    { id: 'pro-dr-carlos', name: 'Dr. Carlos Mendes' },
  ],
  years: [2026, 2025],
};

function mockHooks() {
  vi.mocked(useDashboardBudgetAnalysisStatusQuery).mockReturnValue({
    data: STATUS_RESULT,
    isLoading: false,
    isError: false,
    isFetching: false,
  } as ReturnType<typeof useDashboardBudgetAnalysisStatusQuery>);

  vi.mocked(useDashboardBudgetAnalysisQuery).mockReturnValue({
    items: [
      {
        key: 'pro-dra-marina',
        name: 'Dra. Marina Alves',
        count: 3,
        totalCents: 250_000,
      },
    ],
    isLoading: false,
    isError: false,
    isFetching: false,
  } as ReturnType<typeof useDashboardBudgetAnalysisQuery>);
}

describe('DashboardBudgetsCard', () => {
  beforeEach(() => {
    mockHooks();
  });

  it('renders status and analysis sections', () => {
    render(<DashboardBudgetsCard />);

    expect(screen.getByText('Orçamentos')).toBeInTheDocument();
    expect(screen.getByText('Status do Orçamento')).toBeInTheDocument();
    const analysisHeading = screen.getByRole('heading', {
      name: 'Análise de Orçamentos',
    });
    expect(analysisHeading).toHaveClass('text-lg');
    expect(analysisHeading.parentElement).toHaveClass(
      'xl:grid-cols-[minmax(0,1fr)_auto_auto]',
    );
    expect(screen.getByText(/Taxa de aprovação/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Exportar/ })).toHaveLength(2);
  });

  it('uses semantic colors for each budget status', () => {
    render(<DashboardBudgetsCard />);

    const approvedSwatch = screen
      .getByText('Orçamentos aprovados')
      .querySelector('[aria-hidden="true"]');
    const rejectedSwatch = screen
      .getByText('Orçamentos reprovados')
      .querySelector('[aria-hidden="true"]');
    const openSwatch = screen
      .getByText('Orçamentos em aberto')
      .querySelector('[aria-hidden="true"]');

    expect(approvedSwatch).toHaveStyle({
      backgroundColor: 'var(--color-green-500)',
    });
    expect(rejectedSwatch).toHaveStyle({
      backgroundColor: 'var(--destructive)',
    });
    expect(openSwatch).toHaveStyle({ backgroundColor: 'var(--chart-2)' });
    const approvalProgress = screen.getByRole('progressbar', {
      name: 'Taxa de aprovação dos orçamentos',
    });
    expect(approvalProgress.style.background).toContain(
      'conic-gradient(var(--color-green-500)',
    );
    expect(approvalProgress).toHaveAttribute('aria-valuetext', '40.0%');
  });

  it('opens status details from each compact summary card', () => {
    render(<DashboardBudgetsCard />);

    const approvedCard = screen
      .getByText('Orçamentos aprovados')
      .closest('[data-budget-status-card]');
    expect(approvedCard).toHaveClass(
      'grid',
      'grid-rows-3',
      'h-[82px]',
      'w-[180px]',
    );
    expect(approvedCard?.children[0]?.tagName).toBe('STRONG');
    expect(approvedCard?.children[0]).toHaveClass('justify-self-center');
    expect(approvedCard?.children[1]).toHaveTextContent(
      'Orçamentos aprovados',
    );
    expect(approvedCard?.children[2]).toHaveTextContent('Ver');
    expect(approvedCard?.children[2]).toHaveClass('justify-self-center');
    expect(approvedCard?.children[2]).toHaveAttribute(
      'data-variant',
      'ghost',
    );
    expect(approvedCard?.children[2]).toHaveClass(
      'bg-transparent',
      'text-primary',
    );

    fireEvent.click(screen.getByRole('button', { name: /Ver orçamentos aprovados/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('keeps quantity/value radios on the status filter row', () => {
    render(<DashboardBudgetsCard />);

    expect(screen.getByLabelText('Por quantidade')).toBeInTheDocument();
    expect(screen.getByLabelText('Por valor (R$)')).toBeInTheDocument();
  });

  it('renders analysis aggregates from the API', () => {
    render(<DashboardBudgetsCard />);

    expect(screen.getByText('Dra. Marina Alves')).toBeInTheDocument();
    expect(screen.getByText(/3 orçamento/)).toBeInTheDocument();
  });
});
