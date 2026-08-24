import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { instantToCivilDate } from '../../../../transactions/application/policies/transaction-date.policy';
import type { TransactionEntity } from '../../../../transactions/domain/entities/transaction.entity';
import { TransactionRepository } from '../../../../transactions/domain/repositories/transaction.repository.interface';

export type PersonalCommissionEntry = {
  transactionId: string;
  title: string;
  propertyName: string;
  role: 'captor' | 'seller';
  amountCents: number;
  status: 'pending' | 'released';
  date: string;
};

export type ListPersonalCommissionsInput = {
  storeId: string;
  agentId: string;
};

/** Fatia do corretor: captador tem precedência quando acumula os dois papéis. */
function resolveSlice(
  tx: TransactionEntity,
  agentId: string,
): { role: 'captor' | 'seller'; amountCents: number } | null {
  if (tx.captorId === agentId) {
    return { role: 'captor', amountCents: tx.split.captorAmountCents };
  }
  if (tx.sellerId === agentId) {
    return { role: 'seller', amountCents: tx.split.sellerAmountCents };
  }
  return null;
}

@Injectable()
export class ListPersonalCommissionsUseCase implements IUseCase<
  ListPersonalCommissionsInput,
  PersonalCommissionEntry[]
> {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(
    input: ListPersonalCommissionsInput,
  ): Promise<PersonalCommissionEntry[]> {
    const agentId = input.agentId?.trim();
    if (!agentId) {
      throw new ValidatorDomainError({
        internalMessage: 'agentId is required',
        externalMessage: 'Informe o corretor.',
        context: ListPersonalCommissionsUseCase.name,
      });
    }

    const transactions = await this.transactions.findAllForStore(input.storeId);
    const entries: PersonalCommissionEntry[] = [];

    for (const tx of transactions) {
      if (tx.status === 'CANCELLED') continue;
      const slice = resolveSlice(tx, agentId);
      if (!slice || slice.amountCents <= 0) continue;
      entries.push({
        transactionId: tx.id,
        title: tx.title,
        propertyName: tx.propertyName,
        role: slice.role,
        amountCents: slice.amountCents,
        status: tx.status === 'COMPLETED' ? 'released' : 'pending',
        date: instantToCivilDate(tx.updatedAt),
      });
    }

    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }
}
