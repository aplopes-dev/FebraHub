import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PaymentMethodRepository } from '../../../domain/repositories/payment-method.repository.interface';
import { PaymentMethodNotFoundError } from '../../../domain/errors/payment-method-not-found.error';
import { PaymentMethodNotRemovableError } from '../../../domain/errors/payment-method-not-removable.error';
import { PaymentMethodInUseError } from '../../../domain/errors/payment-method-in-use.error';
import type { DeletePaymentMethodDto } from '../../dtos/payment-method.dto';

/**
 * Exclui a forma de pagamento (soft-delete).
 *
 * Nunca apaga: pagamentos já registrados apontam para ela (string solta, sem
 * FK — ver `research.md` R1), e o histórico precisa continuar exibindo o
 * valor mesmo depois da exclusão.
 */
@Injectable()
export class DeletePaymentMethodUseCase implements IUseCase<
  DeletePaymentMethodDto,
  void
> {
  constructor(
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async execute(input: DeletePaymentMethodDto): Promise<void> {
    const paymentMethod = await this.paymentMethodRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!paymentMethod || paymentMethod.deletedAt) {
      throw new PaymentMethodNotFoundError(input.id);
    }

    if (paymentMethod.isSystem) {
      throw new PaymentMethodNotRemovableError(input.id);
    }

    const usageCount = await this.paymentMethodRepository.countUsage(
      input.organizationId,
      input.id,
    );
    if (usageCount > 0) {
      throw new PaymentMethodInUseError(input.id);
    }

    const deleted = paymentMethod.softDelete();
    await this.paymentMethodRepository.softDelete(
      input.organizationId,
      input.id,
      deleted.deletedAt ?? new Date(),
    );
  }
}
