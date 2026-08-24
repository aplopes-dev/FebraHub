import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CardContractRepository } from '../../../domain/repositories/card-contract.repository.interface';
import { CardPaymentMethodRepository } from '../../../domain/repositories/card-payment-method.repository.interface';
import { CardPaymentMethodNotFoundError } from '../../../domain/errors/card-payment-method-not-found.error';
import { assertCardContractExists } from '../assert-card-contract-exists';
import type { DeletePaymentMethodDto } from '../../dtos/card-payment-method.dto';

/**
 * Remove a forma de pagamento e suas faixas (hard delete).
 *
 * Diferente do contrato, que é soft-delete: a forma de pagamento é configuração
 * viva do contrato, não referência de histórico — o que já foi conciliado guarda
 * a taxa aplicada no próprio recebível.
 */
@Injectable()
export class DeletePaymentMethodUseCase implements IUseCase<
  DeletePaymentMethodDto,
  void
> {
  constructor(
    private readonly cardContractRepository: CardContractRepository,
    private readonly paymentMethodRepository: CardPaymentMethodRepository,
  ) {}

  async execute(input: DeletePaymentMethodDto): Promise<void> {
    await assertCardContractExists(
      this.cardContractRepository,
      input.organizationId,
      input.contractId,
    );

    const existing = await this.paymentMethodRepository.findById(
      input.organizationId,
      input.contractId,
      input.id,
    );
    if (!existing) throw new CardPaymentMethodNotFoundError(input.id);

    await this.paymentMethodRepository.delete(
      input.organizationId,
      input.contractId,
      input.id,
    );
  }
}
