import type { CommissionMemberSummaryView } from '../../../application/mappers/aggregate-open-commissions';
import type { CommissionAccrual } from '../../../domain/entities/commission-accrual.entity';

export function toCommissionMemberSummaryHttp(
  summary: CommissionMemberSummaryView,
) {
  return {
    professionalId: summary.professionalId,
    professionalName: summary.professionalName,
    totalCents: summary.totalCents,
    hasCommissionConfigured: summary.hasCommissionConfigured,
    ...(summary.paidAt !== undefined ? { paidAt: summary.paidAt } : {}),
    ...(summary.paidValueCents !== undefined
      ? { paidValueCents: summary.paidValueCents }
      : {}),
    ...(summary.discountCents !== undefined && summary.discountCents > 0
      ? { discountCents: summary.discountCents }
      : {}),
    ...(summary.paymentId !== undefined
      ? { paymentId: summary.paymentId }
      : {}),
    ruleGroups: summary.ruleGroups,
  };
}

export function toCommissionAccrualHttp(accrual: CommissionAccrual) {
  return {
    id: accrual.id,
    memberId: accrual.memberId,
    memberName: accrual.memberName,
    ruleId: accrual.ruleId,
    paymentTrigger: accrual.paymentTrigger,
    triggerLabel: accrual.triggerLabel,
    planName: accrual.planName,
    specialtyName: accrual.specialtyName,
    treatmentName: accrual.treatmentName,
    patientName: accrual.patientName,
    paidValueCents: accrual.paidValueCents,
    treatmentCostCents: accrual.treatmentCostCents,
    installment: accrual.installment,
    commissionCents: accrual.commissionCents,
    accruedAt: accrual.accruedAt.toISOString().slice(0, 10),
    sourceFinancialEntryId: accrual.sourceFinancialEntryId,
    status: accrual.status,
    createdAt: accrual.createdAt.toISOString(),
    updatedAt: accrual.updatedAt.toISOString(),
  };
}

export class CommissionAccrualPresenter {
  static toCreatedHttp(accrual: CommissionAccrual) {
    return { data: toCommissionAccrualHttp(accrual) };
  }

  static toOpenListHttp(
    items: CommissionMemberSummaryView[],
    meta: {
      total: number;
      page: number;
      perPage: number;
      totalPages: number;
    },
  ) {
    return {
      data: items.map((item) => toCommissionMemberSummaryHttp(item)),
      meta,
    };
  }

  static toOpenDetailHttp(summary: CommissionMemberSummaryView) {
    return { data: toCommissionMemberSummaryHttp(summary) };
  }
}
