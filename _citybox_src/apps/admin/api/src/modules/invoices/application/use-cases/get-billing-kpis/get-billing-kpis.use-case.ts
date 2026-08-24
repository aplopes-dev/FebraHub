import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  InvoiceRepository,
  TopDefaulter,
  MonthlyRevenue,
} from '../../../domain/repositories/invoice.repository.interface';
import { SubscriptionRepository } from '../../../../subscriptions/domain/repositories/subscription.repository.interface';

export interface GetBillingKpisDto {
  startDate?: Date;
  endDate?: Date;
}

export interface BillingKpisResult {
  mrrCents: number;
  mrrChurnedCents: number;
  pastDueAmountCents: number;
  inadimplenciaRate: number;
  openAmountNext30DaysCents: number;
  currentMonthExpectedReceiptsCents: number;
  currentMonthReceivedReceiptsCents: number;
  currentMonthTotalInvoicesCount: number;
  currentMonthOnTimeInvoicesCount: number;
  topDefaulters: TopDefaulter[];
  revenueHistory: MonthlyRevenue[];
}

@Injectable()
export class GetBillingKpisUseCase implements IUseCase<
  GetBillingKpisDto,
  BillingKpisResult
> {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(dto?: GetBillingKpisDto): Promise<BillingKpisResult> {
    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const startDate = dto?.startDate;
    const endDate = dto?.endDate;

    // 1. Calculate MRR
    // Formula: Sum of (priceCents) for MONTHLY cycle and (priceCents / 12) for YEARLY cycle,
    // for all ACTIVE, TRIALING, or PAST_DUE subscriptions active at the end of the period.
    const allSubscriptions = await this.subscriptionRepository.findAll({
      status: ['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED'],
    });

    let mrrCents = 0;
    const mrrEnd = endDate ?? now;

    for (const sub of allSubscriptions) {
      if (startDate || endDate) {
        // Se há filtro de período, a assinatura deve ter sido criada antes do fim do período
        if (sub.createdAt > mrrEnd) {
          continue;
        }
        // E não deve ter sido cancelada antes do fim do período
        if (sub.canceledAt && sub.canceledAt <= mrrEnd) {
          continue;
        }
      } else {
        // Sem filtro de período, considera apenas as que estão atualmente ativas, trialing ou past_due
        if (
          sub.status !== 'ACTIVE' &&
          sub.status !== 'TRIALING' &&
          sub.status !== 'PAST_DUE'
        ) {
          continue;
        }
      }

      const price = sub.priceCents ?? 0;
      if (sub.cycle === 'MONTHLY') {
        mrrCents += price;
      } else if (sub.cycle === 'YEARLY') {
        mrrCents += Math.round(price / 12);
      }
    }

    // 2. Calculate MRR Churned
    // Formula: Sum of (priceCents) for MONTHLY cycle and (priceCents / 12) for YEARLY cycle,
    // for all CANCELED subscriptions where canceledAt is in the last 30 days.
    const canceledSubscriptions = await this.subscriptionRepository.findAll({
      status: ['CANCELED'],
    });

    let mrrChurnedCents = 0;
    const churnStart = startDate ?? last30Days;
    const churnEnd = endDate ?? now;
    for (const sub of canceledSubscriptions) {
      if (
        sub.canceledAt &&
        sub.canceledAt >= churnStart &&
        sub.canceledAt <= churnEnd
      ) {
        const price = sub.priceCents ?? 0;
        if (sub.cycle === 'MONTHLY') {
          mrrChurnedCents += price;
        } else if (sub.cycle === 'YEARLY') {
          mrrChurnedCents += Math.round(price / 12);
        }
      }
    }

    // 3. Calculate Inadimplência
    // Formulas:
    // - pastDueAmountCents: Sum of amountCents of all invoices with PAST_DUE status.
    // - totalFaturadoCents: Sum of amountCents of all non-DRAFT, non-VOID invoices (OPEN, PAID, PAST_DUE).
    // - inadimplenciaRate: pastDueAmountCents / totalFaturadoCents

    // First, let's run checkPastDue on all OPEN invoices to ensure they are updated
    const openInvoices = await this.invoiceRepository.findAll({
      status: ['OPEN'],
    });
    for (const inv of openInvoices) {
      if (inv.checkPastDue()) {
        await this.invoiceRepository.save(inv);
      }
    }

    const pastDueCriteria: any = { status: ['PAST_DUE'] };
    if (startDate) pastDueCriteria.dueDateFrom = startDate;
    if (endDate) pastDueCriteria.dueDateTo = endDate;

    const pastDueAmountCents =
      await this.invoiceRepository.sumAmountCents(pastDueCriteria);

    const openCriteria: any = { status: ['OPEN'] };
    if (startDate) openCriteria.dueDateFrom = startDate;
    if (endDate) openCriteria.dueDateTo = endDate;
    const openAmountCents =
      await this.invoiceRepository.sumAmountCents(openCriteria);

    const paidCriteria: any = { status: ['PAID'] };
    if (startDate) paidCriteria.dueDateFrom = startDate;
    if (endDate) paidCriteria.dueDateTo = endDate;
    const paidAmountCents =
      await this.invoiceRepository.sumAmountCents(paidCriteria);

    const totalFaturadoCents =
      pastDueAmountCents + openAmountCents + paidAmountCents;
    const inadimplenciaRate =
      totalFaturadoCents > 0 ? pastDueAmountCents / totalFaturadoCents : 0;

    // 4. Calculate A receber em 30 dias
    // Formula: Sum of amountCents of all OPEN invoices with dueDate between now and now + 30 days.
    const openAmountNext30DaysCents =
      await this.invoiceRepository.sumAmountCents({
        status: ['OPEN'],
        dueDateFrom: startDate ?? now,
        dueDateTo: endDate ?? next30Days,
      });

    // 5. Calculate Current Month Goals and On-Time Renewals
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const goalStart = startDate ?? startOfMonth;
    const goalEnd = endDate ?? endOfMonth;

    const currentMonthExpectedReceiptsCents =
      await this.invoiceRepository.sumAmountCents({
        dueDateFrom: goalStart,
        dueDateTo: goalEnd,
        status: ['OPEN', 'PAID', 'PAST_DUE'],
      });

    const currentMonthReceivedReceiptsCents =
      await this.invoiceRepository.sumAmountCents({
        dueDateFrom: goalStart,
        dueDateTo: goalEnd,
        status: ['PAID'],
      });

    const currentMonthTotalInvoicesCount = await this.invoiceRepository.count({
      dueDateFrom: goalStart,
      dueDateTo: goalEnd,
      status: ['OPEN', 'PAID', 'PAST_DUE'],
    });

    const currentMonthInvoices = await this.invoiceRepository.findAll({
      dueDateFrom: goalStart,
      dueDateTo: goalEnd,
      status: ['OPEN', 'PAID', 'PAST_DUE'],
    });

    let currentMonthOnTimeInvoicesCount = 0;
    for (const inv of currentMonthInvoices) {
      if (inv.status === 'PAID') {
        if (inv.paidAt && inv.paidAt <= inv.dueDate) {
          currentMonthOnTimeInvoicesCount++;
        }
      } else if (inv.status === 'OPEN') {
        if (inv.dueDate >= now) {
          currentMonthOnTimeInvoicesCount++;
        }
      }
    }

    const baseDateForHistory = endDate ?? now;
    const historyStartDate = new Date(
      baseDateForHistory.getFullYear(),
      baseDateForHistory.getMonth() - 11,
      1,
      0,
      0,
      0,
      0,
    );
    const historyEndDateLimit = new Date(
      baseDateForHistory.getFullYear(),
      baseDateForHistory.getMonth() + 2,
      0,
      23,
      59,
      59,
      999,
    );

    const topDefaulters = await this.invoiceRepository.getTopDefaulters(
      3,
      startDate,
      endDate,
    );
    const revenueHistory =
      await this.invoiceRepository.getMonthlyRevenueHistory(
        historyStartDate,
        historyEndDateLimit,
      );

    return {
      mrrCents,
      mrrChurnedCents,
      pastDueAmountCents,
      inadimplenciaRate,
      openAmountNext30DaysCents,
      currentMonthExpectedReceiptsCents,
      currentMonthReceivedReceiptsCents,
      currentMonthTotalInvoicesCount,
      currentMonthOnTimeInvoicesCount,
      topDefaulters,
      revenueHistory,
    };
  }
}
