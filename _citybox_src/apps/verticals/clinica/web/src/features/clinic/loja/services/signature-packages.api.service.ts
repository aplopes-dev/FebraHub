import { clinicaFetch } from '@/features/clinic/shared/api';

export type SignatureCredits = {
  storeId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export type SignaturePackageRequest = {
  id: string;
  storeId: string;
  packageId: string;
  quantity: number;
  priceCents: number;
  status: 'pending' | 'liberado' | 'cancelado';
  createdAt: string;
  liberatedAt: string | null;
};

export type SignaturePackageRequestsMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ListSignaturePackageRequestsParams = {
  page?: number;
  perPage?: number;
  status?: SignaturePackageRequest['status'];
};

export type SignaturePackageRequestsPage = {
  items: SignaturePackageRequest[];
  meta: SignaturePackageRequestsMeta;
};

type CreditsEnvelope = {
  data: SignatureCredits;
};

type RequestEnvelope = {
  data: SignaturePackageRequest;
};

type RequestsListEnvelope = {
  data: SignaturePackageRequest[];
  meta: SignaturePackageRequestsMeta;
};

/** Saldo de créditos de assinatura eletrônica da loja. */
export async function getSignatureCredits(
  storeId: string,
): Promise<SignatureCredits> {
  const res = await clinicaFetch<CreditsEnvelope>(
    storeId,
    '/v1/signature-credits',
  );
  return res.data;
}

function buildRequestsQuery(params?: ListSignaturePackageRequestsParams): string {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) {
    searchParams.set('page', String(params.page));
  }
  if (params?.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  if (params?.status) {
    searchParams.set('status', params.status);
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/** Lista solicitações de pacote da loja (paginado, mais recentes primeiro). */
export async function listSignaturePackageRequests(
  storeId: string,
  params?: ListSignaturePackageRequestsParams,
): Promise<SignaturePackageRequestsPage> {
  const res = await clinicaFetch<RequestsListEnvelope>(
    storeId,
    `/v1/signature-package-requests${buildRequestsQuery(params)}`,
  );
  return { items: res.data, meta: res.meta };
}

/** Solicita um pacote de assinaturas (liberação no admin). */
export async function createSignaturePackageRequest(
  storeId: string,
  packageId: string,
): Promise<SignaturePackageRequest> {
  const res = await clinicaFetch<RequestEnvelope>(
    storeId,
    '/v1/signature-package-requests',
    {
      method: 'POST',
      body: JSON.stringify({ packageId }),
    },
  );
  return res.data;
}
