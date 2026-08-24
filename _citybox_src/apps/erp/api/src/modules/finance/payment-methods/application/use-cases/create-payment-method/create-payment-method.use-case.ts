import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PaymentMethod } from '../../../domain/entities/payment-method.entity';
import { PaymentMethodRepository } from '../../../domain/repositories/payment-method.repository.interface';
import { PaymentMethodNameTakenError } from '../../../domain/errors/payment-method-name-taken.error';
import type { CreatePaymentMethodDto } from '../../dtos/payment-method.dto';

@Injectable()
export class CreatePaymentMethodUseCase implements IUseCase<
  CreatePaymentMethodDto,
  PaymentMethod
> {
  constructor(
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async execute(input: CreatePaymentMethodDto): Promise<PaymentMethod> {
    const name = input.name.trim();
    const existing = await this.paymentMethodRepository.findByName(
      input.organizationId,
      name,
    );
    if (existing) throw new PaymentMethodNameTakenError(name);

    const paymentMethod = PaymentMethod.create({
      organizationId: input.organizationId,
      name,
      fiscalCode: input.fiscalCode,
      installmentPermission: input.installmentPermission,
    });

    return this.paymentMethodRepository.save(paymentMethod);
  }
}
