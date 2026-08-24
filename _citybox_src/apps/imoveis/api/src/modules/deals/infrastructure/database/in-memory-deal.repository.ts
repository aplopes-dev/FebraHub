import { randomUUID } from 'crypto';
import { DealEntity } from '../../domain/entities/deal.entity';
import {
  DealRepository,
  type CreateDealPayload,
  type ListDealsFilters,
  type ListDealsResult,
  type UpdateDealPayload,
  type UpdateDealStagePayload,
} from '../../domain/repositories/deal.repository.interface';

function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

function matchesSearch(deal: DealEntity, search?: string): boolean {
  if (!search) return true;
  const haystack = [deal.title, deal.propertyName, deal.leadName ?? '']
    .map(normalizeSearch)
    .join(' ');
  return haystack.includes(normalizeSearch(search));
}

/** Repositório em memória para testes unitários dos use-cases. */
export class InMemoryDealRepository extends DealRepository {
  private readonly items = new Map<string, DealEntity>();

  async findMany(
    storeId: string,
    filters: ListDealsFilters,
  ): Promise<ListDealsResult> {
    await Promise.resolve();
    let rows = [...this.items.values()].filter((d) => d.storeId === storeId);

    rows = rows.filter((deal) => matchesSearch(deal, filters.search));

    if (filters.leadId) {
      rows = rows.filter((deal) => deal.leadId === filters.leadId);
    }
    if (filters.propertyId) {
      rows = rows.filter((deal) => deal.propertyId === filters.propertyId);
    }
    if (filters.agentId) {
      rows = rows.filter((deal) => deal.agentId === filters.agentId);
    }
    if (filters.status?.length) {
      rows = rows.filter((deal) => filters.status!.includes(deal.status));
    }
    if (filters.stage?.length) {
      rows = rows.filter((deal) => filters.stage!.includes(deal.stage));
    }

    rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = rows.length;
    const start = (filters.page - 1) * filters.perPage;
    return { items: rows.slice(start, start + filters.perPage), total };
  }

  async findById(storeId: string, id: string): Promise<DealEntity | null> {
    await Promise.resolve();
    const item = this.items.get(id);
    if (!item || item.storeId !== storeId) return null;
    return item;
  }

  async findActiveByLeadId(
    storeId: string,
    leadId: string,
  ): Promise<DealEntity | null> {
    await Promise.resolve();
    const active = [...this.items.values()]
      .filter(
        (deal) =>
          deal.storeId === storeId &&
          deal.leadId === leadId &&
          deal.status === 'active',
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return active[0] ?? null;
  }

  async findPipelineDealByLeadId(
    storeId: string,
    leadId: string,
  ): Promise<DealEntity | null> {
    await Promise.resolve();
    const active = await this.findActiveByLeadId(storeId, leadId);
    if (active) return active;

    const won = [...this.items.values()]
      .filter(
        (deal) =>
          deal.storeId === storeId &&
          deal.leadId === leadId &&
          deal.status === 'won',
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return won[0] ?? null;
  }

  async create(payload: CreateDealPayload): Promise<DealEntity> {
    await Promise.resolve();
    const now = new Date();
    const entity = DealEntity.create(
      {
        storeId: payload.storeId,
        leadId: payload.leadId,
        propertyId: payload.propertyId ?? null,
        propertyName: payload.propertyName ?? '',
        leadName: payload.leadName ?? null,
        type: payload.type ?? null,
        status: payload.status ?? 'active',
        stage: payload.stage ?? 'awaiting_property',
        title: payload.title ?? '',
        agentId: payload.agentId ?? null,
        createdAt: now,
        updatedAt: now,
      },
      randomUUID(),
    );
    this.items.set(entity.id, entity);
    return entity;
  }

  async update(
    storeId: string,
    id: string,
    payload: UpdateDealPayload,
  ): Promise<DealEntity | null> {
    await Promise.resolve();
    const existing = await this.findById(storeId, id);
    if (!existing) return null;
    const updated = existing.with({
      ...(payload.propertyId !== undefined
        ? { propertyId: payload.propertyId }
        : {}),
      ...(payload.propertyName !== undefined
        ? { propertyName: payload.propertyName }
        : {}),
      ...(payload.leadName !== undefined ? { leadName: payload.leadName } : {}),
      ...(payload.type !== undefined ? { type: payload.type } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.stage !== undefined ? { stage: payload.stage } : {}),
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.agentId !== undefined ? { agentId: payload.agentId } : {}),
      updatedAt: new Date(),
    });
    this.items.set(id, updated);
    return updated;
  }

  async updateStage(
    storeId: string,
    id: string,
    payload: UpdateDealStagePayload,
  ): Promise<DealEntity | null> {
    await Promise.resolve();
    return this.update(storeId, id, {
      stage: payload.stage,
      ...(payload.status !== undefined ? { status: payload.status } : {}),
    });
  }

  async delete(storeId: string, id: string): Promise<boolean> {
    await Promise.resolve();
    const item = this.items.get(id);
    if (!item || item.storeId !== storeId) return false;
    this.items.delete(id);
    return true;
  }
}
