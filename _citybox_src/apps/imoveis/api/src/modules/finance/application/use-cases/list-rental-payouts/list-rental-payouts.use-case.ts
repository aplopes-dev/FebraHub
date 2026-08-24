import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { RentalPayoutStatus } from '../../../../transactions/domain/entities/transaction.entity';
import { TransactionRepository } from '../../../../transactions/domain/repositories/transaction.repository.interface';
import {
  computeAdminFee,
  computeDeductions,
  computeOwnerPayout,
} from '../../../../transactions/application/policies/rental-payout.policy';

export type RentalPayoutRow = {
  transactionId: string;
  propertyName: string;
  tenantName: string;
  landlordName: string;
  rentCents: number;
  adminFeeCents: number;
  deductionsCents: number;
  payoutCents: number;
  status: RentalPayoutStatus;
  dueDay: number;
};

@Injectable()
export class ListRentalPayoutsUseCase implements IUseCase<
  { storeId: string },
  RentalPayoutRow[]
> {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute({ storeId }: { storeId: string }): Promise<RentalPayoutRow[]> {
    const transactions = await this.transactions.findAllForStore(storeId);
    return transactions
      .filter((tx) => tx.type === 'RENTAL' && tx.rental !== null)
      .map((tx) => {
        const rental = tx.rental!;
        return {
          transactionId: tx.id,
          propertyName: tx.propertyName,
          tenantName: rental.tenantName,
          landlordName: rental.landlordName,
          rentCents: rental.baseRentCents,
          adminFeeCents: computeAdminFee(rental),
          deductionsCents: computeDeductions(rental),
          payoutCents: computeOwnerPayout(rental),
          status: rental.payoutStatus,
          dueDay: rental.dueDay,
        };
      });
  }
}
