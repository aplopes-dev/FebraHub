import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { SaleOrderNotFoundError } from '../../../domain/errors/sale-order-not-found.error';
import { SaleOrderRepository } from '../../../domain/repositories/sale-order.repository.interface';
import type {
  FindSaleOrderByIdDto,
  FindSaleOrderByIdResult,
} from '../../dtos/sale-order.dto';

@Injectable()
export class FindSaleOrderByIdUseCase implements IUseCase<
  FindSaleOrderByIdDto,
  FindSaleOrderByIdResult
> {
  constructor(private readonly saleOrderRepository: SaleOrderRepository) {}

  async execute(input: FindSaleOrderByIdDto): Promise<FindSaleOrderByIdResult> {
    const detail = await this.saleOrderRepository.findById(
      input.organizationId,
      input.id,
    );
    // Devolve mesmo excluído: a aba "Excluídos" da listagem leva até ele.
    if (!detail) throw new SaleOrderNotFoundError(input.id);

    return detail;
  }
}
