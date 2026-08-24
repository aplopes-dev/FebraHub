import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DashboardPatientAcquisitionCard } from './dashboard-patient-acquisition-card';
import { useDashboardPatientAcquisitionQuery } from '../hooks/use-dashboard-patient-acquisition-query';

vi.mock('../hooks/use-dashboard-patient-acquisition-query', () => ({
  useDashboardPatientAcquisitionQuery: vi.fn(),
}));

vi.mock('../hooks/use-dashboard-patient-acquisition-details-query', () => ({
  useDashboardPatientAcquisitionDetailsQuery: () => ({
    items: [
      {
        id: 'p1',
        name: 'Ana Silva',
        phone: '73999990001',
        email: 'ana@email.com',
        registeredAt: '2026-07-02',
        referralSource: 'facebook',
      },
    ],
    meta: { total: 1, page: 1, perPage: 20, totalPages: 1 },
    isLoading: false,
    isError: false,
    isFetching: false,
  }),
}));

vi.mock('@/features/clinic/estoque/lib/use-clinic-id', () => ({
  useClinicId: () => ({ clinicId: 'clinic-1', isReady: true }),
}));

afterEach(cleanup);

function mockAcquisitionQuery() {
  vi.mocked(useDashboardPatientAcquisitionQuery).mockReturnValue({
    data: {
      totalCount: 3,
      aggregates: [
        {
          source: 'facebook',
          label: 'Facebook',
          count: 3,
          percent: 100,
        },
      ],
      years: [2026, 2025],
    },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useDashboardPatientAcquisitionQuery>);
}

describe('DashboardPatientAcquisitionCard', () => {
  it('renders title, period filters and legend', () => {
    mockAcquisitionQuery();
    render(<DashboardPatientAcquisitionCard />);

    expect(
      screen.getByText('Como o paciente chegou na clínica'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Período de origem')).toBeInTheDocument();
    expect(screen.getByLabelText('Mês de origem')).toBeInTheDocument();
    expect(screen.getByLabelText('Ano de origem')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exportar/i })).toBeInTheDocument();
    expect(screen.getAllByText('Facebook').length).toBeGreaterThan(0);
  });

  it('opens Ver dialog for a referral source', () => {
    mockAcquisitionQuery();
    render(<DashboardPatientAcquisitionCard />);

    const verButtons = screen.getAllByRole('button', { name: 'Ver' });
    fireEvent.click(verButtons[0]!);
    expect(
      screen.getByRole('heading', {
        name: /Como o paciente chegou na clínica/,
      }),
    ).toBeInTheDocument();
  });
});
