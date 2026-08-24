import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { SaleOrder } from '../../../domain/entities/sale-order.entity';
import { SaleOrderAlreadyClosedError } from '../../../domain/errors/sale-order-already-closed.error';
import { SaleOrderEmptyLinesError } from '../../../domain/errors/sale-order-empty-lines.error';
import { SaleOrderNotFoundError } from '../../../domain/errors/sale-order-not-found.error';
import { SaleOrderRepository } from '../../../domain/repositories/sale-order.repository.interface';
import { CustomerRepository } from '../../../../customers/domain/repositories/customer.repository.interface';
import { StockRepository } from '../../../../stock/domain/repositories/stock.repository.interface';
import { StockProductLookup } from '../../../../stock/domain/repositories/stock-movement.repository.interface';
import { assertSaleOrderReferences } from '../assert-sale-order-references';
import { buildSaleOutboundMovement } from '../build-sale-outbound-movement';
import type { UpdateSaleOrderDto } from '../../dtos/sale-order.dto';

/**
 * Atualiza o pedido substituindo todas as linhas e pagamentos (PUT).
 *
 * Pedidos que já geraram saída no estoque (`stockMovementId`) são
 * imutáveis por aqui — mudança de status pós-fechamento passa por
 * `UpdateSaleOrderStatusUseCase`.
 *
 * Gera o movimento de saída quando o pedido passa a `closed` com linhas de
 * produto controlado — no máximo uma vez.
 */
@Injectable()
export class UpdateSaleOrderUseCase implements IUseCase<
  UpdateSaleOrderDto,
  SaleOrder
> {
  constructor(
    private readonly saleOrderRepository: SaleOrderRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly stockRepository: StockRepository,
    private readonly stockProductLookup: StockProductLookup,
  ) {}

  async execute(input: UpdateSaleOrderDto): Promise<SaleOrder> {
    if (!input.lines.length) throw new SaleOrderEmptyLinesError();

    const detail = await this.saleOrderRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!detail || detail.saleOrder.deletedAt) {
      throw new SaleOrderNotFoundError(input.id);
    }

    if (detail.saleOrder.stockMovementId) {
      throw new SaleOrderAlreadyClosedError(input.id);
    }

    await assertSaleOrderReferences(
      {
        customerRepository: this.customerRepository,
        stockRepository: this.stockRepository,
        stockProductLookup: this.stockProductLookup,
      },
      {
        organizationId: input.organizationId,
        customerId: input.customerId,
        stockId: input.stockId,
        lines: input.lines,
      },
    );

    const updated = detail.saleOrder.update({
      customerId: input.customerId,
      customerName: input.customerName,
      consumerDocument: input.consumerDocument,
      stockId: input.stockId,
      status: input.status,
      channelId: input.channelId,
      sellerId: input.sellerId,
      sellerName: input.sellerName,
      notes: input.notes,
      deliveryFeeCents: input.deliveryFeeCents,
      discountsCents: input.discountsCents,
      lines: input.lines,
      payments: input.payments,
    });

    const movement = await buildSaleOutboundMovement(
      { stockProductLookup: this.stockProductLookup },
      updated,
      input.createdByUserId,
    );

    return this.saleOrderRepository.saveWithOptionalMovement(updated, movement);
  }
}
