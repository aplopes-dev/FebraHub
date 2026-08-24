import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DashboardPaymentMethodsCard } from './dashboard-payment-methods-card';
import { useDashboardPaymentMethodsQuery } from '../hooks/use-dashboard-payment-methods-query';

vi.mock('../hooks/use-dashboard-payment-methods-query', () => ({
  useDashboardPaymentMethodsQuery: vi.fn(),
}));

vi.mock('@/features/clinic/estoque/lib/use-clinic-id', () => ({
  useClinicId: () => ({ clinicId: 'clinic-1', isReady: true }),
}));

afterEach(cleanup);

function mockPaymentMethodsQuery() {
  vi.mocked(useDashboardPaymentMethodsQuery).mockReturnValue({
    data: {
      totalCents: 18000,
      items: [
        { method: 'cash', amountCents: 5000 },
        { method: 'credit', amountCents: 0 },
        { method: 'debit', amountCents: 0 },
        { method: 'pix', amountCents: 13000 },
        { method: 'transfer', amountCents: 0 },
        { method: 'boleto', amountCents: 0 },
        { method: 'check', amountCents: 0 },
      ],
    },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useDashboardPaymentMethodsQuery>);
}

describe('DashboardPaymentMethodsCard', () => {
  it('renders title, total label and payment method legend', () => {
    mockPaymentMethodsQuery();
    render(<DashboardPaymentMethodsCard />);

    expect(
      screen.getByText('Recebimentos por meio de pagamento'),
    ).toBeInTheDocument();
    expect(screen.getByText('Total recebido')).toBeInTheDocument();
    expect(screen.getByText('Crédito')).toBeInTheDocument();
    expect(screen.getByText('Débito')).toBeInTheDocument();
    expect(screen.getByText('PIX')).toBeInTheDocument();
  });

  it('links Ver to transactions with income + payment method filters', () => {
    mockPaymentMethodsQuery();
    render(<DashboardPaymentMethodsCard />);

    const link = screen.getByRole('link', {
      name: 'Ver recebimentos em Crédito',
    });
    expect(link.getAttribute('href')).toContain(
      '/financeiro/transacoes?',
    );
    expect(link.getAttribute('href')).toContain('types=income');
    expect(link.getAttribute('href')).toContain('paymentMethods=credit');
    expect(link.getAttribute('href')).toContain('view=transactions');
  });
});
