import type { CommissionAccrual } from '../../domain/entities/commission-accrual.entity';
import { toIsoDateOnly } from '../../../shared/domain/commission-date.utils';
import { baseCommissionTreatmentName } from '../services/debit-received-commission.math';

export type CommissionTreatmentRowView = {
  id: string;
  paidAt: string;
  patientName: string;
  treatmentName: string;
  paidValueCents: number;
  treatmentCostCents: number;
  installment: string | null;
  commissionCents: number;
};

export type CommissionRuleGroupView = {
  id: string;
  triggerLabel: string;
  planName: string;
  specialtyName: string;
  treatmentSummary: string;
  totalCommissionCents: number;
  rows: CommissionTreatmentRowView[];
};

export type CommissionMemberSummaryView = {
  professionalId: string;
  professionalName: string;
  totalCents: number;
  hasCommissionConfigured: boolean;
  paidAt?: string;
  paidValueCents?: number;
  /** Soma de descontos nos pagamentos (histórico) */
  discountCents?: number;
  /** Presente no histórico de pagamentos */
  paymentId?: string;
  ruleGroups: CommissionRuleGroupView[];
};

function groupKey(accrual: CommissionAccrual): string {
  return [
    accrual.triggerLabel,
    accrual.planName,
    accrual.specialtyName,
  ].join('\0');
}

export function buildRuleGroupsFromAccruals(
  accruals: CommissionAccrual[],
): CommissionRuleGroupView[] {
  const groups = new Map<
    string,
    {
      triggerLabel: string;
      planName: string;
      specialtyName: string;
      rows: CommissionTreatmentRowView[];
    }
  >();

  const sorted = [...accruals].sort(
    (a, b) => a.accruedAt.getTime() - b.accruedAt.getTime(),
  );

  for (const accrual of sorted) {
    const key = groupKey(accrual);
    const existing = groups.get(key);
    const row: CommissionTreatmentRowView = {
      id: accrual.id,
      paidAt: toIsoDateOnly(accrual.accruedAt),
      patientName: accrual.patientName,
      treatmentName: accrual.treatmentName,
      paidValueCents: accrual.paidValueCents,
      treatmentCostCents: accrual.treatmentCostCents,
      installment: accrual.installment,
      commissionCents: accrual.commissionCents,
    };
    if (existing) {
      existing.rows.push(row);
    } else {
      groups.set(key, {
        triggerLabel: accrual.triggerLabel,
        planName: accrual.planName,
        specialtyName: accrual.specialtyName,
        rows: [row],
      });
    }
  }

  return [...groups.entries()].map(([key, group], index) => {
    // Cabeçalho: só o nome base (sem dente). O dente fica nas linhas da tabela.
    const treatmentNames = [
      ...new Set(
        group.rows.map((row) => baseCommissionTreatmentName(row.treatmentName)),
      ),
    ];
    return {
      id: `rg-${index + 1}-${key.replace(/\0/g, '-')}`,
      triggerLabel: group.triggerLabel,
      planName: group.planName,
      specialtyName: group.specialtyName,
      treatmentSummary: treatmentNames.join(', '),
      totalCommissionCents: group.rows.reduce(
        (sum, row) => sum + row.commissionCents,
        0,
      ),
      rows: group.rows,
    };
  });
}

export function buildMemberSummary(input: {
  memberId: string;
  memberName: string;
  hasCommissionConfigured: boolean;
  accruals: CommissionAccrual[];
  paidAt?: string;
  paidValueCents?: number;
  discountCents?: number;
  paymentId?: string;
  totalCentsOverride?: number;
}): CommissionMemberSummaryView {
  const ruleGroups = buildRuleGroupsFromAccruals(input.accruals);
  return {
    professionalId: input.memberId,
    professionalName: input.memberName,
    totalCents:
      input.totalCentsOverride ??
      ruleGroups.reduce((sum, group) => sum + group.totalCommissionCents, 0),
    hasCommissionConfigured: input.hasCommissionConfigured,
    paidAt: input.paidAt,
    paidValueCents: input.paidValueCents,
    discountCents: input.discountCents,
    paymentId: input.paymentId,
    ruleGroups,
  };
}
