import { Body, Controller, ForbiddenException, Param, Post, Req } from '@nestjs/common';
import { InjectService } from '../common/inject.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '../auth/auth.types.js';
import { TenantResolverService } from '../tenancy/tenant-resolver.service.js';
import { OutboxService } from '../outbox/outbox.service.js';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('v1/stores/:storeId/inventory')
export class InventoryController {
  private assertStoreScope(user: AuthUser | undefined, storeId: string) {
    if (user?.kind === 'device' && user.storeId && user.storeId !== storeId) {
      throw new ForbiddenException('Device não autorizado para esta loja');
    }
  }
  constructor(
    @InjectService(TenantResolverService) private readonly tenants: TenantResolverService,
    @InjectService(OutboxService) private readonly outbox: OutboxService,
  ) {}

  @Post('stock')
  async upsertStock(
    @Param('storeId') storeId: string,
    @Body() body: { sku: string; quantity: number },
    @Req() req: Request & { user?: AuthUser },
  ) {
    this.assertStoreScope(req.user, storeId);
    const { client } = await this.tenants.resolve();
    return client.inventoryStock.upsert({
      where: { storeId_sku: { storeId, sku: body.sku } },
      create: { storeId, sku: body.sku, quantity: body.quantity },
      update: { quantity: body.quantity },
    });
  }

  @Post('reserve')
  async reserve(
    @Param('storeId') storeId: string,
    @Body() body: { sku: string; quantity: number },
    @Req() req: Request & { user?: AuthUser },
  ) {
    this.assertStoreScope(req.user, storeId);
    const { client } = await this.tenants.resolve();
    const stock = await client.inventoryStock.findUnique({ where: { storeId_sku: { storeId, sku: body.sku } } });
    if (!stock) throw new BadRequestException('SKU inexistente');
    const available = stock.quantity - stock.reserved;
    if (available < body.quantity) throw new BadRequestException('Estoque insuficiente — oversell bloqueado');

    const [reservation, updated] = await client.$transaction([
      client.inventoryReservation.create({
        data: {
          storeId,
          sku: body.sku,
          quantity: body.quantity,
          expiresAt: new Date(Date.now() + 15 * 60_000),
        },
      }),
      client.inventoryStock.update({
        where: { storeId_sku: { storeId, sku: body.sku } },
        data: { reserved: { increment: body.quantity } },
      }),
    ]);

    await this.outbox.enqueue(client, {
      type: 'citybox.stock.changed.v1',
      data: { storeId, sku: body.sku, reserved: updated.reserved, quantity: updated.quantity },
    });

    return reservation;
  }
}
