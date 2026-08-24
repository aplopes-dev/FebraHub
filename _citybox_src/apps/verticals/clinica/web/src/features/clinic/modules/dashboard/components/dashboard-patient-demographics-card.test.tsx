import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DashboardPatientDemographicsCard } from './dashboard-patient-demographics-card';
import { useDashboardPatientDemographicsQuery } from '../hooks/use-dashboard-patient-demographics-query';

vi.mock('../hooks/use-dashboard-patient-demographics-query', () => ({
  useDashboardPatientDemographicsQuery: vi.fn(),
}));

vi.mock('@/features/clinic/estoque/lib/use-clinic-id', () => ({
  useClinicId: () => ({ clinicId: 'clinic-1', isReady: true }),
}));

afterEach(cleanup);

function mockDemographicsQuery() {
  vi.mocked(useDashboardPatientDemographicsQuery).mockReturnValue({
    data: {
      filteredTotalCount: 5,
      totalCount: 5,
      ageSeries: [
        { key: '30-39', label: '30 a 39 anos', count: 3, percent: 60 },
        { key: '40-49', label: '40 a 49 anos', count: 2, percent: 40 },
      ],
      genderShares: [
        { gender: 'female', label: 'Feminino', count: 3, percent: 60 },
        { gender: 'male', label: 'Masculino', count: 2, percent: 40 },
      ],
    },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useDashboardPatientDemographicsQuery>);
}

describe('DashboardPatientDemographicsCard', () => {
  it('renders title, gender filter, export and pie legend with percent badges', () => {
    mockDemographicsQuery();
    render(<DashboardPatientDemographicsCard />);

    expect(
      screen.getByText('Pacientes por idade e sexo'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Filtrar por sexo')).toHaveTextContent(
      'Todos',
    );
    expect(screen.getByRole('button', { name: /Exportar/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '%' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Qtd' })).not.toBeInTheDocument();
    expect(screen.getAllByText('Feminino').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Masculino').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/%$/).length).toBeGreaterThan(0);
    expect(screen.getByText('3 pacientes')).toBeInTheDocument();
    expect(screen.getByText('2 pacientes')).toBeInTheDocument();
  });
});
