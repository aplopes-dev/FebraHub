import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { SaleOrder } from '../../../domain/entities/sale-order.entity';
import { SaleOrderNotFoundError } from '../../../domain/errors/sale-order-not-found.error';
import { SaleOrderRepository } from '../../../domain/repositories/sale-order.repository.interface';
import type { RestoreSaleOrderDto } from '../../dtos/sale-order.dto';

/**
 * Restaura pedido soft-deleted (volta à aba Aberto).
 *
 * Idempotente se já estiver ativo. Não cria nem estorna movimento de estoque.
 */
@Injectable()
export class RestoreSaleOrderUseCase implements IUseCase<
  RestoreSaleOrderDto,
  SaleOrder
> {
  constructor(private readonly saleOrderRepository: SaleOrderRepository) {}

  async execute(input: RestoreSaleOrderDto): Promise<SaleOrder> {
    const detail = await this.saleOrderRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!detail) throw new SaleOrderNotFoundError(input.id);

    const { saleOrder } = detail;
    if (!saleOrder.deletedAt) return saleOrder;

    const restored = saleOrder.restore();
    await this.saleOrderRepository.clearDeletedAt(
      input.organizationId,
      input.id,
      restored.updatedAt,
    );
    return restored;
  }
}
