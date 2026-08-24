import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DashboardTicketMedioCard } from './dashboard-ticket-medio-card';
import { useDashboardTicketMedioQuery } from '../hooks/use-dashboard-ticket-medio-query';

vi.mock('../hooks/use-dashboard-ticket-medio-query', () => ({
  useDashboardTicketMedioQuery: vi.fn(),
}));

vi.mock('@/features/clinic/estoque/lib/use-clinic-id', () => ({
  useClinicId: () => ({ clinicId: 'clinic-1', isReady: true }),
}));

afterEach(cleanup);

function mockTicketMedioQuery() {
  vi.mocked(useDashboardTicketMedioQuery).mockReturnValue({
    data: {
      rendimento: {
        currentAverageCents: 7500,
        points: [
          {
            key: '2026-07-10',
            label: '10',
            currentCents: 7500,
            previousCents: 8000,
          },
        ],
      },
      lucratividade: {
        currentAverageCents: 12000,
        points: [
          {
            key: '2026-07-10',
            label: '10',
            currentCents: 12000,
            previousCents: 6000,
          },
        ],
      },
      years: [2026, 2025],
    },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useDashboardTicketMedioQuery>);
}

describe('DashboardTicketMedioCard', () => {
  it('renders title, both chart labels and period controls', () => {
    mockTicketMedioQuery();
    render(<DashboardTicketMedioCard />);

    expect(screen.getByText('Ticket médio')).toBeInTheDocument();
    expect(
      screen.getByText('Rendimento médio por paciente'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Lucratividade total no período'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Período do ticket médio')).toBeInTheDocument();
    expect(screen.getAllByText('Mês corrente').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mês anterior').length).toBeGreaterThan(0);
  });
});
