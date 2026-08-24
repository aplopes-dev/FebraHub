import type { BankTransfer } from '../../../../domain/entities/bank-transfer.entity';

export class BankTransferPresenter {
  static toHttp(bankTransfer: BankTransfer) {
    return {
      id: bankTransfer.id,
      fromBankAccountId: bankTransfer.fromBankAccountId,
      toBankAccountId: bankTransfer.toBankAccountId,
      amountCents: bankTransfer.amountCents,
      effectiveAt: bankTransfer.effectiveAt.toISOString().slice(0, 10),
      paymentMethod: bankTransfer.paymentMethod,
      costCenterId: bankTransfer.costCenterId,
      description: bankTransfer.description,
      createdAt: bankTransfer.createdAt.toISOString(),
    };
  }

  static toHttpSingle(bankTransfer: BankTransfer) {
    return { data: this.toHttp(bankTransfer) };
  }
}
