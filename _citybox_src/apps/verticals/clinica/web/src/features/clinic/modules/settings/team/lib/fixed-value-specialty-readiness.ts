import type { PlanSpecialtyItem } from '../../plans/types/clinic-plan-specialty';
import {
  COMMISSION_SCOPE_ALL,
  type CommissionRule,
} from '../types/commission';

/** Tratamentos habilitados da especialidade (catálogo do plano). */
export function getEnabledSpecialtyTreatments(
  specialty: PlanSpecialtyItem | null | undefined,
): PlanSpecialtyItem['treatments'] {
  if (!specialty) return [];
  return specialty.treatments.filter((treatment) => treatment.enabled);
}

/**
 * Valor fixo (exceto aprovação de orçamento) exige especialidade concreta
 * com ao menos um tratamento habilitado no plano — senão a regra fica órfã
 * sem linhas para configurar/excluir por tratamento.
 */
export function isFixedValueSpecialtyMissingTreatments(
  rule: Pick<
    CommissionRule,
    'paymentTrigger' | 'commissionType' | 'planId' | 'specialtyId'
  >,
  specialty: PlanSpecialtyItem | null | undefined,
): boolean {
  if (rule.commissionType !== 'fixed_value') return false;
  if (rule.paymentTrigger === 'budget_approved') return false;
  if (rule.paymentTrigger !== 'treatment_completed' && rule.paymentTrigger !== 'debit_received') {
    return false;
  }

  const planId = rule.planId.trim();
  const specialtyId = rule.specialtyId.trim();
  if (
    !planId ||
    !specialtyId ||
    planId === COMMISSION_SCOPE_ALL ||
    specialtyId === COMMISSION_SCOPE_ALL
  ) {
    return false;
  }

  // Especialidade ainda não resolvida (loading) — não bloqueia prematuramente.
  if (!specialty) return false;

  return getEnabledSpecialtyTreatments(specialty).length === 0;
}
