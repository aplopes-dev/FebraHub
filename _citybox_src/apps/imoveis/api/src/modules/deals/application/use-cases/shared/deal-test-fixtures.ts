import type { DealEntity } from '../../../domain/entities/deal.entity';
import type { DealStage } from '../../../domain/entities/deal.entity';
import { InMemoryDealRepository } from '../../../infrastructure/database/in-memory-deal.repository';

export const TEST_STORE = 'store-1';
export const TEST_LEAD_ID = 'lead-1';
export const TEST_PROPERTY_ID = 'prop-1';

export async function seedDeal(
  repo: InMemoryDealRepository,
  overrides: {
    leadId?: string;
    propertyId?: string | null;
    propertyName?: string;
    stage?: DealStage;
    status?: 'active' | 'won' | 'cancelled';
    title?: string;
    type?: 'SALE' | 'RENTAL' | null;
  } = {},
): Promise<DealEntity> {
  const propertyId = overrides.propertyId ?? null;
  const propertyName =
    overrides.propertyName ?? (propertyId ? 'Casa Pontal' : '');
  return repo.create({
    storeId: TEST_STORE,
    leadId: overrides.leadId ?? TEST_LEAD_ID,
    propertyId,
    propertyName,
    leadName: 'Maria Silva',
    stage: overrides.stage ?? 'awaiting_property',
    status: overrides.status ?? 'active',
    title: overrides.title ?? 'Negócio — Maria Silva',
    type: overrides.type ?? null,
  });
}
