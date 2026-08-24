import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PaymentMethod } from '../../../domain/entities/payment-method.entity';
import { PaymentMethodRepository } from '../../../domain/repositories/payment-method.repository.interface';
import { PaymentMethodNotFoundError } from '../../../domain/errors/payment-method-not-found.error';
import { PaymentMethodNameTakenError } from '../../../domain/errors/payment-method-name-taken.error';
import { PaymentMethodNotEditableError } from '../../../domain/errors/payment-method-not-editable.error';
import type { UpdatePaymentMethodDto } from '../../dtos/payment-method.dto';

@Injectable()
export class UpdatePaymentMethodUseCase implements IUseCase<
  UpdatePaymentMethodDto,
  PaymentMethod
> {
  constructor(
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async execute(input: UpdatePaymentMethodDto): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!paymentMethod) throw new PaymentMethodNotFoundError(input.id);

    // FR-019: forma de pagamento de sistema é protegida por inteiro — não só
    // o nome, diferente de `FinancialGroup` (que só trava o campo `type`).
    if (paymentMethod.isSystem) {
      throw new PaymentMethodNotEditableError(input.id);
    }

    const name = input.name.trim();
    const existing = await this.paymentMethodRepository.findByName(
      input.organizationId,
      name,
    );
    if (existing && existing.id !== paymentMethod.id) {
      throw new PaymentMethodNameTakenError(name);
    }

    return this.paymentMethodRepository.save(
      paymentMethod.update({
        name,
        fiscalCode: input.fiscalCode,
        installmentPermission: input.installmentPermission,
      }),
    );
  }
}
