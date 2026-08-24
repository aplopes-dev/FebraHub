import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DashboardCommissionsCard } from './dashboard-commissions-card';
import { useDashboardCommissionsQuery } from '../hooks/use-dashboard-commissions-query';
import { useDashboardCommissionsDetailsQuery } from '../hooks/use-dashboard-commissions-details-query';

vi.mock('../hooks/use-dashboard-commissions-query', () => ({
  useDashboardCommissionsQuery: vi.fn(),
}));

vi.mock('../hooks/use-dashboard-commissions-details-query', () => ({
  useDashboardCommissionsDetailsQuery: vi.fn(),
}));

vi.mock('@/features/clinic/estoque/lib/use-clinic-id', () => ({
  useClinicId: () => ({ clinicId: 'clinic-1', isReady: true }),
}));

afterEach(cleanup);

function mockCommissionsQuery() {
  vi.mocked(useDashboardCommissionsQuery).mockReturnValue({
    data: {
      netTotalCents: 16500,
      byTrigger: [
        {
          key: 'treatment_completed',
          label: 'Procedimento finalizado',
          grossCents: 10000,
          percent: 55.6,
        },
        {
          key: 'debit_received',
          label: 'Débito recebido do paciente',
          grossCents: 5000,
          percent: 27.8,
        },
        {
          key: 'budget_approved',
          label: 'Aprovação de orçamento',
          grossCents: 3000,
          percent: 16.7,
        },
      ],
      byType: [
        {
          key: 'fixed_value',
          label: 'Comissão por valor fixo (R$)',
          grossCents: 10000,
          percent: 55.6,
        },
        {
          key: 'percentage',
          label: 'Comissão por percentual (%)',
          grossCents: 8000,
          percent: 44.4,
        },
      ],
      ranking: [
        {
          professionalId: 'm1',
          professionalName: 'Ana',
          netCents: 13500,
          count: 2,
        },
      ],
      years: [2026, 2025],
    },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useDashboardCommissionsQuery>);
}

function mockDetailsQuery() {
  vi.mocked(useDashboardCommissionsDetailsQuery).mockReturnValue({
    items: [],
    meta: {
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
      totalNetCents: 0,
    },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useDashboardCommissionsDetailsQuery>);
}

describe('DashboardCommissionsCard', () => {
  it('renders title, totals breakdown and ranking', () => {
    mockCommissionsQuery();
    mockDetailsQuery();
    render(<DashboardCommissionsCard />);

    expect(
      screen.getByText('Análise das Comissões Pagas'),
    ).toBeInTheDocument();
    expect(screen.getByText('Total de comissões pagas')).toBeInTheDocument();
    expect(screen.getByText('Regras de pagamento')).toBeInTheDocument();
    expect(screen.getByText('Tipos de pagamento')).toBeInTheDocument();
    expect(screen.getByText('Ranking de Profissionais')).toBeInTheDocument();
    expect(screen.getByText('Procedimento finalizado')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  it('opens total Ver dialog', () => {
    mockCommissionsQuery();
    mockDetailsQuery();
    render(<DashboardCommissionsCard />);

    fireEvent.click(screen.getByLabelText('Ver total de comissões pagas'));
    expect(screen.getByRole('button', { name: /Exportar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Imprimir/i })).toBeInTheDocument();
  });
});
