import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { SaleOrderNotFoundError } from '../../../domain/errors/sale-order-not-found.error';
import { SaleOrderRepository } from '../../../domain/repositories/sale-order.repository.interface';
import type { DeleteSaleOrderDto } from '../../dtos/sale-order.dto';

/**
 * Exclui o pedido (soft-delete).
 *
 * Sem estornar o movimento de saída já gerado — desfazer o efeito no
 * estoque é ajuste manual à parte (mesma regra de `Purchase`).
 */
@Injectable()
export class DeleteSaleOrderUseCase implements IUseCase<
  DeleteSaleOrderDto,
  void
> {
  constructor(private readonly saleOrderRepository: SaleOrderRepository) {}

  async execute(input: DeleteSaleOrderDto): Promise<void> {
    const detail = await this.saleOrderRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!detail || detail.saleOrder.deletedAt) {
      throw new SaleOrderNotFoundError(input.id);
    }

    await this.saleOrderRepository.softDelete(
      input.organizationId,
      input.id,
      new Date(),
    );
  }
}
