import { Body, Controller, Param, Post } from '@nestjs/common';
import { InjectService } from '../common/inject.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TenantResolverService } from '../tenancy/tenant-resolver.service.js';

@ApiTags('shipping')
@ApiBearerAuth()
@Controller('v1/stores/:storeId/shipping')
export class ShippingController {
  constructor(@InjectService(TenantResolverService) private readonly tenants: TenantResolverService) {}

  @Post('rules')
  async upsertRule(
    @Param('storeId') storeId: string,
    @Body() body: { mode: 'RADIUS' | 'NEIGHBORHOOD' | 'TABLE'; config: Record<string, unknown> },
  ) {
    const { client } = await this.tenants.resolve();
    return client.shippingRule.create({
      data: { storeId, mode: body.mode, config: body.config as object },
    });
  }

  @Post('quote')
  async quote(
    @Param('storeId') storeId: string,
    @Body() body: { neighborhood?: string; distanceKm?: number; weightKg?: number },
  ) {
    const { client } = await this.tenants.resolve();
    const rules = await client.shippingRule.findMany({ where: { storeId, active: true } });
    const quotes = rules.map((r) => {
      const cfg = r.config as Record<string, unknown>;
      if (r.mode === 'RADIUS') {
        const base = Number(cfg.baseFee ?? 5);
        const perKm = Number(cfg.perKm ?? 2);
        return { mode: r.mode, fee: base + (body.distanceKm ?? 0) * perKm };
      }
      if (r.mode === 'NEIGHBORHOOD') {
        const table = (cfg.neighborhoods as Record<string, number> | undefined) ?? {};
        return { mode: r.mode, fee: table[body.neighborhood ?? ''] ?? Number(cfg.defaultFee ?? 10) };
      }
      const tiers = (cfg.tiers as { maxKg: number; fee: number }[] | undefined) ?? [];
      const fee = tiers.find((t) => (body.weightKg ?? 0) <= t.maxKg)?.fee ?? Number(cfg.defaultFee ?? 15);
      return { mode: r.mode, fee };
    });
    return { storeId, quotes };
  }
}
