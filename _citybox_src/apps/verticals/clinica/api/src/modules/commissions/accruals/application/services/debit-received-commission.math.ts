import type { CommissionRule } from '../../../rules/domain/entities/commission-rule.entity';

export type DebitReceivedLineItem = {
  professionalId: string;
  professionalName: string;
  planId: string;
  planName: string;
  treatmentId: string;
  treatmentName: string;
  specialtyId: string;
  specialtyName: string;
  /** Valor do item no orçamento (centavos). */
  itemValueCents: number;
  /** Custo do tratamento no catálogo (centavos). */
  treatmentCostCents: number;
};

/**
 * Nome exibido na comissão: "Extração 15" quando há dente/região.
 * Evita duplicar se o rótulo já estiver no final do nome.
 */
export function formatCommissionTreatmentName(
  treatmentName: string,
  locationLabel?: string | number | null,
): string {
  const name = treatmentName.trim();
  if (!name) return '';

  const label =
    locationLabel === null || locationLabel === undefined
      ? ''
      : String(locationLabel).trim();
  if (!label) return name;

  if (name === label || name.endsWith(` ${label}`)) {
    return name;
  }

  return `${name} ${label}`;
}

/** Remove sufixo de dente/região (“Extração 15” → “Extração”) para o cabeçalho. */
export function baseCommissionTreatmentName(treatmentName: string): string {
  const name = treatmentName.trim();
  if (!name) return '';
  const stripped = name.replace(/\s+\d{1,2}$/u, '').trim();
  return stripped || name;
}

export type MatchedDebitCommission = {
  rule: CommissionRule;
  item: DebitReceivedLineItem;
  /** Valor pago alocado a este item nesta parcela (centavos). */
  itemPaidValueCents: number;
  commissionCents: number;
};

/** Distribui o valor pago proporcionalmente aos itens (soma → 100% do paid). */
export function allocatePaidValueAcrossItems(
  items: DebitReceivedLineItem[],
  paidValueCents: number,
): Array<{ item: DebitReceivedLineItem; itemPaidValueCents: number }> {
  if (items.length === 0 || paidValueCents <= 0) return [];

  const totalItemCents = items.reduce((sum, item) => sum + item.itemValueCents, 0);
  if (totalItemCents <= 0) return [];

  let allocated = 0;
  return items.map((item, index) => {
    const isLast = index === items.length - 1;
    const itemPaidValueCents = isLast
      ? Math.max(0, paidValueCents - allocated)
      : Math.round((item.itemValueCents / totalItemCents) * paidValueCents);
    allocated += itemPaidValueCents;
    return { item, itemPaidValueCents };
  });
}

export function matchDebitReceivedRule(
  rules: CommissionRule[],
  item: DebitReceivedLineItem,
  specialtyNameById: SpecialtyNameById = new Map(),
): CommissionRule | null {
  return matchPlanSpecialtyTreatmentRule(
    'debit_received',
    rules,
    item,
    specialtyNameById,
  );
}

function specialtyNamesEqual(a: string, b: string): boolean {
  return (
    a.trim().toLocaleLowerCase('pt-BR') === b.trim().toLocaleLowerCase('pt-BR')
  );
}

/** specialtyId → nome (para regra com plano wildcard casar por nome). */
export type SpecialtyNameById = ReadonlyMap<string, string>;

/**
 * Match de regra por gatilho + plano/especialidade (+ treatment em fixed_value).
 * Preferência: fixed_value com treatment explícito > percentage.
 * Com `planId` nulo e `specialtyId` preenchido, casa por nome da especialidade
 * (mesmo nome em planos diferentes) via `specialtyNameById`.
 */
