import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { DashboardKpiCards } from './dashboard-kpi-cards';
import { DashboardBudgetsDialog } from './dashboard-budgets-dialog';
import { DashboardBirthdaysDialog } from './dashboard-birthdays-dialog';
import { MOCK_DASHBOARD_BIRTHDAY_PATIENTS } from '../data/mock-clinic-dashboard';
import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import { filterBirthdayPatients } from '../lib/birthday-period';
import { useDashboardBirthdaysQuery } from '../hooks/use-dashboard-birthdays-query';
import { useDashboardBudgetsQuery } from '../hooks/use-dashboard-budgets-query';
import type { DashboardBudgetRow } from '../types/clinic-dashboard';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/clinic/estoque/lib/use-clinic-id', () => ({
  useClinicId: () => ({ clinicId: 'store-1', isReady: true }),
}));

vi.mock('@/features/clinic/modules/patients/hooks/use-debounced-search', () => ({
  useDebouncedSearch: () => {
    const React = require('react') as typeof import('react');
    const [search, setSearch] = React.useState('');
    return {
      search,
      debouncedSearch: search,
      handleSearchChange: setSearch,
      clearSearch: () => setSearch(''),
    };
  },
}));

vi.mock('../hooks/use-dashboard-birthdays-query', () => ({
  useDashboardBirthdaysQuery: vi.fn(),
}));

vi.mock('../hooks/use-dashboard-budgets-query', () => ({
  useDashboardBudgetsQuery: vi.fn(),
}));

vi.mock('../services/dashboard.api.service', () => ({
  fetchDashboardBirthdays: vi.fn(),
  fetchDashboardBudgets: vi.fn(),
  fetchDashboardSummary: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe('DashboardKpiCards', () => {
  it('renders three KPI cards with Ver actions', () => {
    const onOpenBudgets = vi.fn();
    const onOpenBirthdays = vi.fn();

    const { container } = render(
      <DashboardKpiCards
        overdueIncomeTotalCents={280000}
        openRejectedBudgetsTotalCents={1564000}
        upcomingBirthdaysCount={5}
        overdueHref="/financeiro/fluxo-de-caixa?types=income&statuses=unpaid"
        onOpenBudgets={onOpenBudgets}
        onOpenBirthdays={onOpenBirthdays}
      />,
    );

    expect(screen.getByText('Débitos em atraso')).toBeInTheDocument();
    expect(
      screen.getByText('Orçamentos em aberto e reprovados'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Aniversariantes nos próximos 30 dias'),
    ).toBeInTheDocument();
    expect(container.textContent).toContain('R$');
    expect(screen.getByText('5')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ver orçamentos/i }));
    expect(onOpenBudgets).toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: /Ver aniversariantes/i }),
    );
    expect(onOpenBirthdays).toHaveBeenCalled();
  });
});

describe('DashboardBudgetsDialog', () => {
  const apiBudgets: DashboardBudgetRow[] = [
    {
      id: 'b-1',
      budgetDate: '2026-07-15',
      patientId: 'pat-1',
      patientName: 'Ana Carolina Silva',
      description: 'Tratamento ortodôntico',
      status: 'open',
      valueCents: 150_000,
    },
    {
      id: 'b-2',
      budgetDate: '2026-07-10',
      patientId: 'pat-2',
      patientName: 'Bruno Lima',
      description: 'Clareamento',
      status: 'rejected',
      valueCents: 50_000,
    },
  ];

  beforeEach(() => {
    vi.mocked(useDashboardBudgetsQuery).mockReturnValue({
      items: apiBudgets,
      meta: {
        total: apiBudgets.length,
        totalValueCents: 200_000,
        page: 1,
        perPage: 20,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof useDashboardBudgetsQuery>);
  });

  it('lists budgets from API with total and closes', () => {
    const onOpenChange = vi.fn();

    render(<DashboardBudgetsDialog open onOpenChange={onOpenChange} />);

    expect(
      screen.getByRole('heading', { name: 'Orçamentos em aberto e reprovados' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ana Carolina Silva')).toBeInTheDocument();
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument();
    expect(screen.getByText('Reprovado')).toBeInTheDocument();

    const expectedTotal = `Total ${formatBrlCurrencyFromCents(200_000)}`;
    expect(
      screen.getByText(
        (_, element) => element?.textContent === expectedTotal,
        { selector: 'p' },
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows empty state when API returns no budgets', () => {
    vi.mocked(useDashboardBudgetsQuery).mockReturnValue({
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
    } as unknown as ReturnType<typeof useDashboardBudgetsQuery>);

    render(<DashboardBudgetsDialog open onOpenChange={vi.fn()} />);

    expect(
      screen.getByText('Nenhum orçamento em aberto ou reprovado.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exportar/i })).toBeDisabled();
  });
});

describe('DashboardBirthdaysDialog', () => {
  beforeEach(() => {
    const items = filterBirthdayPatients({
      patients: MOCK_DASHBOARD_BIRTHDAY_PATIENTS,
      period: 'next_30_days',
      referenceDate: new Date(2026, 6, 17),
    });

    vi.mocked(useDashboardBirthdaysQuery).mockImplementation((params) => {
      const filtered = filterBirthdayPatients({
        patients: MOCK_DASHBOARD_BIRTHDAY_PATIENTS,
        period: params.period ?? 'next_30_days',
        referenceDate: new Date(2026, 6, 17),
        search: params.search,
      });

      return {
        items: filtered,
        meta: {
          total: filtered.length,
          page: 1,
          perPage: 20,
          totalPages: 1,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
        data: { items: filtered, meta: {
          total: filtered.length,
          page: 1,
          perPage: 20,
          totalPages: 1,
        } },
      } as ReturnType<typeof useDashboardBirthdaysQuery>;
    });

    void items;
  });

  it('opens with next 30 days filter and lists patients from API', () => {
    const onOpenChange = vi.fn();

    render(
      <DashboardBirthdaysDialog open onOpenChange={onOpenChange} />,
    );

    expect(
      screen.getByRole('heading', { name: 'Aniversariantes' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument();
    expect(screen.queryByText('Exibindo')).not.toBeInTheDocument();

    const periodTrigger = screen.getByLabelText('Período dos aniversariantes');
    expect(
      within(periodTrigger).getByText('dos próximos 30 dias'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir busca' }));
    fireEvent.change(screen.getByLabelText('Buscar aniversariante'), {
      target: { value: 'Ana' },
    });

    // Debounce: hook mock reads params.search from debounced value after effect.
    // For unit test without waiting debounce, re-invoke with search via mock call args.
    expect(useDashboardBirthdaysQuery).toHaveBeenCalled();

    expect(screen.getByText('Ana Carolina Silva')).toBeInTheDocument();
    expect(screen.getByText('17/07/1985 - Hoje (41 anos)')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Ana Carolina Silva/ }),
    ).toHaveAttribute('href', '/pacientes/pat-001/sobre');
    expect(
      screen.getAllByRole('button', { name: /Conversar/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
