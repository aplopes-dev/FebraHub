import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DashboardRevenueAnalysisCard } from './dashboard-revenue-analysis-card';
import { DashboardRevenueDetailsDialog } from './dashboard-revenue-details-dialog';
import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import { useDashboardRevenueAnalysisQuery } from '../hooks/use-dashboard-revenue-analysis-query';
import { useDashboardRevenueDetailsQuery } from '../hooks/use-dashboard-revenue-details-query';
import type { RevenueAggregateRow, RevenueDetailRow } from '../types/clinic-dashboard';

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

vi.mock('../hooks/use-dashboard-revenue-analysis-query', () => ({
  useDashboardRevenueAnalysisQuery: vi.fn(),
}));

vi.mock('../hooks/use-dashboard-revenue-details-query', () => ({
  useDashboardRevenueDetailsQuery: vi.fn(),
}));

vi.mock('../services/dashboard.api.service', () => ({
  fetchDashboardRevenueAnalysis: vi.fn(),
  fetchDashboardRevenueDetails: vi.fn(),
}));

const MOCK_AGGREGATES: RevenueAggregateRow[] = [
  {
    key: 'pro-dra-marina',
    name: 'Dra. Marina Alves',
    count: 1,
    totalCents: 89000,
  },
  {
    key: 'pro-dr-carlos',
    name: 'Dr. Carlos Mendes',
    count: 1,
    totalCents: 45000,
  },
];

const MOCK_PLAN_AGGREGATES: RevenueAggregateRow[] = [
  { key: 'plan-estetica', name: 'Estética', count: 1, totalCents: 89000 },
  { key: 'plan-clinico', name: 'Clínico', count: 1, totalCents: 45000 },
];

const MOCK_DETAILS: RevenueDetailRow[] = [
  {
    id: 'detail-1',
    date: '2026-07-17',
    patientId: 'pat-001',
    patientName: 'Ana Carolina Silva',
    treatmentName: 'Clareamento dental',
    valueCents: 89000,
  },
];

afterEach(() => {
  cleanup();
});

describe('DashboardRevenueAnalysisCard', () => {
  beforeEach(() => {
    vi.mocked(useDashboardRevenueDetailsQuery).mockReturnValue({
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
    } as ReturnType<typeof useDashboardRevenueDetailsQuery>);

    vi.mocked(useDashboardRevenueAnalysisQuery).mockImplementation(
      (params) => {
        const items =
          params.dimension === 'plans' ? MOCK_PLAN_AGGREGATES : MOCK_AGGREGATES;
        const salesItems = items.map((item) => ({ ...item, count: 1 }));
        return {
          items: params.mode === 'sales' ? salesItems : items,
          isLoading: false,
          isError: false,
          isFetching: false,
        } as ReturnType<typeof useDashboardRevenueAnalysisQuery>;
      },
    );
  });

  it('defaults to receipts mode, today period and professionals tab', () => {
    render(<DashboardRevenueAnalysisCard />);

    expect(screen.getByText('Análise de Receitas')).toBeInTheDocument();
    expect(screen.getByText('Exibindo receitas por')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo de receita')).toHaveTextContent(
      'Recebimentos',
    );
    expect(screen.getByLabelText('Período da análise')).toHaveTextContent(
      'de hoje',
    );
    expect(screen.getByRole('tab', { name: 'Profissionais' })).toHaveAttribute(
      'data-state',
      'active',
    );
    expect(screen.getByText('2 profissionais')).toBeInTheDocument();
    expect(screen.getByText('Dra. Marina Alves')).toBeInTheDocument();
    expect(screen.getAllByText('1 receita').length).toBe(2);
    expect(
      screen.getByText((_, element) => {
        return (
          element?.tagName === 'P' &&
          element.textContent === formatBrlCurrencyFromCents(89000)
        );
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Ações de Dra. Marina Alves'),
    ).toBeInTheDocument();
  });

  it('switches to sales mode and updates labels', () => {
    render(<DashboardRevenueAnalysisCard />);

    fireEvent.click(screen.getByLabelText('Tipo de receita'));
    fireEvent.click(screen.getByRole('option', { name: 'Vendas' }));

    expect(screen.getAllByText('1 procedimento').length).toBe(2);
    expect(screen.getByLabelText('Tipo de receita')).toHaveTextContent(
      'Vendas',
    );
  });

  it('switches dimension tabs and announces count', () => {
    render(<DashboardRevenueAnalysisCard />);

    const plansTab = screen.getByRole('tab', { name: 'Planos' });
    fireEvent.mouseDown(plansTab);
    fireEvent.click(plansTab);

    expect(plansTab).toHaveAttribute('data-state', 'active');
    expect(screen.getByText('2 planos')).toBeInTheDocument();
    expect(screen.getByText('Estética')).toBeInTheDocument();
    expect(screen.queryByLabelText('Mostrar tudo')).not.toBeInTheDocument();
  });

  it('shows Mostrar tudo checkbox only on treatments/specialties in receipts mode', () => {
    render(<DashboardRevenueAnalysisCard />);

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Procedimentos' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Procedimentos' }));
    expect(screen.getByLabelText('Mostrar tudo')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Especialidades' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Especialidades' }));
    expect(screen.getByLabelText('Mostrar tudo')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Tipo de receita'));
    fireEvent.click(screen.getByRole('option', { name: 'Vendas' }));
    expect(screen.queryByLabelText('Mostrar tudo')).not.toBeInTheDocument();
  });
});

