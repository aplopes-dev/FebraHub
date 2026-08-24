import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DashboardCashflowCard } from './dashboard-cashflow-card';
import { useDashboardCashflowQuery } from '../hooks/use-dashboard-cashflow-query';

vi.mock('../hooks/use-dashboard-cashflow-query', () => ({
  useDashboardCashflowQuery: vi.fn(),
}));

vi.mock('@/features/clinic/estoque/lib/use-clinic-id', () => ({
  useClinicId: () => ({ clinicId: 'clinic-1', isReady: true }),
}));

afterEach(cleanup);

function mockCashflowQuery() {
  vi.mocked(useDashboardCashflowQuery).mockReturnValue({
    data: {
      totals: {
        incomeCents: 15000,
        expenseCents: 3000,
        balanceCents: 12000,
      },
      timeline: [
        {
          key: '2026-07-05',
          label: '5',
          incomePaid: 100,
          incomeForecast: 0,
          expensePaid: 0,
          expenseForecast: 0,
          balance: 100,
          balanceForecast: 100,
        },
        {
          key: '2026-07-25',
          label: '25',
          incomePaid: 0,
          incomeForecast: 50,
          expensePaid: 30,
          expenseForecast: 0,
          balance: 70,
          balanceForecast: 120,
        },
      ],
      years: [2026, 2025],
    },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useDashboardCashflowQuery>);
}

describe('DashboardCashflowCard', () => {
  it('renders title, totals, period controls and export', () => {
    mockCashflowQuery();
    render(<DashboardCashflowCard />);

    expect(screen.getByText('Receitas x Despesas')).toBeInTheDocument();
    expect(screen.getByText('Total de receitas')).toBeInTheDocument();
    expect(screen.getByText('Total de despesas')).toBeInTheDocument();
    expect(screen.getAllByText('Saldo').length).toBeGreaterThan(0);
    expect(
      screen.getByLabelText('Período de receitas e despesas'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exportar/i })).toBeInTheDocument();
    expect(screen.getAllByText('Receitas previstas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Saldo previsto').length).toBeGreaterThan(0);
  });

  it('switches to annual period and hides month select', () => {
    mockCashflowQuery();
    render(<DashboardCashflowCard />);

    expect(
      screen.getByLabelText('Mês de receitas e despesas'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Período de receitas e despesas'));
    fireEvent.click(screen.getByRole('option', { name: 'Anual' }));
    expect(
      screen.queryByLabelText('Mês de receitas e despesas'),
    ).not.toBeInTheDocument();
  });
});
