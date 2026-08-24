import type { RentalConfig } from '@/features/transactions/types';

export function computeOwnerPayout(rental: RentalConfig): number {
  const received = rental.receivedCents;
  const adminFee = Math.round((rental.baseRentCents * rental.adminFeePercent) / 100);
  const deductions = rental.deductions.reduce((sum, d) => sum + d.amountCents, 0);
  return received - adminFee - deductions;
}
