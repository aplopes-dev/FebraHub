import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectService } from '../common/inject.js';
import { TenantResolverService } from '../tenancy/tenant-resolver.service.js';
import type { CreateCheckoutDto } from './dto/create-checkout.dto.js';
import {
  allocateSubOrderAmounts,
  buildMultistoreChargeMetadata,
  buildMultistoreExternalReference,
  buildMultistoreSplitRules,
} from './multistore-checkout.util.js';
import { PaymentApiClient } from './payment-api.client.js';
import type { PaymentChargeItem, PaymentChargeResponse } from './payment-api.types.js';
import { PaymentMerchantResolver } from './payment-merchant.resolver.js';

type OrderItemRow = {
  sku: string;
  name: string;
  quantity: number;
  price: { toNumber(): number } | number | string;
};

type SubOrderRow = {
  id: string;
  storeId: string;
};

type OrderWithRelations = {
  id: string;
  total: { toNumber(): number } | number | string;
  items: OrderItemRow[];
  subOrders: SubOrderRow[];
};

export type CheckoutChargeResult = {
  subOrderId: string;
  storeId: string;
  externalReference: string;
  charge: PaymentChargeResponse;
};

export type CheckoutResult = {
  orderId: string;
  charges: CheckoutChargeResult[];
};

@Injectable()
export class CheckoutService {
  constructor(
    @InjectService(TenantResolverService) private readonly tenants: TenantResolverService,
    @InjectService(PaymentApiClient) private readonly paymentApi: PaymentApiClient,
    @InjectService(PaymentMerchantResolver) private readonly merchants: PaymentMerchantResolver,
  ) {}

  async createCheckout(
    orderId: string,
    dto: CreateCheckoutDto,
    correlationId?: string,
  ): Promise<CheckoutResult> {
    if (!this.paymentApi.isConfigured() || !this.merchants.isConfigured()) {
      throw new ServiceUnavailableException(
        'Checkout de pagamento indisponível: configure PAYMENT_API_KEY e mapeamento de merchant (PAYMENTS_DEFAULT_MERCHANT_ID ou PAYMENTS_STORE_MERCHANT_MAP)',
      );
    }

    const { client } = await this.tenants.resolve();
    const order = await client.order.findUnique({
      where: { id: orderId },
      include: { items: true, subOrders: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    const orderRow = order as OrderWithRelations;
    if (orderRow.subOrders.length === 0) {
      throw new BadRequestException('Pedido sem subpedidos — impossível iniciar checkout multiloja');
    }

    const total = toMoney(orderRow.total);
    const amounts = allocateSubOrderAmounts(total, orderRow.subOrders.length);
    const storeSharePercent = this.merchants.defaultStoreSharePercent(dto.storeSharePercent);
    const chargeItems = orderRow.subOrders.length === 1 ? mapOrderItems(orderRow.items) : undefined;
    const description =
      dto.description?.trim() ?? `Pedido ${orderId.slice(0, 8)} — Citybox City`;

    const charges = await Promise.all(
      orderRow.subOrders.map(async (subOrder, index) => {
        const amount = amounts[index];
        const merchantId = this.merchants.resolveMerchantId(subOrder.storeId);
        const externalReference = buildMultistoreExternalReference(orderId, subOrder.storeId);

        const charge = await this.paymentApi.createCharge(
          {
            sourceSystem: 'core-api',
            externalReference,
            merchantId,
            amount,
            paymentMethods: dto.paymentMethods,
            customer: dto.customer,
            description,
            provider: dto.provider,
            routingStrategy: dto.routingStrategy,
            items: chargeItems,
            metadata: buildMultistoreChargeMetadata(
              orderId,
              subOrder.storeId,
            ),
            splitRules: buildMultistoreSplitRules({
              storeMerchantId: merchantId,
              storeSharePercent,
            }),
          },
          {
            idempotencyKey: `checkout:${orderId}:${subOrder.storeId}`,
            correlationId,
          },
        );

        return {
          subOrderId: subOrder.id,
          storeId: subOrder.storeId,
          externalReference,
          charge,
        };
      }),
    );

    return { orderId, charges };
  }
}

function toMoney(value: OrderWithRelations['total']): number {
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber(): number }).toNumber();
  }
  return Number(value);
}

function mapOrderItems(items: OrderItemRow[]): PaymentChargeItem[] {
  return items.map((item) => {
    const unitValue = toMoney(item.price);
    return {
      externalItemId: item.sku,
      description: item.name,
      quantity: item.quantity,
      unitValue,
      totalValue: roundMoney(unitValue * item.quantity),
    };
  });
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
