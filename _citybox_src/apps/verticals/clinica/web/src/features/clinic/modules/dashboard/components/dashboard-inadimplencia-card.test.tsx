import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { DashboardInadimplenciaCard } from './dashboard-inadimplencia-card';
import { useDashboardInadimplenciaQuery } from '../hooks/use-dashboard-inadimplencia-query';
import { useDashboardInadimplenciaDetailsQuery } from '../hooks/use-dashboard-inadimplencia-details-query';

vi.mock('../hooks/use-dashboard-inadimplencia-query', () => ({
  useDashboardInadimplenciaQuery: vi.fn(),
}));

vi.mock('../hooks/use-dashboard-inadimplencia-details-query', () => ({
  useDashboardInadimplenciaDetailsQuery: vi.fn(),
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

function mockQueries() {
  vi.mocked(useDashboardInadimplenciaQuery).mockReturnValue({
    data: {
      totalDebtsCents: 495_000,
      unpaidCents: 410_000,
      receivedCents: 85_000,
      ratePercent: 82.8,
      years: [2026, 2025],
    },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useDashboardInadimplenciaQuery>);

  vi.mocked(useDashboardInadimplenciaDetailsQuery).mockReturnValue({
    items: [
      {
        id: 'ina-001',
        dueDate: '2026-07-05',
        daysOverdue: 15,
        patientId: 'pat-ana',
        patientName: 'Ana Carolina Silva',
        description: 'Parcela 2/3',
        phone: '73999887766',
        unpaidCents: 150_000,
      },
    ],
    meta: { total: 1, page: 1, perPage: 20, totalPages: 1 },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useDashboardInadimplenciaDetailsQuery>);
}

describe('DashboardInadimplenciaCard', () => {
  it('renders rate, unpaid value and opens inadimplentes dialog', () => {
    mockQueries();
    render(<DashboardInadimplenciaCard />);

    expect(screen.getAllByText('Inadimplência').length).toBeGreaterThan(1);
    expect(
      screen.getByLabelText('Período da inadimplência'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exportar/i })).toBeEnabled();
    expect(screen.getAllByText('82,8%').length).toBeGreaterThan(0);
    expect(screen.getByText('R$')).toBeInTheDocument();
    expect(screen.getAllByText('4.100,00').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Ver inadimplentes' }));

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText('Inadimplentes de Julho de 2026'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Data de vencimento')).toBeInTheDocument();
    expect(within(dialog).getByText('Dias de atraso')).toBeInTheDocument();
    expect(within(dialog).getByText('Ana Carolina Silva')).toHaveAttribute(
      'href',
      '/pacientes/pat-ana/sobre',
    );
    expect(
      within(dialog).getAllByRole('button', { name: /Conversar com/ }).length,
    ).toBeGreaterThan(0);
  });
});
