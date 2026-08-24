import type { CommissionAccrual } from '../../../accruals/domain/entities/commission-accrual.entity';
import type { CommissionPaymentLoaded } from '../../domain/repositories/commission-payment.repository.interface';
import { toIsoDateOnly } from '../../../shared/domain/commission-date.utils';
import {
  buildMemberSummary,
  type CommissionMemberSummaryView,
} from '../../../accruals/application/mappers/aggregate-open-commissions';

type MemberHistoryBucket = {
  memberName: string;
  accrualsById: Map<string, CommissionAccrual>;
  netCents: number;
  grossCents: number;
  discountCents: number;
  latestPaidAt: Date;
};

/**
 * Agrupa pagamentos do período por profissional: soma líquida/bruta/desconto e une accruals
 * (tabelas de regras) num único resumo — 1 linha por membro no Histórico.
 */
export function aggregateHistoryByMember(
  loaded: CommissionPaymentLoaded[],
): CommissionMemberSummaryView[] {
  const byMember = new Map<string, MemberHistoryBucket>();

  for (const { payment, accruals } of loaded) {
    const existing = byMember.get(payment.memberId);
    if (!existing) {
      byMember.set(payment.memberId, {
        memberName: payment.memberName,
        accrualsById: new Map(accruals.map((a) => [a.id, a])),
        netCents: payment.netCents,
        grossCents: payment.grossCents,
        discountCents: payment.discountCents,
        latestPaidAt: payment.paymentDate,
      });
      continue;
    }

    const nextAccruals = new Map(existing.accrualsById);
    for (const accrual of accruals) {
      nextAccruals.set(accrual.id, accrual);
    }

    const isNewer =
      payment.paymentDate.getTime() > existing.latestPaidAt.getTime();

    byMember.set(payment.memberId, {
      memberName: isNewer ? payment.memberName : existing.memberName,
      accrualsById: nextAccruals,
      netCents: existing.netCents + payment.netCents,
      grossCents: existing.grossCents + payment.grossCents,
      discountCents: existing.discountCents + payment.discountCents,
      latestPaidAt: isNewer ? payment.paymentDate : existing.latestPaidAt,
    });
  }

  return [...byMember.entries()]
    .map(([memberId, bucket]) =>
      buildMemberSummary({
        memberId,
        memberName: bucket.memberName,
        hasCommissionConfigured: true,
        accruals: [...bucket.accrualsById.values()],
        paidAt: toIsoDateOnly(bucket.latestPaidAt),
        paidValueCents: bucket.netCents,
        discountCents: bucket.discountCents,
        totalCentsOverride: bucket.grossCents,
      }),
    )
    .sort((a, b) =>
      a.professionalName.localeCompare(b.professionalName, 'pt-BR'),
    );
}
