import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectService } from '../common/inject.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TenantResolverService } from '../tenancy/tenant-resolver.service.js';
import { OutboxService } from '../outbox/outbox.service.js';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('v1/orders')
export class OrdersController {
  constructor(
    @InjectService(TenantResolverService) private readonly tenants: TenantResolverService,
    @InjectService(OutboxService) private readonly outbox: OutboxService,
  ) {}

  @Post()
  async create(
    @Body() body: { storeId: string; items: { sku: string; name: string; quantity: number; price: number }[] },
  ) {
    const { client } = await this.tenants.resolve();
    const total = body.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const order = await client.order.create({
      data: {
        storeId: body.storeId,
        total,
        items: { create: body.items },
        subOrders: { create: [{ storeId: body.storeId, status: 'PENDING' }] },
      },
      include: { items: true, subOrders: true },
    });
    await this.outbox.enqueue(client, {
      type: 'citybox.order.created.v1',
      storeId: body.storeId,
      data: { orderId: order.id, storeId: body.storeId, total },
    });
    await this.outbox.enqueue(client, {
      type: 'citybox.print.requested.v1',
      storeId: body.storeId,
      data: { orderId: order.id, storeId: body.storeId, kind: 'kitchen' },
    });
    return order;
  }

  @Get(':orderId')
  async get(@Param('orderId') orderId: string) {
    const { client } = await this.tenants.resolve();
    return client.order.findUnique({ where: { id: orderId }, include: { items: true, subOrders: true } });
  }
}
