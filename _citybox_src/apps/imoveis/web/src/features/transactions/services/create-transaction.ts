import type { SessionUser } from '@/features/shared/session/types';
import { imoveisFetch } from '@/lib/imoveis-api';
import type { CreateTransactionDraft, Transaction } from '../types';

export async function createTransactionFromDraft(
  draft: CreateTransactionDraft,
  sessionUser: SessionUser,
): Promise<Transaction> {
  const res = await imoveisFetch<{ data: Transaction }>('/v1/transactions', {
    method: 'POST',
    body: JSON.stringify({
      type: draft.type,
      propertyId: draft.propertyId,
      leadId: draft.leadId,
      dealId: draft.dealId,
      grossValueCents: draft.grossValueCents,
      paymentMethod: draft.paymentMethod,
      sellerId: draft.sellerId,
      initialStatus: draft.initialStatus,
      actorAgentId: sessionUser.id,
      organizationType: sessionUser.organization.type,
      actorRole: sessionUser.role,
      actorName: sessionUser.name,
    }),
  });
  return res.data;
}
