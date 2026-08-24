/**
 * Porta de entrada de dados da feature transações — consome imoveis-api.
 */
import { ImoveisApiError, imoveisFetch } from '@/lib/imoveis-api';
import type {
  CommissionSplit,
  ListTransactionsParams,
  ListTransactionsResult,
  RentalPayoutStatus,
  SplitSource,
  Transaction,
  TransactionDocumentsPack,
} from '../types';

function csv(values?: readonly string[]): string | undefined {
  if (!values || values.length === 0) return undefined;
  return values.join(',');
}

function buildListQuery(params: ListTransactionsParams): string {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.perPage) q.set('perPage', String(params.perPage));
  if (params.search) q.set('search', params.search);
  const type = csv(params.type);
  if (type) q.set('type', type);
  const status = csv(params.status);
  if (status) q.set('status', status);
  if (params.agentId) q.set('agentId', params.agentId);
  if (params.periodFrom) q.set('periodFrom', params.periodFrom);
  if (params.periodTo) q.set('periodTo', params.periodTo);
  const qs = q.toString();
  return qs ? `?${qs}` : '';
}

export async function listTransactions(
  params: ListTransactionsParams = {},
): Promise<ListTransactionsResult> {
  return imoveisFetch<ListTransactionsResult>(
    `/v1/transactions${buildListQuery(params)}`,
  );
}

export async function getTransactionById(
  id: string,
): Promise<Transaction | null> {
  try {
    const res = await imoveisFetch<{ data: Transaction }>(
      `/v1/transactions/${id}`,
    );
    return res.data;
  } catch (err) {
    if (err instanceof ImoveisApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getTransactionDocuments(
  id: string,
): Promise<TransactionDocumentsPack> {
  const res = await imoveisFetch<{ data: TransactionDocumentsPack }>(
    `/v1/transactions/${id}/documents`,
  );
  return res.data;
}

export async function updateTransactionSplit(
  id: string,
  split: CommissionSplit,
  source: SplitSource,
  actorName: string,
  commissionPercent?: number,
): Promise<Transaction> {
  const res = await imoveisFetch<{ data: Transaction }>(
    `/v1/transactions/${id}/split`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        agencyPercent: split.agencyPercent,
        captorPercent: split.captorPercent,
        sellerPercent: split.sellerPercent,
        others: split.others.map((o) => ({
          label: o.label,
          percent: o.percent,
        })),
        commissionPercent,
        splitSource: source,
        actorName,
      }),
    },
  );
  return res.data;
}

export async function updateRentalPayoutStatus(
  id: string,
  status: RentalPayoutStatus,
  actorName: string,
): Promise<Transaction> {
  const res = await imoveisFetch<{ data: Transaction }>(
    `/v1/transactions/${id}/rental-payout`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, actorName }),
    },
  );
  return res.data;
}

export async function updateTransactionStatus(
  id: string,
  status: 'COMPLETED' | 'CANCELLED',
  actorName: string,
): Promise<Transaction> {
  const res = await imoveisFetch<{ data: Transaction }>(
    `/v1/transactions/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, actorName }),
    },
  );
  return res.data;
}
