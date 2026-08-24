import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { CardPaymentMethod } from '../../../domain/entities/card-payment-method.entity';
import { CardContractRepository } from '../../../domain/repositories/card-contract.repository.interface';
import { CardPaymentMethodRepository } from '../../../domain/repositories/card-payment-method.repository.interface';
import { assertCardContractExists } from '../assert-card-contract-exists';
import type { ListPaymentMethodsDto } from '../../dtos/card-payment-method.dto';

@Injectable()
export class ListPaymentMethodsUseCase implements IUseCase<
  ListPaymentMethodsDto,
  CardPaymentMethod[]
> {
  constructor(
    private readonly cardContractRepository: CardContractRepository,
    private readonly paymentMethodRepository: CardPaymentMethodRepository,
  ) {}

  async execute(input: ListPaymentMethodsDto): Promise<CardPaymentMethod[]> {
    await assertCardContractExists(
      this.cardContractRepository,
      input.organizationId,
      input.contractId,
    );

    return this.paymentMethodRepository.findAllByContract(
      input.organizationId,
      input.contractId,
    );
  }
}
