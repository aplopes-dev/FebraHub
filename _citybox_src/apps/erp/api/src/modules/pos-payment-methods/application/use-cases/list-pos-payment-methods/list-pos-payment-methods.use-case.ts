import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PaymentMethod } from '../../../../finance/payment-methods/domain/entities/payment-method.entity';
import { PaymentMethodRepository } from '../../../../finance/payment-methods/domain/repositories/payment-method.repository.interface';

export type ListPosPaymentMethodsDto = {
  organizationId: string;
};

/**
 * Catálogo ativo de formas de pagamento para o terminal (Device).
 * Sem paginação — o seed da plataforma tem ~15 itens e o PDV precisa da lista inteira.
 */
@Injectable()
export class ListPosPaymentMethodsUseCase implements IUseCase<
  ListPosPaymentMethodsDto,
  PaymentMethod[]
> {
  constructor(
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async execute(input: ListPosPaymentMethodsDto): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.findAll(input.organizationId, {
      tab: 'active',
    });
  }
}
