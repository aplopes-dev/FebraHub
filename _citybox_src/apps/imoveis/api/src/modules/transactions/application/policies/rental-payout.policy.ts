import type {
  RentalConfig,
  RentalPayoutStatus,
} from '../../domain/entities/transaction.entity';

/**
 * Transição de status de repasse.
 *
 * `PAID_BY_TENANT` carimba `paidAt`; `PAID_TO_LANDLORD` carimba `payoutAt`.
 * Carimbos já existentes são preservados ao avançar no fluxo.
 */
export function resolveRentalPayoutTimestamps(
  rental: RentalConfig,
  status: RentalPayoutStatus,
  today: string,
): { paidAt: string | null; payoutAt: string | null } {
  return {
    paidAt: rental.paidAt ?? (status === 'PAID_BY_TENANT' ? today : null),
    payoutAt: rental.payoutAt ?? (status === 'PAID_TO_LANDLORD' ? today : null),
  };
}

/** Valor líquido devido ao proprietário. */
export function computeOwnerPayout(rental: RentalConfig): number {
  const adminFee = computeAdminFee(rental);
  const deductions = computeDeductions(rental);
  return rental.receivedCents - adminFee - deductions;
}

export function computeAdminFee(rental: RentalConfig): number {
  return Math.round((rental.baseRentCents * rental.adminFeePercent) / 100);
}

export function computeDeductions(rental: RentalConfig): number {
  return rental.deductions.reduce((sum, d) => sum + d.amountCents, 0);
}
