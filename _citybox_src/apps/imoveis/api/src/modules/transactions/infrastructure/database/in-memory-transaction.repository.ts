import { randomUUID } from 'crypto';
import {
  TransactionEntity,
  type TransactionActivityItem,
  type TransactionStatus,
} from '../../domain/entities/transaction.entity';
import {
  TransactionRepository,
  TRANSACTIONS_AGGREGATE_CAP,
  type CreateTransactionPayload,
  type ListTransactionsFilters,
  type ListTransactionsResult,
  type TransactionActivityInput,
  type UpdateRentalPayoutPayload,
  type UpdateSplitPayload,
  type UpdateTransactionStatusPayload,
} from '../../domain/repositories/transaction.repository.interface';

function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

function matchesSearch(tx: TransactionEntity, search?: string): boolean {
  if (!search) return true;
  const haystack = [
    tx.title,
    tx.propertyName,
    tx.leadName ?? '',
    tx.captorId,
    tx.sellerId ?? '',
  ]
    .map(normalizeSearch)
    .join(' ');
  return haystack.includes(normalizeSearch(search));
}

function toActivity(input: TransactionActivityInput): TransactionActivityItem {
  return {
    id: randomUUID(),
    at: input.at,
    actorName: input.actorName,
    message: input.message,
  };
}

/** Repositório em memória para testes unitários dos use-cases. */
export class InMemoryTransactionRepository extends TransactionRepository {
  private readonly items = new Map<string, TransactionEntity>();

