import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClinicLojaPage } from '../pages/loja-page';
import { ClinicAssinaturaEletronicaPage } from '../pages/assinatura-eletronica-page';

const pushMock = vi.fn();
const toastSuccess = vi.fn();
const toastInfo = vi.fn();
const createRequestMutate = vi.fn();
type RequestRow = {
  id: string;
  storeId: string;
  packageId: string;
  quantity: number;
  priceCents: number;
  status: 'pending' | 'liberado' | 'cancelado';
  createdAt: string;
  liberatedAt: string | null;
};

const requestsStore = vi.fn(() => [] as RequestRow[]);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

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
  useClinicId: () => ({ clinicId: 'store-test', isReady: true }),
}));

vi.mock('../hooks/use-signature-packages-queries', () => ({
  useSignatureCreditsQuery: () => ({
    data: {
      storeId: 'store-test',
      balance: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useSignaturePackageRequestsQuery: (
    params: {
      page?: number;
      perPage?: number;
      status?: RequestRow['status'];
    } = {},
    enabled = true,
  ) => {
    if (!enabled) {
      return {
        data: undefined,
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
      };
    }
    const all = requestsStore();
    const filtered = params.status
      ? all.filter((item) => item.status === params.status)
      : all;
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 10;
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage);
    const total = filtered.length;
    return {
      data: {
        items,
        meta: {
          total,
          page,
          perPage,
          totalPages: total === 0 ? 0 : Math.ceil(total / perPage),
        },
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    };
  },
  useCreateSignaturePackageRequestMutation: () => ({
    mutate: createRequestMutate,
    isPending: false,
    variables: undefined,
  }),
}));

vi.mock('../hooks/use-electronic-signatures-report-query', () => ({
  useElectronicSignaturesReportQuery: () => ({
    data: {
      items: [],
      meta: {
        total: 0,
        page: 1,
        perPage: 10,
        totalPages: 0,
        stats: { enviados: 0, pendentes: 0, assinados: 0 },
      },
    },
    isLoading: false,
    isPending: false,
    isFetching: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    info: (...args: unknown[]) => toastInfo(...args),
    error: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  pushMock.mockClear();
  toastSuccess.mockClear();
  toastInfo.mockClear();
  createRequestMutate.mockClear();
  requestsStore.mockImplementation(() => []);
});

describe('ClinicLojaPage', () => {
  it('mostra título e CTA Ver pacotes', () => {
    render(<ClinicLojaPage />);

    expect(
      screen.getByRole('heading', { name: 'Pacotes de Comunicação' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ver pacotes' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Assinatura Eletrônica')).toBeInTheDocument();
  });
});

describe('ClinicAssinaturaEletronicaPage', () => {
  it('mostra 3 Solicitar, saldo da API e relatório zerado', () => {
    render(<ClinicAssinaturaEletronicaPage />);

    expect(
      screen.getByRole('link', { name: /Pacotes de Assinatura/ }),
    ).toHaveAttribute('href', '/loja');
    expect(screen.getAllByRole('button', { name: 'Solicitar' })).toHaveLength(
      3,
    );
    expect(screen.getByTestId('assinatura-solicitacoes-count')).toHaveTextContent(
      '0',
    );
    expect(screen.getByRole('button', { name: 'Ver todos' })).toBeInTheDocument();
    expect(screen.getByTestId('assinatura-saldo')).toHaveTextContent('0');
    expect(screen.getByText('Relatório de assinaturas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtrar' })).toBeInTheDocument();
    expect(screen.getByTestId('assinatura-relatorio-stat-enviados')).toHaveTextContent(
      '0',
    );
    expect(screen.getByTestId('assinatura-relatorio-stat-pendentes')).toHaveTextContent(
      '0',
    );
    expect(screen.getByTestId('assinatura-relatorio-stat-assinados')).toHaveTextContent(
      '0',
    );
    expect(screen.getByText('Nenhum documento no período.')).toBeInTheDocument();
  });

  it('Solicitar chama create com packageId', () => {
    render(<ClinicAssinaturaEletronicaPage />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Solicitar' })[0]!);

    expect(createRequestMutate).toHaveBeenCalledWith('pkg-250');
  });

  it('mostra Solicitado desabilitado quando há pending do pacote', () => {
    requestsStore.mockImplementation(() => [
      {
        id: 'req-1',
        storeId: 'store-test',
        packageId: 'pkg-250',
        quantity: 250,
        priceCents: 9990,
        status: 'pending',
        createdAt: '2026-08-07T12:00:00.000Z',
        liberatedAt: null,
      },
    ]);

    render(<ClinicAssinaturaEletronicaPage />);

    const solicitado = screen.getByRole('button', { name: 'Solicitado' });
    expect(solicitado).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Solicitar' })).toHaveLength(2);
    expect(screen.getByTestId('assinatura-solicitacoes-count')).toHaveTextContent(
      '1',
    );
  });

  it('Ver todos abre histórico com data, pacote e status', () => {
    requestsStore.mockImplementation(() => [
      {
        id: 'req-1',
        storeId: 'store-test',
        packageId: 'pkg-250',
        quantity: 250,
        priceCents: 9990,
        status: 'pending',
        createdAt: '2026-08-07T12:00:00.000Z',
        liberatedAt: null,
      },
      {
        id: 'req-2',
        storeId: 'store-test',
        packageId: 'pkg-600',
        quantity: 600,
        priceCents: 19990,
        status: 'liberado',
        createdAt: '2026-07-01T12:00:00.000Z',
        liberatedAt: '2026-07-02T12:00:00.000Z',
      },
    ]);

    render(<ClinicAssinaturaEletronicaPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver todos' }));

    expect(
      screen.getByRole('heading', { name: 'Histórico de solicitações' }),
    ).toBeInTheDocument();
    expect(screen.getByText('250 assinaturas')).toBeInTheDocument();
    expect(screen.getByText('600 assinaturas')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByText('Aprovado')).toBeInTheDocument();
  });
});
