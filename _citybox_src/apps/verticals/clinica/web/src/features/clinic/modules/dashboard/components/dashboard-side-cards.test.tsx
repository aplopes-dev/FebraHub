import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DashboardFinancialCard } from './dashboard-financial-card';
import { DashboardPatientsCard } from './dashboard-patients-card';
import { MOCK_DASHBOARD_FINANCIAL_BY_PERIOD } from '../data/mock-dashboard-financial';
import { MOCK_DASHBOARD_PATIENT_METRICS } from '../data/mock-dashboard-patient-metrics';
import { MOCK_DASHBOARD_BIRTHDAY_PATIENTS } from '../data/mock-clinic-dashboard';
import { filterBirthdayPatients } from '../lib/birthday-period';
import { resolveDashboardFinancialSummary } from '../lib/dashboard-financial';
import { useDashboardBirthdaysQuery } from '../hooks/use-dashboard-birthdays-query';
import { useDashboardFinancialSummaryQuery } from '../hooks/use-dashboard-financial-summary-query';
import { useDashboardPatientsSummaryQuery } from '../hooks/use-dashboard-patients-summary-query';
import { useDashboardPatientsMetricListQuery } from '../hooks/use-dashboard-patients-metric-list-query';

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

vi.mock('../hooks/use-dashboard-birthdays-query', () => ({
  useDashboardBirthdaysQuery: vi.fn(() => {
    const items = filterBirthdayPatients({
      patients: MOCK_DASHBOARD_BIRTHDAY_PATIENTS,
      period: 'next_30_days',
      referenceDate: new Date(2026, 6, 17),
    });
    return {
      items,
      meta: {
        total: items.length,
        page: 1,
        perPage: 20,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      isFetching: false,
    };
  }),
}));

vi.mock('../hooks/use-dashboard-financial-summary-query', () => ({
  useDashboardFinancialSummaryQuery: vi.fn(),
}));

vi.mock('../hooks/use-dashboard-patients-summary-query', () => ({
  useDashboardPatientsSummaryQuery: vi.fn(() => ({
    summary: {
      totalRegisteredCount: 7,
      seenLast6MonthsCount: 5,
      overdueDebtsPatientsCount: 3,
      newSeenThisMonthCount: 2,
      openTreatmentWithoutAppointmentCount: 3,
    },
    isLoading: false,
    isError: false,
  })),
}));

vi.mock('../hooks/use-dashboard-patients-metric-list-query', () => ({
  useDashboardPatientsMetricListQuery: vi.fn(
    (params: { metric: string; search?: string }) => {
      const metric = MOCK_DASHBOARD_PATIENT_METRICS.find(
        (item) => item.id === params.metric,
      );
      const search = params.search?.trim().toLocaleLowerCase('pt-BR') ?? '';
      const items = (metric?.patients ?? []).filter((patient) => {
        if (!search) return true;
        return [patient.name, patient.email, patient.cpf]
          .filter((value): value is string => Boolean(value))
          .some((value) =>
            value.toLocaleLowerCase('pt-BR').includes(search),
          );
      });
      return {
        items,
        meta: {
          total: items.length,
          page: 1,
          perPage: 20,
          totalPages: 1,
        },
        isLoading: false,
        isError: false,
        isFetching: false,
      };
    },
  ),
}));

vi.mock('../services/dashboard.api.service', () => ({
  fetchDashboardBirthdays: vi.fn(),
  fetchDashboardFinancialSummary: vi.fn(),
  fetchDashboardPatientsByMetric: vi.fn(),
  fetchDashboardPatientsSummary: vi.fn(),
}));

afterEach(cleanup);

describe('DashboardFinancialCard', () => {
  beforeEach(() => {
    vi.mocked(useDashboardFinancialSummaryQuery).mockImplementation(
      (params) =>
        ({
          summary: resolveDashboardFinancialSummary(
            MOCK_DASHBOARD_FINANCIAL_BY_PERIOD,
            2026,
            params.month,
          ),
          isLoading: false,
          isError: false,
          isFetching: false,
        }) as ReturnType<typeof useDashboardFinancialSummaryQuery>,
    );
  });

  it('renders month/year controls and financial bars', () => {
    render(<DashboardFinancialCard />);

    expect(screen.getByText('Financeiro')).toBeInTheDocument();
    expect(screen.getByLabelText('Mês financeiro')).toBeInTheDocument();
    expect(screen.getByLabelText('Ano financeiro')).toBeInTheDocument();
    expect(screen.getByText('Receitas')).toBeInTheDocument();
    expect(screen.getByText('Despesas')).toBeInTheDocument();
    expect(screen.getByText('Saldo')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')).toHaveLength(3);
  });

  it('updates values when changing month', () => {
    render(<DashboardFinancialCard />);

    fireEvent.click(screen.getByLabelText('Mês financeiro'));
    fireEvent.click(screen.getByRole('option', { name: 'Junho' }));
    expect(screen.getByLabelText('Mês financeiro')).toHaveTextContent('Junho');

    const lastCall = vi.mocked(useDashboardFinancialSummaryQuery).mock
      .calls.at(-1)?.[0];
    expect(lastCall?.month).toBe(6);
    expect(screen.getByText('Receitas')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')).toHaveLength(3);
  });

  it('shows loading and error states', () => {
    vi.mocked(useDashboardFinancialSummaryQuery).mockReturnValue({
      summary: resolveDashboardFinancialSummary(
        MOCK_DASHBOARD_FINANCIAL_BY_PERIOD,
        2026,
        7,
      ),
      isLoading: true,
      isError: false,
      isFetching: false,
    } as ReturnType<typeof useDashboardFinancialSummaryQuery>);

    const { rerender } = render(<DashboardFinancialCard />);
    expect(
      screen.getByText('Carregando resumo financeiro…'),
    ).toBeInTheDocument();

    vi.mocked(useDashboardFinancialSummaryQuery).mockReturnValue({
      summary: resolveDashboardFinancialSummary(
        MOCK_DASHBOARD_FINANCIAL_BY_PERIOD,
        2026,
        7,
      ),
      isLoading: false,
      isError: true,
      isFetching: false,
    } as ReturnType<typeof useDashboardFinancialSummaryQuery>);
    rerender(<DashboardFinancialCard />);
    expect(
      screen.getByText('Não foi possível carregar o resumo financeiro.'),
    ).toBeInTheDocument();
  });
});

describe('DashboardPatientsCard', () => {
  it('renders six patient metrics from API summary', () => {
    render(<DashboardPatientsCard upcomingBirthdaysCount={7} />);

    expect(screen.getByText('Pacientes')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Ver / })).toHaveLength(6);
    expect(
      screen.getByText('Aniversariantes').previousElementSibling,
    ).toHaveTextContent('7');
    expect(screen.getByText('Total de pacientes cadastrados')).toBeInTheDocument();
    expect(
      screen.getByText('Total de pacientes cadastrados').previousElementSibling,
    ).toHaveTextContent('7');
    expect(
      screen.getByText('Pacientes com procedimento em aberto sem consulta'),
    ).toBeInTheDocument();
    expect(useDashboardPatientsSummaryQuery).toHaveBeenCalled();
  });

  it('opens the selected metric dialog and filters by patient', async () => {
    render(<DashboardPatientsCard upcomingBirthdaysCount={7} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Ver Pacientes com débitos em atraso',
      }),
    );
    expect(
      screen.getByRole('heading', {
        name: 'Pacientes com débitos em atraso',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Ana Carolina Silva/ }),
    ).toHaveAttribute('href', '/pacientes/pat-001/sobre');
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeEnabled();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByText(/ana\.silva@exemplo\.com/)).toBeInTheDocument();
    expect(screen.getByText('CPF 123.456.789-00')).toBeInTheDocument();
    expect(screen.queryByText(/Vencimento em/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Conversar com/ })).toHaveLength(
      3,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Abrir busca de paciente' }),
    );
    fireEvent.change(screen.getByLabelText('Buscar paciente'), {
      target: { value: 'Bruno' },
    });

    await waitFor(() => {
      expect(useDashboardPatientsMetricListQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          metric: 'overdue_debts',
          search: 'Bruno',
        }),
        expect.anything(),
      );
    });
  });

  it('shows patient email and CPF instead of registration date', () => {
    render(<DashboardPatientsCard upcomingBirthdaysCount={7} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Ver Total de pacientes cadastrados',
      }),
    );

    expect(screen.getByText(/ana\.silva@exemplo\.com/)).toBeInTheDocument();
    expect(screen.getByText('CPF 123.456.789-00')).toBeInTheDocument();
    expect(screen.queryByText(/Cadastrada em/)).not.toBeInTheDocument();
  });

  it('shows email and CPF for patients attended in the last 6 months', () => {
    render(<DashboardPatientsCard upcomingBirthdaysCount={7} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Ver Pacientes atendidos nos últimos 6 meses',
      }),
    );

    expect(screen.getByText(/ana\.silva@exemplo\.com/)).toBeInTheDocument();
    expect(screen.getByText('CPF 123.456.789-00')).toBeInTheDocument();
    expect(screen.queryByText(/Último atendimento/)).not.toBeInTheDocument();
  });

  it('opens birthdays dialog with API-backed list and standard modal width', () => {
    render(<DashboardPatientsCard upcomingBirthdaysCount={7} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Ver Aniversariantes' }),
    );

    expect(useDashboardBirthdaysQuery).toHaveBeenCalled();
    expect(
      screen.getByLabelText('Período dos aniversariantes'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-6xl');
    expect(
      screen.getByRole('link', { name: /Ana Carolina Silva/ }),
    ).toHaveAttribute('href', '/pacientes/pat-001/sobre');
    expect(
      screen.getAllByRole('button', { name: /Conversar com/ }).length,
    ).toBeGreaterThan(0);
  });
});