  async findMany(
    storeId: string,
    filters: ListTransactionsFilters,
  ): Promise<ListTransactionsResult> {
    await Promise.resolve();
    let rows = [...this.items.values()].filter((t) => t.storeId === storeId);

    rows = rows.filter((tx) => matchesSearch(tx, filters.search));

    if (filters.type?.length) {
      rows = rows.filter((tx) => filters.type!.includes(tx.type));
    }
    if (filters.status?.length) {
      rows = rows.filter((tx) => filters.status!.includes(tx.status));
    }
    if (filters.agentId) {
      rows = rows.filter(
        (tx) =>
          tx.captorId === filters.agentId || tx.sellerId === filters.agentId,
      );
    }
    if (filters.periodFrom) {
      rows = rows.filter(
        (tx) => tx.createdAt.getTime() >= filters.periodFrom!.getTime(),
      );
    }
    if (filters.periodToExclusive) {
      rows = rows.filter(
        (tx) => tx.createdAt.getTime() < filters.periodToExclusive!.getTime(),
      );
    }

    rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = rows.length;
    const start = (filters.page - 1) * filters.perPage;
    return { items: rows.slice(start, start + filters.perPage), total };
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<TransactionEntity | null> {
    await Promise.resolve();
    const item = this.items.get(id);
    if (!item || item.storeId !== storeId) return null;
    return item;
  }

  async findByDealId(
    storeId: string,
    dealId: string,
  ): Promise<TransactionEntity | null> {
    await Promise.resolve();
    const match = [...this.items.values()].find(
      (item) => item.storeId === storeId && item.dealId === dealId,
    );
    return match ?? null;
  }

  async findOpenByPropertyId(
    storeId: string,
    propertyId: string,
  ): Promise<TransactionEntity[]> {
    await Promise.resolve();
    return [...this.items.values()]
      .filter(
        (item) =>
          item.storeId === storeId &&
          item.propertyId === propertyId &&
          (item.status === 'DRAFT' ||
            item.status === 'PROPOSAL' ||
            item.status === 'CONTRACT_SIGNED'),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findTransactionIdsByDealIds(
    storeId: string,
    dealIds: readonly string[],
  ): Promise<Map<string, string>> {
    await Promise.resolve();
    const ids = new Set(dealIds);
    const map = new Map<string, string>();
    const candidates = [...this.items.values()]
      .filter(
        (item) =>
          item.storeId === storeId && item.dealId && ids.has(item.dealId),
      )
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    for (const item of candidates) {
      if (item.dealId && !map.has(item.dealId)) map.set(item.dealId, item.id);
    }
    return map;
  }

  async findTransactionIdsByLeadIds(
    storeId: string,
    leadIds: readonly string[],
  ): Promise<Map<string, string>> {
    await Promise.resolve();
    const ids = new Set(leadIds);
    const map = new Map<string, string>();
    const candidates = [...this.items.values()]
      .filter(
        (item) =>
          item.storeId === storeId &&
          item.leadId &&
          ids.has(item.leadId) &&
          item.status !== 'CANCELLED',
      )
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    for (const item of candidates) {
      if (item.leadId && !map.has(item.leadId)) map.set(item.leadId, item.id);
    }
    return map;
  }

  async countActiveTransactionsByPropertyId(
    storeId: string,
    propertyId: string,
    excludeTransactionId: string,
    statuses: readonly TransactionStatus[] = [
      'PROPOSAL',
      'CONTRACT_SIGNED',
      'COMPLETED',
    ],
  ): Promise<number> {
    await Promise.resolve();
    const allowed = new Set(statuses);
    let count = 0;
    for (const item of this.items.values()) {
      if (item.storeId !== storeId || item.propertyId !== propertyId) continue;
      if (item.id === excludeTransactionId) continue;
      if (allowed.has(item.status)) count += 1;
    }
    return count;
  }

  async findAllForStore(storeId: string): Promise<TransactionEntity[]> {
    await Promise.resolve();
    return [...this.items.values()]
      .filter((t) => t.storeId === storeId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, TRANSACTIONS_AGGREGATE_CAP);
  }

  async create(payload: CreateTransactionPayload): Promise<TransactionEntity> {
    await Promise.resolve();
    const id = randomUUID();
    const now = new Date();
    const entity = TransactionEntity.create(
      {
        storeId: payload.storeId,
        type: payload.type,
        status: payload.status,
        title: payload.title,
        propertyId: payload.propertyId,
        propertyName: payload.propertyName,
        leadId: payload.leadId,
        leadName: payload.leadName,
        dealId: payload.dealId ?? null,
        captorId: payload.captorId,
        sellerId: payload.sellerId,
        grossValueCents: payload.grossValueCents,
        paymentMethod: payload.paymentMethod,
        commissionPercent: payload.commissionPercent,
        split: payload.split,
        splitSource: payload.splitSource,
        rental: payload.rental,
        activityLog: [toActivity(payload.activity)],
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
    this.items.set(id, entity);
    return entity;
  }

  async updateSplit(
    storeId: string,
    id: string,
    payload: UpdateSplitPayload,
    activity: TransactionActivityInput,
  ): Promise<TransactionEntity | null> {
    const existing = await this.findById(storeId, id);
    if (!existing) return null;
    const next = existing.with({
      commissionPercent: payload.commissionPercent,
      split: payload.split,
      splitSource: payload.splitSource,
      activityLog: [...existing.activityLog, toActivity(activity)],
      updatedAt: new Date(),
    });
    this.items.set(id, next);
    return next;
  }

  async updateRentalPayout(
    storeId: string,
    id: string,
    payload: UpdateRentalPayoutPayload,
    activity: TransactionActivityInput,
  ): Promise<TransactionEntity | null> {
    const existing = await this.findById(storeId, id);
    if (!existing || !existing.rental) return null;
    const next = existing.with({
      rental: {
        ...existing.rental,
        payoutStatus: payload.status,
        paidAt: payload.paidAt ?? undefined,
        payoutAt: payload.payoutAt ?? undefined,
      },
      activityLog: [...existing.activityLog, toActivity(activity)],
      updatedAt: new Date(),
    });
    this.items.set(id, next);
    return next;
  }

  async updateStatus(
    storeId: string,
    id: string,
    payload: UpdateTransactionStatusPayload,
    activity: TransactionActivityInput,
  ): Promise<TransactionEntity | null> {
    const existing = await this.findById(storeId, id);
    if (!existing) return null;
    const next = existing.with({
      status: payload.status,
      activityLog: [...existing.activityLog, toActivity(activity)],
      updatedAt: new Date(),
    });
    this.items.set(id, next);
    return next;
  }
}
