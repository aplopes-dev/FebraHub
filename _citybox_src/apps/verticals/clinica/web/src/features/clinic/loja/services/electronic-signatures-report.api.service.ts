import { clinicaFetch } from '@/features/clinic/shared/api';
import type { ElectronicSignature } from '@/features/clinic/modules/patients/types/electronic-signature';

export type ElectronicSignatureReportItem = ElectronicSignature & {
  patientName: string;
};

export type ElectronicSignatureReportStats = {
  enviados: number;
  pendentes: number;
  assinados: number;
};

export type ElectronicSignatureReportMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  stats: ElectronicSignatureReportStats;
};

export type ListElectronicSignaturesParams = {
  startDate: string;
  endDate: string;
  kind?: 'anamnesis' | 'contract' | 'evolution_batch';
  /** Omitido → pending+signed no backend. */
  statuses?: Array<'pending' | 'signed'>;
  page?: number;
  perPage?: number;
};

type ListEnvelope = {
  data: ElectronicSignatureReportItem[];
  meta: ElectronicSignatureReportMeta;
};

function buildQuery(params: ListElectronicSignaturesParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.kind) searchParams.set('kind', params.kind);
  if (params.statuses) {
    for (const status of params.statuses) {
      searchParams.append('status', status);
    }
  }
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  return `?${searchParams.toString()}`;
}

/** Relatório de assinaturas da loja (listagem + KPIs). */
export async function listElectronicSignatures(
  storeId: string,
  params: ListElectronicSignaturesParams,
): Promise<{
  items: ElectronicSignatureReportItem[];
  meta: ElectronicSignatureReportMeta;
}> {
  const res = await clinicaFetch<ListEnvelope>(
    storeId,
    `/v1/electronic-signatures${buildQuery(params)}`,
  );
  return { items: res.data, meta: res.meta };
}
