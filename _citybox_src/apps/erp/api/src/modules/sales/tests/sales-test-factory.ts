import { ORGANIZATION_ID } from '../../tenancy/tests/tenancy-test-factory';
import {
  SaleOrder,
  type CreateSaleOrderProps,
} from '../domain/entities/sale-order.entity';
import { InMemoryStockMovementRepository } from '../../stock/tests/in-memory-stock-movement.repository';
import { InMemorySaleOrderRepository } from './in-memory-sale-order.repository';

export { ORGANIZATION_ID };

export const SALE_ORDER_ID = 'f1111111-1111-4111-8111-111111111111';

type SaleOrderOverrides = Partial<CreateSaleOrderProps> & { id?: string };

export function makeSaleOrder(overrides: SaleOrderOverrides = {}): SaleOrder {
  return SaleOrder.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      number: overrides.number ?? 1,
      customerId: overrides.customerId ?? null,
      customerName: overrides.customerName ?? 'Cliente Balcão',
      stockId: overrides.stockId ?? null,
      status: overrides.status ?? 'open',
      channelId: overrides.channelId ?? 'pdv',
      sellerId: overrides.sellerId ?? null,
      sellerName: overrides.sellerName ?? '',
      createdByName: overrides.createdByName ?? 'Operador Teste',
      notes: overrides.notes ?? '',
      deliveryFeeCents: overrides.deliveryFeeCents ?? 0,
      discountsCents: overrides.discountsCents ?? 0,
      lines: overrides.lines ?? [
        {
          productId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          quantity: '1',
          unitPriceCents: 1000,
        },
      ],
      payments: overrides.payments ?? [],
    },
    overrides.id ?? SALE_ORDER_ID,
  );
}

export function makeSaleOrderRepositories() {
  const stockMovementRepository = new InMemoryStockMovementRepository();
  const saleOrderRepository = new InMemorySaleOrderRepository(
    stockMovementRepository,
  );

  return { saleOrderRepository, stockMovementRepository };
}
