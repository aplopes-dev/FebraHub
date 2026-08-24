import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type {
  SplitSource,
  TransactionEntity,
} from '../../../domain/entities/transaction.entity';
import { InvalidSplitError } from '../../../domain/errors/invalid-split.error';
import { TransactionNotFoundError } from '../../../domain/errors/transaction-not-found.error';
import { TransactionRepository } from '../../../domain/repositories/transaction.repository.interface';
import {
  buildCommissionSplit,
  isSplitValid,
  sumSplitPercents,
} from '../../policies/commission-split.math';
import { todayDateOnly } from '../../policies/transaction-date.policy';

export type UpdateTransactionSplitInput = {
  storeId: string;
  id: string;
  agencyPercent: number;
  captorPercent: number;
  sellerPercent: number;
  others?: { label: string; percent: number }[];
  /** Ausente mantém a comissão total atual do negócio. */
  commissionPercent?: number;
  splitSource?: SplitSource;
  actorName: string;
};

@Injectable()
export class UpdateTransactionSplitUseCase implements IUseCase<
  UpdateTransactionSplitInput,
  TransactionEntity
> {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(
    input: UpdateTransactionSplitInput,
  ): Promise<TransactionEntity> {
    const existing = await this.transactions.findById(input.storeId, input.id);
    if (!existing) throw new TransactionNotFoundError(input.id);

    const percents = {
      agencyPercent: input.agencyPercent,
      captorPercent: input.captorPercent,
      sellerPercent: input.sellerPercent,
      others: input.others ?? [],
    };

    if (!isSplitValid(percents)) {
      throw new InvalidSplitError(
        `A soma dos percentuais é ${sumSplitPercents(percents).toFixed(1)}%. Deve ser 100%.`,
      );
    }

    const commissionPercent =
      input.commissionPercent ?? existing.commissionPercent;
    if (commissionPercent < 0) {
      throw new InvalidSplitError('A comissão total não pode ser negativa.');
    }

    const splitSource: SplitSource = input.splitSource ?? 'MANUAL';
    const split = buildCommissionSplit(
      existing.grossValueCents,
      commissionPercent,
      percents,
    );

    const message =
      input.commissionPercent !== undefined
        ? `Comissão total ajustada para ${commissionPercent}% (${splitSource}).`
        : `Split de comissões atualizado (${splitSource}).`;

    const updated = await this.transactions.updateSplit(
      input.storeId,
      input.id,
      { commissionPercent, split, splitSource },
      { at: todayDateOnly(), actorName: input.actorName, message },
    );
    if (!updated) throw new TransactionNotFoundError(input.id);
    return updated;
  }
}
