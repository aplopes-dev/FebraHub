import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CardPaymentMethod } from '../../../domain/entities/card-payment-method.entity';
import { CardContractRepository } from '../../../domain/repositories/card-contract.repository.interface';
import { CardPaymentMethodRepository } from '../../../domain/repositories/card-payment-method.repository.interface';
import { assertCardContractExists } from '../assert-card-contract-exists';
import { resolvePaymentMethodUpdateInput } from '../resolve-payment-method-input';
import type { CreatePaymentMethodDto } from '../../dtos/card-payment-method.dto';

@Injectable()
export class CreatePaymentMethodUseCase implements IUseCase<
  CreatePaymentMethodDto,
  CardPaymentMethod
> {
  constructor(
    private readonly cardContractRepository: CardContractRepository,
    private readonly paymentMethodRepository: CardPaymentMethodRepository,
  ) {}

  async execute(input: CreatePaymentMethodDto): Promise<CardPaymentMethod> {
    await assertCardContractExists(
      this.cardContractRepository,
      input.organizationId,
      input.contractId,
    );

    // A construção da entidade é quem valida as faixas progressivas — faixa
    // sobreposta nunca chega ao banco.
    const method = CardPaymentMethod.create({
      organizationId: input.organizationId,
      cardContractId: input.contractId,
      ...resolvePaymentMethodUpdateInput(input),
    });

    return this.paymentMethodRepository.save(method);
  }
}