describe('DashboardRevenueDetailsDialog', () => {
  beforeEach(() => {
    vi.mocked(useDashboardRevenueDetailsQuery).mockImplementation(
      (params) => {
        const filtered = params.search
          ? MOCK_DETAILS.filter((row) =>
              row.patientName
                .toLowerCase()
                .includes(params.search!.toLowerCase()),
            )
          : MOCK_DETAILS;

        return {
          items: filtered,
          meta: {
            total: filtered.length,
            totalValueCents: filtered.reduce(
              (sum, row) => sum + row.valueCents,
              0,
            ),
            page: params.page ?? 1,
            perPage: params.perPage ?? 20,
            totalPages: 1,
          },
          isLoading: false,
          isError: false,
          isFetching: false,
        } as ReturnType<typeof useDashboardRevenueDetailsQuery>;
      },
    );
  });

  it('shows payment columns for receipts mode', () => {
    const onOpenChange = vi.fn();

    render(
      <DashboardRevenueDetailsDialog
        open
        onOpenChange={onOpenChange}
        titlePrefix="Recebimento pelo profissional"
        itemName="Dra. Marina Alves"
        mode="receipts"
        dimension="professionals"
        dimensionKey="pro-dra-marina"
        period="today"
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Recebimento pelo profissional Dra. Marina Alves',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Dra. Marina Alves')).toHaveClass('text-primary');
    expect(screen.queryByRole('button', { name: 'Exportar' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Abrir busca de paciente' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Dt. Pagamento').length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: 'Ana Carolina Silva' }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: 'Ana Carolina Silva' })[0],
    ).toHaveAttribute('href', '/pacientes/pat-001/sobre');
    expect(
      screen.getAllByRole('link', { name: 'Ana Carolina Silva' })[0],
    ).toHaveAttribute('target', '_blank');
    expect(screen.getAllByText('Clareamento dental').length).toBeGreaterThan(0);
    fireEvent.click(
      screen.getByRole('button', { name: 'Abrir busca de paciente' }),
    );
    fireEvent.change(screen.getByLabelText('Buscar paciente'), {
      target: { value: 'Bruno' },
    });
    expect(screen.getByText('Nenhum paciente encontrado.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Buscar paciente'), {
      target: { value: 'Ana' },
    });
    expect(
      screen.getAllByRole('link', { name: 'Ana Carolina Silva' }).length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows sale columns for sales mode', () => {
    render(
      <DashboardRevenueDetailsDialog
        open
        onOpenChange={vi.fn()}
        titlePrefix="Procedimentos executados por"
        itemName="Dra. Marina Alves"
        mode="sales"
        dimension="professionals"
        dimensionKey="pro-dra-marina"
        period="today"
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Procedimentos executados por Dra. Marina Alves',
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Dt. Venda').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Valor da venda').length).toBeGreaterThan(0);
  });
});
