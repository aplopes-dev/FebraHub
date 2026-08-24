import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { SaleOrder } from '../../../domain/entities/sale-order.entity';
import { SaleOrderMovementInUseError } from '../../../domain/errors/sale-order-movement-in-use.error';
import { SaleOrderNotFoundError } from '../../../domain/errors/sale-order-not-found.error';
import { SaleOrderRepository } from '../../../domain/repositories/sale-order.repository.interface';
import { StockProductLookup } from '../../../../stock/domain/repositories/stock-movement.repository.interface';
import { buildSaleOutboundMovement } from '../build-sale-outbound-movement';
import type { UpdateSaleOrderStatusDto } from '../../dtos/sale-order.dto';

/**
 * Troca só a situação do pedido (PATCH dedicado).
 *
 * Ao mover para `closed` sem movimento ainda gerado, cria o movimento de
 * saída (idempotente). Cancelar um pedido que já baixou o estoque é
 * bloqueado — estornar o ledger é ajuste manual à parte (§ mesma regra de
 * `Purchase`).
 */
@Injectable()
export class UpdateSaleOrderStatusUseCase implements IUseCase<
  UpdateSaleOrderStatusDto,
  SaleOrder
> {
  constructor(
    private readonly saleOrderRepository: SaleOrderRepository,
    private readonly stockProductLookup: StockProductLookup,
  ) {}

  async execute(input: UpdateSaleOrderStatusDto): Promise<SaleOrder> {
    const detail = await this.saleOrderRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!detail || detail.saleOrder.deletedAt) {
      throw new SaleOrderNotFoundError(input.id);
    }

    const current = detail.saleOrder;

    if (input.status === 'cancelled' && current.stockMovementId) {
      throw new SaleOrderMovementInUseError(input.id);
    }

    const updated = current.updateStatus(input.status);

    const movement = await buildSaleOutboundMovement(
      { stockProductLookup: this.stockProductLookup },
      updated,
      input.createdByUserId,
    );

    return this.saleOrderRepository.saveWithOptionalMovement(updated, movement);
  }
}
