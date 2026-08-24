import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useCan } from '@/features/clinic/permissions';
import { DashboardSalesGoalsCard } from './dashboard-sales-goals-card';
import {
  useDashboardSalesGoalsQuery,
  useUpsertDashboardSalesGoalMutation,
} from '../hooks/use-dashboard-sales-goals-query';
import type { DashboardSalesGoalsSummary } from '../types/clinic-dashboard';

vi.mock('@/features/clinic/estoque/lib/use-clinic-id', () => ({
  useClinicId: () => ({ clinicId: 'store-1', isReady: true }),
}));

vi.mock('@/features/clinic/permissions', () => ({
  Can: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useCan: vi.fn(() => true),
}));

vi.mock('../hooks/use-dashboard-sales-goals-query', () => ({
  useDashboardSalesGoalsQuery: vi.fn(),
  useUpsertDashboardSalesGoalMutation: vi.fn(),
}));

afterEach(cleanup);

const TODAY = new Date(2026, 6, 20);

const BASE_SUMMARY: DashboardSalesGoalsSummary = {
  goalCents: 5_500_000,
  startDate: '2026-06-25',
  realizedCents: 1_025_000,
  soldTodayCents: 202_000,
  reached: false,
  dailySales: [
    { date: '2026-07-03', valueCents: 89_000 },
    { date: '2026-07-20', valueCents: 202_000 },
  ],
};

function mockHooks(summary: DashboardSalesGoalsSummary = BASE_SUMMARY) {
  const mutate = vi.fn(
    (
      _params: { goalCents: number },
      options?: { onSuccess?: () => void },
    ) => {
      options?.onSuccess?.();
    },
  );

  vi.mocked(useDashboardSalesGoalsQuery).mockReturnValue({
    summary,
    isLoading: false,
    isError: false,
    isFetching: false,
  } as ReturnType<typeof useDashboardSalesGoalsQuery>);

  vi.mocked(useUpsertDashboardSalesGoalMutation).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUpsertDashboardSalesGoalMutation>);

  return { mutate };
}

function renderCard() {
  return render(<DashboardSalesGoalsCard today={TODAY} />);
}

describe('DashboardSalesGoalsCard', () => {
  beforeEach(() => {
    vi.mocked(useCan).mockReturnValue(true);
    mockHooks();
  });

  it('hides the card when update Dashboard is denied', () => {
    vi.mocked(useCan).mockReturnValue(false);
    renderCard();
    expect(screen.queryByText('Metas de Vendas')).not.toBeInTheDocument();
    expect(useDashboardSalesGoalsQuery).toHaveBeenCalledWith({
      enabled: false,
    });
  });

  it('renders the continuous goal with month/year filters and business-day metrics', () => {
    renderCard();

    expect(screen.getByText('Metas de Vendas')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Mês da meta de vendas'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Ano da meta de vendas'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Objetivo').length).toBeGreaterThan(0);
    expect(screen.getByText('Necessário vender')).toBeInTheDocument();
    expect(screen.getByText('por dia útil')).toBeInTheDocument();
    expect(screen.getByText(/dias? restantes?/)).toBeInTheDocument();
    expect(screen.getByText('Vendido hoje')).toBeInTheDocument();
    expect(screen.getByText(/da meta diária/)).toBeInTheDocument();
    expect(screen.getAllByText('Vendas realizadas').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    // Visão mensal (julho): 89.000 + 202.000 = 291.000 / 5.500.000 = 5,3%
    expect(screen.getByText('5,3%')).toBeInTheDocument();
    expect(screen.queryByText('Meta atingida!')).not.toBeInTheDocument();
  });

  it('shows uncapped percent and Meta atingida! replacing the daily percent when reached', () => {
    mockHooks({
      ...BASE_SUMMARY,
      realizedCents: 8_250_000,
      reached: true,
      dailySales: [
        { date: '2026-07-03', valueCents: 89_000 },
        { date: '2026-07-20', valueCents: 8_161_000 },
      ],
    });

    renderCard();

    // Visão mensal (julho): 8.250.000 / 5.500.000 = 150%
    expect(screen.getByText('150%')).toBeInTheDocument();
    expect(screen.getByText('Meta atingida!')).toBeInTheDocument();
    expect(screen.queryByText(/da meta diária/)).not.toBeInTheDocument();
  });

  it('opens Definir Meta dialog and saves via mutation without period', async () => {
    const { mutate } = mockHooks({
      ...BASE_SUMMARY,
      goalCents: null,
      startDate: null,
      realizedCents: 0,
      soldTodayCents: 0,
      dailySales: [],
    });

    renderCard();

    expect(
      screen.getByRole('button', { name: 'Criar Meta' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Criar Meta' }));
    expect(
      screen.getByRole('heading', { name: 'Definir Meta' }),
    ).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByLabelText(/Valor da meta/);
    fireEvent.change(input, { target: { value: '1000000' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar meta' }));

    expect(mutate).toHaveBeenCalledWith(
      { goalCents: 1_000_000 },
      expect.anything(),
    );
  });
});
