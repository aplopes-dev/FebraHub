import { Body, Controller, Post, Req, UnauthorizedException } from '@nestjs/common';
import { InjectService } from '../common/inject.js';
import { RequirePermission } from '../common/permissions.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthUser } from '../auth/auth.types.js';
import { TenantResolverService } from '../tenancy/tenant-resolver.service.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { StoreAccessService } from '../users/store-access.service.js';

type CatalogDto = {
  storeId: string;
  name: string;
  type: 'FOOD' | 'RETAIL' | 'SERVICE' | 'CLINIC';
  published?: boolean;
  meta?: Record<string, unknown>;
};

@ApiTags('catalog')
@ApiBearerAuth()
@Controller('v1/catalog')
export class CatalogController {
  constructor(
    @InjectService(TenantResolverService) private readonly tenants: TenantResolverService,
    @InjectService(OutboxService) private readonly outbox: OutboxService,
    @InjectService(StoreAccessService) private readonly storeAccess: StoreAccessService,
  ) {}

  @Post('items')
  @RequirePermission('store.catalog.manage')
  async create(
    @Body() body: CatalogDto,
    @Req() req: Request & { user?: AuthUser },
  ) {
    const user = req.user;
    if (!user) throw new UnauthorizedException('Usuário não autenticado');
    await this.storeAccess.assertUserCanAccessStore(user, body.storeId);

    const { client } = await this.tenants.resolve();
    const base = { storeId: body.storeId, name: body.name, type: body.type, published: body.published ?? false };
    const price = body.meta?.price != null ? Number(body.meta.price) : null;
    let item;
    if (body.type === 'FOOD') {
      item = await client.catalogItem.create({ data: { ...base, food: { create: { calories: Number(body.meta?.calories ?? 0) } } }, include: { food: true } });
    } else if (body.type === 'RETAIL') {
      item = await client.catalogItem.create({ data: { ...base, retail: { create: { sku: String(body.meta?.sku ?? 'SKU') } } }, include: { retail: true } });
    } else if (body.type === 'SERVICE') {
      const vertical = String(body.meta?.vertical ?? 'services');
      const durationMin = Number(body.meta?.durationMin ?? 30);
      if (vertical === 'beauty') {
        item = await client.catalogItem.create({
          data: { ...base, beauty: { create: { durationMin } } },
          include: { beauty: true },
        });
      } else {
        item = await client.catalogItem.create({
          data: { ...base, services: { create: { durationMin } } },
          include: { services: true },
        });
      }
    } else {
      item = await client.catalogItem.create({
        data: { ...base, clinic: { create: { procedureCode: String(body.meta?.procedureCode ?? 'PROC') } } },
        include: { clinic: true },
      });
    }

    await this.outbox.enqueue(client, {
      type: 'citybox.catalog.item.updated.v1',
      storeId: body.storeId,
      data: { itemId: item.id, storeId: body.storeId, name: body.name, type: body.type, price, published: item.published },
    });
    if (item.published) {
      await this.outbox.enqueue(client, {
        type: 'citybox.offer.published.v1',
        storeId: body.storeId,
        data: { itemId: item.id, storeId: body.storeId, name: body.name, type: body.type, price, published: true },
      });
    }
    return item;
  }
}
