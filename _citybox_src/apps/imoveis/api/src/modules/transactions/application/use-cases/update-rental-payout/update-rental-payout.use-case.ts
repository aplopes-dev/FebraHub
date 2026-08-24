import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { DealRepository } from '../../../../deals/domain/repositories/deal.repository.interface';
import { PropertyRepository } from '../../../../properties/domain/repositories/property.repository.interface';
import type {
  RentalPayoutStatus,
  TransactionEntity,
} from '../../../domain/entities/transaction.entity';
import { TransactionNotFoundError } from '../../../domain/errors/transaction-not-found.error';
import { TransactionRentalMissingError } from '../../../domain/errors/transaction-rental-missing.error';
import { TransactionRepository } from '../../../domain/repositories/transaction.repository.interface';
import {
  dealStagePayloadOnPaymentConfirmed,
  resolveDealForTransaction,
  shouldAdvanceDealOnPaymentConfirmed,
} from '../../policies/deal-transaction-sync.policy';
import { lockPropertyOnTransactionSettled } from '../../policies/transaction-property.side-effects';
import { resolveRentalPayoutTimestamps } from '../../policies/rental-payout.policy';
import { todayDateOnly } from '../../policies/transaction-date.policy';

export type UpdateRentalPayoutInput = {
  storeId: string;
  id: string;
  status: RentalPayoutStatus;
  actorName: string;
};

const STATUS_LABEL: Record<RentalPayoutStatus, string> = {
  AWAITING_PAYMENT: 'Aguardando pagamento',
  PAID_BY_TENANT: 'Pago pelo inquilino',
  READY_FOR_PAYOUT: 'Pronto para repasse',
  PAID_TO_LANDLORD: 'Repassado ao proprietário',
};

@Injectable()
export class UpdateRentalPayoutUseCase implements IUseCase<
  UpdateRentalPayoutInput,
  TransactionEntity
> {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly deals: DealRepository,
    private readonly properties: PropertyRepository,
  ) {}

  async execute(input: UpdateRentalPayoutInput): Promise<TransactionEntity> {
    const existing = await this.transactions.findById(input.storeId, input.id);
    if (!existing) throw new TransactionNotFoundError(input.id);
    if (!existing.rental) throw new TransactionRentalMissingError(input.id);

    const today = todayDateOnly();
    const { paidAt, payoutAt } = resolveRentalPayoutTimestamps(
      existing.rental,
      input.status,
      today,
    );

    const updated = await this.transactions.updateRentalPayout(
      input.storeId,
      input.id,
      { status: input.status, paidAt, payoutAt },
      {
        at: today,
        actorName: input.actorName,
        message: `Status de repasse alterado para ${STATUS_LABEL[input.status]}.`,
      },
    );
    if (!updated) throw new TransactionNotFoundError(input.id);

    if (input.status === 'PAID_BY_TENANT') {
      await this.syncDealOnTenantPayment(input.storeId, updated);
      await lockPropertyOnTransactionSettled(input.storeId, updated, {
        properties: this.properties,
        deals: this.deals,
      });
    }

    return updated;
  }

  private async syncDealOnTenantPayment(
    storeId: string,
    transaction: TransactionEntity,
  ): Promise<void> {
    const deal = await resolveDealForTransaction(
      storeId,
      transaction,
      this.deals,
    );
    if (!deal || !shouldAdvanceDealOnPaymentConfirmed(deal)) return;

    await this.deals.updateStage(
      storeId,
      deal.id,
      dealStagePayloadOnPaymentConfirmed(),
    );
  }
}
