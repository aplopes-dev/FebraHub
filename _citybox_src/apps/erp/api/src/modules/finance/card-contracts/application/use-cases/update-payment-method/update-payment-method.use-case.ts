import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { CardPaymentMethod } from '../../../domain/entities/card-payment-method.entity';
import { CardContractRepository } from '../../../domain/repositories/card-contract.repository.interface';
import { CardPaymentMethodRepository } from '../../../domain/repositories/card-payment-method.repository.interface';
import { CardPaymentMethodNotFoundError } from '../../../domain/errors/card-payment-method-not-found.error';
import { assertCardContractExists } from '../assert-card-contract-exists';
import { resolvePaymentMethodUpdateInput } from '../resolve-payment-method-input';
import type { UpdatePaymentMethodDto } from '../../dtos/card-payment-method.dto';

@Injectable()
export class UpdatePaymentMethodUseCase implements IUseCase<
  UpdatePaymentMethodDto,
  CardPaymentMethod
> {
  constructor(
    private readonly cardContractRepository: CardContractRepository,
    private readonly paymentMethodRepository: CardPaymentMethodRepository,
  ) {}

  async execute(input: UpdatePaymentMethodDto): Promise<CardPaymentMethod> {
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

    const updated = existing.update(resolvePaymentMethodUpdateInput(input));

    return this.paymentMethodRepository.save(updated);
  }
}
