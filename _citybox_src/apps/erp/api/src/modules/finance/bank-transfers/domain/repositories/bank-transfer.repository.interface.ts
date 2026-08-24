import type { BankTransfer } from '../entities/bank-transfer.entity';

/**
 * `save()` é a única operação: sem `GET`/`PUT`/`DELETE` de transferência
 * nesta fase (FR-020) — implementações gravam a transferência + as 2
 * `BankTransaction` vinculadas na mesma transação (FR-010).
 */
export abstract class BankTransferRepository {
  abstract save(bankTransfer: BankTransfer): Promise<BankTransfer>;
}
