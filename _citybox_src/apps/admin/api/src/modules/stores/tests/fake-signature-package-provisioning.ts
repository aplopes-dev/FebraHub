import {
  SignaturePackageProvisioning,
  type SignaturePackageRequestDto,
} from '../domain/providers/signature-package-provisioning.provider';

type FakeOptions = {
  requests?: SignaturePackageRequestDto[];
};

/**
 * Dublê do port de pacotes de assinatura para testes de use case.
 *
 * Evita HTTP/`CLINICA_API_URL` no unit: o que importa é o contrato (lista / liberar).
 */
export class FakeSignaturePackageProvisioning extends SignaturePackageProvisioning {
  readonly listCalls: string[] = [];
  readonly liberateCalls: Array<{ storeId: string; requestId: string }> = [];
  readonly cancelCalls: Array<{ storeId: string; requestId: string }> = [];

  private requests: SignaturePackageRequestDto[];

  constructor(private readonly options: FakeOptions = {}) {
    super();
    this.requests = [...(options.requests ?? [])];
  }

  listRequests(storeId: string): Promise<SignaturePackageRequestDto[]> {
    this.listCalls.push(storeId);
    return Promise.resolve(this.requests.filter((r) => r.storeId === storeId));
  }

  liberate(
    storeId: string,
    requestId: string,
  ): Promise<SignaturePackageRequestDto> {
    this.liberateCalls.push({ storeId, requestId });
    const index = this.requests.findIndex(
      (r) => r.id === requestId && r.storeId === storeId,
    );
    if (index < 0) {
      throw new Error(
        `Fake: request ${requestId} not found for store ${storeId}`,
      );
    }
    const current = this.requests[index];
    const liberated: SignaturePackageRequestDto = {
      ...current,
      status: 'liberado',
      liberatedAt: new Date().toISOString(),
    };
    this.requests = [
      ...this.requests.slice(0, index),
      liberated,
      ...this.requests.slice(index + 1),
    ];
    return Promise.resolve(liberated);
  }

  cancel(
    storeId: string,
    requestId: string,
  ): Promise<SignaturePackageRequestDto> {
    this.cancelCalls.push({ storeId, requestId });
    const index = this.requests.findIndex(
      (r) => r.id === requestId && r.storeId === storeId,
    );
    if (index < 0) {
      throw new Error(
        `Fake: request ${requestId} not found for store ${storeId}`,
      );
    }
    const current = this.requests[index];
    const cancelled: SignaturePackageRequestDto = {
      ...current,
      status: 'cancelado',
    };
    this.requests = [
      ...this.requests.slice(0, index),
      cancelled,
      ...this.requests.slice(index + 1),
    ];
    return Promise.resolve(cancelled);
  }
}

export function buildSignaturePackageRequest(
  overrides: Partial<SignaturePackageRequestDto> = {},
): SignaturePackageRequestDto {
  return {
    id: 'req-1',
    storeId: 'store-1',
    packageId: 'pkg-250',
    quantity: 250,
    priceCents: 9900,
    status: 'pending',
    createdAt: '2026-08-07T12:00:00.000Z',
    liberatedAt: null,
    ...overrides,
  };
}
