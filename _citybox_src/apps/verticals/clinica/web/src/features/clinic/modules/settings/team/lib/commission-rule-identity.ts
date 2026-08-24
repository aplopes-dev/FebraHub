import {
  COMMISSION_SCOPE_ALL,
  type CommissionRule,
} from '../types/commission';

const IDENTITY_FIELDS = [
  'paymentTrigger',
  'commissionType',
  'planId',
  'specialtyId',
] as const;

/**
 * Chave de unicidade de uma regra de comissão:
 * gatilho + tipo + plano + especialidade.
 * `budget_approved` ignora plano/especialidade (sempre vazios).
 * Em porcentagem, `COMMISSION_SCOPE_ALL` (= Todos) é valor válido de escopo.
 */
export function getCommissionRuleIdentityKey(
  rule: Pick<
    CommissionRule,
    'paymentTrigger' | 'commissionType' | 'planId' | 'specialtyId'
  >,
): string | null {
  if (!rule.paymentTrigger || !rule.commissionType) return null;

  if (rule.paymentTrigger === 'budget_approved') {
    // Uma única regra de aprovação de orçamento, independente do tipo.
    return 'budget_approved';
  }

  const planId = rule.planId.trim();
  const specialtyId = rule.specialtyId.trim();
  if (!planId || !specialtyId) return null;

  // Valor fixo exige plano/especialidade concretos (não “Todos”).
  if (
    rule.commissionType === 'fixed_value' &&
    (planId === COMMISSION_SCOPE_ALL || specialtyId === COMMISSION_SCOPE_ALL)
  ) {
    return null;
  }

  return `${rule.paymentTrigger}|${rule.commissionType}|${planId}|${specialtyId}`;
}

export function isCommissionRuleIdentityComplete(
  rule: Pick<
    CommissionRule,
    'paymentTrigger' | 'commissionType' | 'planId' | 'specialtyId'
  >,
): boolean {
  return getCommissionRuleIdentityKey(rule) !== null;
}

export function findMatchingCommissionRule(
  rules: CommissionRule[],
  candidate: CommissionRule,
  excludeId?: string,
): CommissionRule | undefined {
  const key = getCommissionRuleIdentityKey(candidate);
  if (!key) return undefined;

  return rules.find((rule) => {
    if (!rule.saved) return false;
    if (excludeId && rule.id === excludeId) return false;
    return getCommissionRuleIdentityKey(rule) === key;
  });
}

/** Existe regra salva de aprovação de orçamento (única por membro). */
export function findExistingBudgetApprovedRule(
  rules: CommissionRule[],
  excludeId?: string,
): CommissionRule | undefined {
  return rules.find((rule) => {
    if (!rule.saved) return false;
    if (excludeId && rule.id === excludeId) return false;
    return rule.paymentTrigger === 'budget_approved';
  });
}

/** Valores copiados de uma regra já salva para pré-preencher o rascunho. */
export function prefillCommissionRuleFromExisting(
  draft: CommissionRule,
  existing: CommissionRule,
): CommissionRule {
  return {
    ...draft,
    percentageValue: existing.percentageValue,
    commissionValueBrl: existing.commissionValueBrl,
    allowValueExceedsTreatment: existing.allowValueExceedsTreatment,
    treatmentCommissionValues: { ...existing.treatmentCommissionValues },
  };
}

export function patchTouchesCommissionIdentity(
  patch: Partial<CommissionRule>,
): boolean {
  return IDENTITY_FIELDS.some((field) => field in patch);
}

/**
 * Mantém 1 regra por chave — a última da lista vence (sobrescreve).
 * `budget_approved` permanece único independente do tipo.
 */
export function dedupeCommissionRulesByIdentity(
  rules: CommissionRule[],
): CommissionRule[] {
  const byKey = new Map<string, CommissionRule>();
  const order: string[] = [];

  for (const rule of rules) {
    if (!rule.saved || !rule.paymentTrigger || !rule.commissionType) {
      continue;
    }

    if (rule.paymentTrigger === 'budget_approved') {
      const budgetKey = 'budget_approved';
      if (!byKey.has(budgetKey)) order.push(budgetKey);
      byKey.set(budgetKey, rule);
      continue;
    }

    const key = getCommissionRuleIdentityKey(rule);
    if (!key) {
      // incompleta mas salva — preserva com id como chave isolada
      if (!byKey.has(rule.id)) order.push(rule.id);
      byKey.set(rule.id, rule);
      continue;
    }

    if (!byKey.has(key)) order.push(key);
    byKey.set(key, rule);
  }

  return order
    .map((key) => byKey.get(key))
    .filter((rule): rule is CommissionRule => Boolean(rule));
}
