import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { TransactionEntity } from '../../../domain/entities/transaction.entity';
import { TransactionNotFoundError } from '../../../domain/errors/transaction-not-found.error';
import { TransactionRepository } from '../../../domain/repositories/transaction.repository.interface';

export type GetTransactionByIdInput = { storeId: string; id: string };

@Injectable()
export class GetTransactionByIdUseCase implements IUseCase<
  GetTransactionByIdInput,
  TransactionEntity
> {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute({
    storeId,
    id,
  }: GetTransactionByIdInput): Promise<TransactionEntity> {
    const transaction = await this.transactions.findById(storeId, id);
    if (!transaction) throw new TransactionNotFoundError(id);
    return transaction;
  }
}
