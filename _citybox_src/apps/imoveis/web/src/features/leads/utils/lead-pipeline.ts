import type { DealStage, DealStatus, LeadStatus } from '../types';

/** Colunas do kanban de negócios — mesma ordem da barra de progresso. */
export const DEAL_KANBAN_STAGES: readonly DealStage[] = [
  'awaiting_property',
  'property_selected',
  'contract_sent',
  'contract_signed',
  'payment_confirmed',
  'handover',
] as const;

export const DEAL_STAGE_LABEL: Record<DealStage, string> = {
  awaiting_property: 'Aguardando imóvel',
  property_selected: 'Imóvel selecionado',
  contract_sent: 'Contrato enviado',
  contract_signed: 'Contrato assinado',
  payment_confirmed: 'Pagamento confirmado',
  handover: 'Entrega',
};

export type PipelineStep = {
  id: DealStage;
  label: string;
};

/** Passos do funil — espelham as colunas do kanban de deals. */
export const PIPELINE_STEPS: readonly PipelineStep[] = DEAL_KANBAN_STAGES.map(
  (stage) => ({
    id: stage,
    label: DEAL_STAGE_LABEL[stage],
  }),
);

const STAGE_TO_INDEX: Record<DealStage, number> = {
  awaiting_property: 0,
  property_selected: 1,
  contract_sent: 2,
  contract_signed: 3,
  payment_confirmed: 4,
  handover: 5,
};

/** Ordem linear legada por status do lead (fallback sem deal). */
const STATUS_RANK: Record<Exclude<LeadStatus, 'cancelled'>, number> = {
  new: 0,
  negotiating: 1,
  'scheduled-visit': 2,
  'closed-won': 3,
};

export function pipelineStepLabel(step: PipelineStep): string {
  return step.label;
}

/**
 * Índice da etapa atual (0–5), alinhado às colunas do kanban de deals.
 * Com negócio ativo, usa `activeDealStage`; sem deal, infere só imóvel vinculado.
 */
export function resolvePipelineProgress(
  status: LeadStatus,
  hasMatchedProperty: boolean,
  activeDealStage?: DealStage | null,
  activeDealStatus?: DealStatus | null,
): number {
  if (status === 'cancelled') return 0;

  if (activeDealStatus === 'won') {
    return PIPELINE_STEPS.length;
  }

  if (activeDealStage) {
    return STAGE_TO_INDEX[activeDealStage];
  }

  if (!hasMatchedProperty) {
    return STAGE_TO_INDEX.awaiting_property;
  }

  return STAGE_TO_INDEX.property_selected;
}

export function isStatusRegression(from: LeadStatus, to: LeadStatus): boolean {
  if (from === 'cancelled' || to === 'cancelled') return false;
  return STATUS_RANK[to] < STATUS_RANK[from];
}

/** Imóvel vinculado ao negócio (id ou nome legado). */
export function dealHasSelectedProperty(deal: {
  propertyId?: string | null;
  propertyName?: string | null;
}): boolean {
  if (deal.propertyId?.trim()) return true;
  return Boolean(deal.propertyName?.trim());
}

export function isDealBeforeStage(
  deal: { stage: DealStage; status: DealStatus } | null | undefined,
  stage: DealStage,
): boolean {
  if (!deal || deal.status !== 'active') return false;
  return STAGE_TO_INDEX[deal.stage] < STAGE_TO_INDEX[stage];
}
