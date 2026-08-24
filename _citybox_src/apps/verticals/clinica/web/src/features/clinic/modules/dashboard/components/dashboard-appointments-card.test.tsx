import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DashboardAppointmentsCard } from './dashboard-appointments-card';
import { useDashboardAppointmentsQuery } from '../hooks/use-dashboard-appointments-query';

vi.mock('../hooks/use-dashboard-appointments-query', () => ({
  useDashboardAppointmentsQuery: vi.fn(),
}));

vi.mock('../hooks/use-dashboard-appointments-details-query', () => ({
  useDashboardAppointmentsDetailsQuery: () => ({
    items: [
      {
        id: 'apt-1',
        date: '2026-07-10',
        patientId: 'p1',
        patientName: 'Ana Silva',
        phone: '73999990001',
        categoryId: 'cat-1',
        categoryName: 'Avaliação',
        status: 'finished',
        professionalId: 'pro-1',
      },
    ],
    meta: { total: 1, page: 1, perPage: 20, totalPages: 1 },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/features/clinic/estoque/lib/use-clinic-id', () => ({
  useClinicId: () => ({ clinicId: 'clinic-1', isReady: true }),
}));

vi.mock('@/features/clinic/agenda/api/team', () => ({
  useTeamMembers: () => ({
    data: {
      professionals: [{ id: 'pro-1', userId: 'pro-1', name: 'Dra. Marina' }],
    },
  }),
}));

afterEach(cleanup);

function mockAppointmentsQuery() {
  vi.mocked(useDashboardAppointmentsQuery).mockReturnValue({
    data: {
      summary: {
        realizedCount: 2,
        missedCancelledCount: 1,
        totalCount: 3,
        attendanceRate: 66.66666666666666,
      },
      timeline: [
        { key: '2026-07-10', label: '10', realized: 1, missedCancelled: 0 },
        { key: '2026-07-11', label: '11', realized: 1, missedCancelled: 1 },
      ],
      categories: [{ id: 'cat-1', name: 'Avaliação', color: '#0891b2' }],
      years: [2026, 2025],
    },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useDashboardAppointmentsQuery>);
}

describe('DashboardAppointmentsCard', () => {
  it('renders title, category filter, period controls and status cards', () => {
    mockAppointmentsQuery();
    render(<DashboardAppointmentsCard />);

    expect(screen.getByText('Consultas')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Filtrar por categoria de agendamento'),
    ).toHaveTextContent('Todas as categorias');
    expect(screen.getByLabelText('Período das consultas')).toBeInTheDocument();
    expect(
      screen.getByText('Consultas realizadas no período'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Faltas e cancelamentos no período'),
    ).toBeInTheDocument();
    expect(screen.getByText('Taxa de comparecimento')).toBeInTheDocument();
  });

  it('opens Ver dialog for realized appointments', () => {
    mockAppointmentsQuery();
    render(<DashboardAppointmentsCard />);

    fireEvent.click(screen.getByLabelText('Ver consultas realizadas'));
    expect(screen.getByText('Consultas realizadas')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /Conversar/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', { name: /Exportar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Abrir busca de paciente'),
    ).not.toBeInTheDocument();
  });
});
