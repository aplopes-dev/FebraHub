import type {
  DealEntity,
  DealStage,
  DealStatus,
} from '../../domain/entities/deal.entity';
import { DealPropertyRequiredForStageError } from '../../domain/errors/deal-property-required-for-stage.error';

export const DEAL_STAGES: readonly DealStage[] = [
  'awaiting_property',
  'property_selected',
  'contract_sent',
  'contract_signed',
  'payment_confirmed',
  'handover',
] as const;

export type DealPropertySnapshot = {
  propertyId: string | null;
  propertyName: string;
};

export function dealHasSelectedProperty(deal: DealPropertySnapshot): boolean {
  if (deal.propertyId) return true;
  return Boolean(deal.propertyName.trim());
}

export function assertDealStageTransition(
  deal: DealPropertySnapshot & { id: string },
  targetStage: DealStage,
): void {
  if (targetStage === 'property_selected' && !dealHasSelectedProperty(deal)) {
    throw new DealPropertyRequiredForStageError(deal.id);
  }
}

export function resolveStatusAfterStage(stage: DealStage): DealStatus {
  return stage === 'handover' ? 'won' : 'active';
}

export function defaultStageForProperty(propertyId?: string | null): DealStage {
  return propertyId ? 'property_selected' : 'awaiting_property';
}
