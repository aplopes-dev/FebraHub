import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { DealRepository } from '../../../../deals/domain/repositories/deal.repository.interface';
import { LeadRepository } from '../../../../leads/domain/repositories/lead.repository.interface';
import { PropertyRepository } from '../../../../properties/domain/repositories/property.repository.interface';
import type { TransactionEntity } from '../../../domain/entities/transaction.entity';
import { TransactionNotFoundError } from '../../../domain/errors/transaction-not-found.error';
import { TransactionRepository } from '../../../domain/repositories/transaction.repository.interface';
import { applyTransactionCancelSideEffects } from '../../policies/transaction-cancel.side-effects';
import {
  dealStagePayloadOnPaymentConfirmed,
  resolveDealForTransaction,
  shouldAdvanceDealOnPaymentConfirmed,
} from '../../policies/deal-transaction-sync.policy';
import { lockPropertyOnTransactionSettled } from '../../policies/transaction-property.side-effects';
import {
  ACTIVE_TRANSACTION_STATUSES,
  assertTransactionStatusTransition,
  transactionStatusActivityMessage,
  type WritableTransactionStatus,
} from '../../policies/transaction-status.policy';
import { todayDateOnly } from '../../policies/transaction-date.policy';

export type UpdateTransactionStatusInput = {
  storeId: string;
  id: string;
  status: WritableTransactionStatus;
  actorName: string;
};

@Injectable()
export class UpdateTransactionStatusUseCase implements IUseCase<
  UpdateTransactionStatusInput,
  TransactionEntity
> {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly deals: DealRepository,
    private readonly properties: PropertyRepository,
    private readonly leads: LeadRepository,
  ) {}

  async execute(
    input: UpdateTransactionStatusInput,
  ): Promise<TransactionEntity> {
    const existing = await this.transactions.findById(input.storeId, input.id);
    if (!existing) throw new TransactionNotFoundError(input.id);

    assertTransactionStatusTransition(existing.status, input.status);

    const updated = await this.transactions.updateStatus(
      input.storeId,
      input.id,
      { status: input.status },
      {
        at: todayDateOnly(),
        actorName: input.actorName,
        message: transactionStatusActivityMessage(input.status),
      },
    );
    if (!updated) throw new TransactionNotFoundError(input.id);

    if (input.status === 'COMPLETED') {
      await this.syncDealOnPaymentConfirmed(input.storeId, updated);
      await lockPropertyOnTransactionSettled(input.storeId, updated, {
        properties: this.properties,
        deals: this.deals,
      });
    }

    if (input.status === 'CANCELLED') {
      await applyTransactionCancelSideEffects(input.storeId, updated, {
        transactions: this.transactions,
        deals: this.deals,
        properties: this.properties,
        leads: this.leads,
      });
    }

    return updated;
  }

  private async syncDealOnPaymentConfirmed(
    storeId: string,
    transaction: TransactionEntity,
  ): Promise<void> {
    const deal = await resolveDealForTransaction(
      storeId,
      transaction,
      this.deals,
    );
    if (!deal || !shouldAdvanceDealOnPaymentConfirmed(deal)) return;

    const payload = dealStagePayloadOnPaymentConfirmed();
    await this.deals.updateStage(storeId, deal.id, payload);
  }
}

/** Re-export for tests and handover cancel flows. */
export { ACTIVE_TRANSACTION_STATUSES };
