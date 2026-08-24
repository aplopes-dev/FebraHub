import type { DealEntity } from '../../../../domain/entities/deal.entity';

/** Shape HTTP de um negócio CRM (sem envelope `{ data }`). */
export function mapDealToHttp(
  deal: DealEntity,
  options?: { transactionId?: string },
) {
  return {
    id: deal.id,
    leadId: deal.leadId,
    propertyId: deal.propertyId ?? undefined,
    propertyName: deal.propertyName || undefined,
    leadName: deal.leadName ?? undefined,
    type: deal.type ?? undefined,
    status: deal.status,
    stage: deal.stage,
    title: deal.title,
    agentId: deal.agentId ?? undefined,
    transactionId: options?.transactionId,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
  };
}

export type DealHttpDto = ReturnType<typeof mapDealToHttp>;

/** Resumo do deal ativo embutido no lead. */
export function mapActiveDealToHttp(deal: DealEntity) {
  return {
    id: deal.id,
    stage: deal.stage,
    status: deal.status,
    propertyId: deal.propertyId ?? undefined,
    propertyName: deal.propertyName || undefined,
    title: deal.title || undefined,
  };
}

export type ActiveDealHttpDto = ReturnType<typeof mapActiveDealToHttp>;
