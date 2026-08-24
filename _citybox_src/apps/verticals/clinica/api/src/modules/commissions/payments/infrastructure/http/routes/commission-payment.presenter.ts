import type { CommissionPayment } from '../../../domain/entities/commission-payment.entity';
import type { CommissionMemberSummaryView } from '../../../../accruals/application/mappers/aggregate-open-commissions';
import { toCommissionMemberSummaryHttp } from '../../../../accruals/infrastructure/http/routes/commission-accrual.presenter';
import { toIsoDateOnly } from '../../../../shared/domain/commission-date.utils';

export class CommissionPaymentPresenter {
  static toCreatedHttp(payment: CommissionPayment) {
    return {
      data: {
        id: payment.id,
        memberId: payment.memberId,
        memberName: payment.memberName,
        description: payment.description,
        paymentDate: toIsoDateOnly(payment.paymentDate),
        accountId: payment.accountId,
        paymentMethod: payment.paymentMethod,
        grossCents: payment.grossCents,
        discountCents: payment.discountCents,
        netCents: payment.netCents,
        observation: payment.observation,
        expenseEntryId: payment.expenseEntryId,
        accrualIds: payment.accrualIds,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
      },
    };
  }

  static toHistoryListHttp(
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

  static toDetailHttp(summary: CommissionMemberSummaryView) {
    return { data: toCommissionMemberSummaryHttp(summary) };
  }
}
