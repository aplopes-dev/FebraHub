import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { PaymentMethod } from '../../../domain/entities/payment-method.entity';
import { PaymentMethodRepository } from '../../../domain/repositories/payment-method.repository.interface';
import { PaymentMethodNotFoundError } from '../../../domain/errors/payment-method-not-found.error';
import type { RestorePaymentMethodDto } from '../../dtos/payment-method.dto';

@Injectable()
export class RestorePaymentMethodUseCase implements IUseCase<
  RestorePaymentMethodDto,
  PaymentMethod
> {
  constructor(
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async execute(input: RestorePaymentMethodDto): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!paymentMethod) throw new PaymentMethodNotFoundError(input.id);

    // Restaurar quem já está ativo não é erro: o botão pode ter sido clicado
    // duas vezes, e o resultado desejado — forma de pagamento ativa — é o mesmo.
    if (!paymentMethod.deletedAt) return paymentMethod;

    const restored = paymentMethod.restore();
    await this.paymentMethodRepository.clearDeletedAt(
      input.organizationId,
      input.id,
      restored.updatedAt,
    );
    return restored;
  }
}
