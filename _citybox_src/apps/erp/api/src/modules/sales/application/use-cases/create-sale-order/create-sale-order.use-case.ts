import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { SaleOrder } from '../../../domain/entities/sale-order.entity';
import { SaleOrderEmptyLinesError } from '../../../domain/errors/sale-order-empty-lines.error';
import { SaleOrderRepository } from '../../../domain/repositories/sale-order.repository.interface';
import { CustomerRepository } from '../../../../customers/domain/repositories/customer.repository.interface';
import { StockRepository } from '../../../../stock/domain/repositories/stock.repository.interface';
import { StockProductLookup } from '../../../../stock/domain/repositories/stock-movement.repository.interface';
import { assertSaleOrderReferences } from '../assert-sale-order-references';
import { buildSaleOutboundMovement } from '../build-sale-outbound-movement';
import type { CreateSaleOrderDto } from '../../dtos/sale-order.dto';

@Injectable()
export class CreateSaleOrderUseCase implements IUseCase<
  CreateSaleOrderDto,
  SaleOrder
> {
  constructor(
    private readonly saleOrderRepository: SaleOrderRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly stockRepository: StockRepository,
    private readonly stockProductLookup: StockProductLookup,
  ) {}

  async execute(input: CreateSaleOrderDto): Promise<SaleOrder> {
    if (!input.lines.length) throw new SaleOrderEmptyLinesError();

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

    const number = await this.saleOrderRepository.nextNumber(
      input.organizationId,
    );

    const saleOrder = SaleOrder.create({
      organizationId: input.organizationId,
      number,
      customerId: input.customerId,
      customerName: input.customerName,
      consumerDocument: input.consumerDocument,
      stockId: input.stockId,
      status: input.status,
      channelId: input.channelId,
      sellerId: input.sellerId,
      sellerName: input.sellerName,
      createdByName: input.createdByName,
      notes: input.notes,
      deliveryFeeCents: input.deliveryFeeCents,
      discountsCents: input.discountsCents,
      lines: input.lines,
      payments: input.payments,
    });

    const movement = await buildSaleOutboundMovement(
      { stockProductLookup: this.stockProductLookup },
      saleOrder,
      input.createdByUserId,
    );

    return this.saleOrderRepository.saveWithOptionalMovement(
      saleOrder,
      movement,
      input.posMeta,
    );
  }
}
