import type { InvoicesStats } from '../../../../domain/repositories/invoice.repository.interface';

export class GetInvoicesStatsPresenter {
  static toHttp(result: InvoicesStats) {
    return {
      openTotalCents: result.openTotalCents,
      paidTotalCents: result.paidTotalCents,
      pendingCount: result.pendingCount,
      overdueCount: result.overdueCount,
      paidCount: result.paidCount,
      totalCount: result.totalCount,
      delinquencyRate: result.delinquencyRate,
    };
  }
}