export function matchPlanSpecialtyTreatmentRule(
  trigger: CommissionRule['paymentTrigger'],
  rules: CommissionRule[],
  item: Pick<
    DebitReceivedLineItem,
    'planId' | 'specialtyId' | 'treatmentId' | 'specialtyName'
  >,
  specialtyNameById: SpecialtyNameById = new Map(),
): CommissionRule | null {
  const candidates = rules.filter((rule) => {
    if (rule.paymentTrigger !== trigger) return false;
    if (rule.planId && rule.planId !== item.planId) return false;

    if (rule.specialtyId && rule.specialtyId !== item.specialtyId) {
      // Plano específico: IDs diferentes = não casa.
      if (rule.planId) return false;
      // Plano = Todos: casa por nome da especialidade em qualquer plano.
      const ruleSpecialtyName = specialtyNameById.get(rule.specialtyId) ?? '';
      if (!specialtyNamesEqual(ruleSpecialtyName, item.specialtyName)) {
        return false;
      }
    }

    if (rule.commissionType === 'fixed_value') {
      return rule.treatments.some((t) => t.treatmentId === item.treatmentId);
    }

    return true;
  });

  if (candidates.length === 0) return null;

  const withTreatment = candidates.find(
    (rule) =>
      rule.commissionType === 'fixed_value' &&
      rule.treatments.some((t) => t.treatmentId === item.treatmentId),
  );
  return withTreatment ?? candidates[0] ?? null;
}

export function calculateDebitCommissionCents(
  rule: CommissionRule,
  item: DebitReceivedLineItem,
  itemPaidValueCents: number,
): number {
  if (itemPaidValueCents <= 0) return 0;

  if (rule.commissionType === 'percentage') {
    const pct = rule.percentageValue ?? 0;
    return Math.max(0, Math.round((itemPaidValueCents * pct) / 100));
  }

  const treatmentRule = rule.treatments.find(
    (t) => t.treatmentId === item.treatmentId,
  );
  if (!treatmentRule) return 0;

  // Valor fixo prorateado pela fração paga do item frente ao valor total do item
  if (item.itemValueCents <= 0) return 0;
  return Math.max(
    0,
    Math.round(
      (treatmentRule.amountCents * itemPaidValueCents) / item.itemValueCents,
    ),
  );
}

export function buildDebitCommissionMatches(
  rulesByMember: Map<string, CommissionRule[]>,
  items: DebitReceivedLineItem[],
  paidValueCents: number,
  specialtyNameById: SpecialtyNameById = new Map(),
): MatchedDebitCommission[] {
  const allocated = allocatePaidValueAcrossItems(items, paidValueCents);
  const matches: MatchedDebitCommission[] = [];

  for (const { item, itemPaidValueCents } of allocated) {
    const rules = rulesByMember.get(item.professionalId) ?? [];
    const rule = matchDebitReceivedRule(rules, item, specialtyNameById);
    if (!rule) continue;

    const commissionCents = calculateDebitCommissionCents(
      rule,
      item,
      itemPaidValueCents,
    );
    if (commissionCents <= 0) continue;

    matches.push({
      rule,
      item,
      itemPaidValueCents,
      commissionCents,
    });
  }

  return matches;
}

/** Extrai "1/3" de descrições geradas na approve (`1/3 — Plano…`). */
export function resolveInstallmentLabel(input: {
  description: string;
  installmentNumber: number | null;
  totalInstallments: number | null;
  installmentIndex: number | null;
}): string | null {
  const fromDescription = input.description.match(/^(\d+)\s*\/\s*(\d+)/);
  if (fromDescription) {
    return `${fromDescription[1]}/${fromDescription[2]}`;
  }

  if (
    input.installmentNumber != null &&
    input.totalInstallments != null &&
    input.totalInstallments > 0
  ) {
    return `${input.installmentNumber}/${input.totalInstallments}`;
  }

  if (input.installmentIndex != null && input.installmentIndex > 0) {
    return String(input.installmentIndex);
  }

  return null;
}

/** Parser BRL simplificado (`R$ 25,00` → 2500). */
export function parseBrlStringToCents(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}
