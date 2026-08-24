import { BankTransfer } from '../domain/entities/bank-transfer.entity';
import { BankTransferRepository } from '../domain/repositories/bank-transfer.repository.interface';
import { BankTransaction } from '../../bank-accounts/domain/entities/bank-transaction.entity';
import type { InMemoryBankTransactionRepository } from '../../bank-accounts/tests/in-memory-bank-transaction.repository';

/**
 * `save()` espelha o que `PrismaBankTransferRepository` faz numa única
 * transação: grava a transferência e as 2 `BankTransaction` vinculadas
 * (débito na origem, crédito no destino) — ver
 * `specs/erp/002-bank-account-ledger/research.md`.
 */
export class InMemoryBankTransferRepository extends BankTransferRepository {
  private readonly items = new Map<string, BankTransfer>();

  constructor(
    private readonly bankTransactionRepository: InMemoryBankTransactionRepository,
  ) {
    super();
  }

  async save(bankTransfer: BankTransfer): Promise<BankTransfer> {
    this.items.set(bankTransfer.id, bankTransfer);

    const description = bankTransfer.description || 'Transferência';
    this.bankTransactionRepository.insert(
      BankTransaction.create({
        organizationId: bankTransfer.organizationId,
        bankAccountId: bankTransfer.fromBankAccountId,
        kind: 'debit',
        description: `Transferência enviada — ${description}`,
        amountCents: bankTransfer.amountCents,
        effectiveAt: bankTransfer.effectiveAt,
        sourceType: 'bank_transfer',
        sourceId: bankTransfer.id,
      }),
    );
    this.bankTransactionRepository.insert(
      BankTransaction.create({
        organizationId: bankTransfer.organizationId,
        bankAccountId: bankTransfer.toBankAccountId,
        kind: 'credit',
        description: `Transferência recebida — ${description}`,
        amountCents: bankTransfer.amountCents,
        effectiveAt: bankTransfer.effectiveAt,
        sourceType: 'bank_transfer',
        sourceId: bankTransfer.id,
      }),
    );

    return bankTransfer;
  }
}
