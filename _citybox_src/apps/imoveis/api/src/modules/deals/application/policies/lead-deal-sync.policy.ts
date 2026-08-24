import type { LeadEntity } from '../../../leads/domain/entities/lead.entity';
import type { DealStage } from '../../domain/entities/deal.entity';
import { DEAL_STAGES } from './deal-stage.policy';

export type LeadPropertySnapshot = {
  propertyId: string | null;
  propertyName: string;
};

const STAGE_RANK: Record<DealStage, number> = Object.fromEntries(
  DEAL_STAGES.map((stage, index) => [stage, index]),
) as Record<DealStage, number>;

/** Imóvel principal do lead (vínculo ou snapshot legado em `propertyName`). */
export function resolveLeadPrimaryProperty(
  lead: LeadEntity,
): LeadPropertySnapshot {
  const matched = lead.matchedProperties[0];
  if (matched) {
    return {
      propertyId: matched.propertyId,
      propertyName: matched.propertyName,
    };
  }
  const legacyName = lead.propertyName?.trim() ?? '';
  if (legacyName) {
    return { propertyId: null, propertyName: legacyName };
  }
  return { propertyId: null, propertyName: '' };
}

export function dealHasSelectedProperty(
  snapshot: LeadPropertySnapshot,
): boolean {
  if (snapshot.propertyId) return true;
  return Boolean(snapshot.propertyName.trim());
}

export function resolveDealStageFromLeadProperty(
  snapshot: LeadPropertySnapshot,
): DealStage {
  if (dealHasSelectedProperty(snapshot)) {
    return 'property_selected';
  }
  return 'awaiting_property';
}

/** Etapa alvo do negócio a partir do lead (imóvel + contrato anexado). */
export function resolveTargetDealStageFromLead(lead: LeadEntity): DealStage {
  const property = resolveLeadPrimaryProperty(lead);
  const base = resolveDealStageFromLeadProperty(property);

  const hasContract = lead.documents.some((doc) => doc.kind === 'contract');
  if (hasContract && dealHasSelectedProperty(property)) {
    return 'contract_sent';
  }

  return base;
}

export function shouldAdvanceDealStage(
  current: DealStage,
  target: DealStage,
): boolean {
  return STAGE_RANK[target] > STAGE_RANK[current];
}

export function buildDealTitle(leadName: string, propertyName: string): string {
  const name = propertyName.trim();
  return name ? `Negócio — ${name}` : `Negócio — ${leadName}`;
}

export const EARLY_DEAL_STAGES: readonly DealStage[] = [
  'awaiting_property',
  'property_selected',
] as const;

export function isEarlyDealStage(stage: DealStage): boolean {
  return EARLY_DEAL_STAGES.includes(stage);
}

export function shouldSyncDealStage(
  current: DealStage,
  target: DealStage,
): boolean {
  if (isEarlyDealStage(current)) return true;
  return shouldAdvanceDealStage(current, target);
}
