import type { TransactionEntity } from '../../../../domain/entities/transaction.entity';

/** Shape HTTP de um negócio (sem envelope `{ data }`). */
export function mapTransactionToHttp(transaction: TransactionEntity) {
  const rental = transaction.rental;
  return {
    id: transaction.id,
    type: transaction.type,
    status: transaction.status,
    title: transaction.title,
    propertyId: transaction.propertyId ?? undefined,
    propertyName: transaction.propertyName,
    leadId: transaction.leadId ?? undefined,
    leadName: transaction.leadName ?? undefined,
    dealId: transaction.dealId ?? undefined,
    captorId: transaction.captorId,
    sellerId: transaction.sellerId ?? undefined,
    grossValueCents: transaction.grossValueCents,
    paymentMethod: transaction.paymentMethod,
    commissionPercent: transaction.commissionPercent,
    split: {
      agencyPercent: transaction.split.agencyPercent,
      captorPercent: transaction.split.captorPercent,
      sellerPercent: transaction.split.sellerPercent,
      others: transaction.split.others.map((other) => ({ ...other })),
      agencyAmountCents: transaction.split.agencyAmountCents,
      captorAmountCents: transaction.split.captorAmountCents,
      sellerAmountCents: transaction.split.sellerAmountCents,
      totalCommissionCents: transaction.split.totalCommissionCents,
    },
    splitSource: transaction.splitSource,
    rental: rental
      ? {
          landlordName: rental.landlordName,
          tenantName: rental.tenantName,
          baseRentCents: rental.baseRentCents,
          condoCents: rental.condoCents,
          iptuCents: rental.iptuCents,
          adminFeePercent: rental.adminFeePercent,
          dueDay: rental.dueDay,
          payoutStatus: rental.payoutStatus,
          receivedCents: rental.receivedCents,
          deductions: rental.deductions.map((d) => ({ ...d })),
          paidAt: rental.paidAt,
          payoutAt: rental.payoutAt,
        }
      : undefined,
    activityLog: transaction.activityLog.map((activity) => ({ ...activity })),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

export type TransactionHttpDto = ReturnType<typeof mapTransactionToHttp>;
