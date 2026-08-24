import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { BankTransfer } from '../../../domain/entities/bank-transfer.entity';
import { BankTransferRepository } from '../../../domain/repositories/bank-transfer.repository.interface';
import { BankTransferSameAccountError } from '../../../domain/errors/bank-transfer-same-account.error';
import { BankAccountRepository } from '../../../../bank-accounts/domain/repositories/bank-account.repository.interface';
import { CostCenterRepository } from '../../../../cost-centers/domain/repositories/cost-center.repository.interface';
import { PaymentMethodRepository } from '../../../../payment-methods/domain/repositories/payment-method.repository.interface';
import { assertBankAccountExists } from '../../../../financial-entries/application/use-cases/assert-bank-account-exists';
import { assertCostCenterExists } from '../../../../financial-entries/application/use-cases/assert-cost-center-exists';
import { assertPaymentMethodExists } from '../../../../financial-entries/application/use-cases/assert-payment-method-exists';
import type { CreateBankTransferDto } from '../../dtos/bank-transfer.dto';

@Injectable()
export class CreateBankTransferUseCase implements IUseCase<
  CreateBankTransferDto,
  BankTransfer
> {
  constructor(
    private readonly bankTransferRepository: BankTransferRepository,
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly costCenterRepository: CostCenterRepository,
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async execute(input: CreateBankTransferDto): Promise<BankTransfer> {
    // Antes de qualquer consulta: reprovar mesma conta é 422, não precisa de
    // round-trip ao banco para confirmar.
    if (input.fromBankAccountId === input.toBankAccountId) {
      throw new BankTransferSameAccountError();
    }

    // `assertBankAccountExists` aceita `string | null | undefined`, mas aqui
    // o campo é sempre obrigatório — o retorno `string | null` nunca é null
    // porque um id preenchido inválido já lança antes de devolver.
    await assertBankAccountExists(
      this.bankAccountRepository,
      input.organizationId,
      input.fromBankAccountId,
    );
    await assertBankAccountExists(
      this.bankAccountRepository,
      input.organizationId,
      input.toBankAccountId,
    );
    await assertCostCenterExists(
      this.costCenterRepository,
      input.organizationId,
      input.costCenterId,
    );
    await assertPaymentMethodExists(
      this.paymentMethodRepository,
      input.organizationId,
      input.paymentMethod,
    );

    const transfer = BankTransfer.create({
      organizationId: input.organizationId,
      fromBankAccountId: input.fromBankAccountId,
      toBankAccountId: input.toBankAccountId,
      amountCents: input.amountCents,
      effectiveAt: input.effectiveAt,
      paymentMethod: input.paymentMethod,
      costCenterId: input.costCenterId,
      description: input.description,
      createdByName: input.createdByName,
    });

    return this.bankTransferRepository.save(transfer);
  }
}
