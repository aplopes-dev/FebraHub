import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import { SalesFunnel } from '../../../domain/entities/sales-funnel.entity';
import { SalesFunnelRepository } from '../../../domain/repositories/sales-funnel.repository';
import { buildDefaultStages } from '../../../domain/sales-funnel.types';

export type EnsureDefaultSalesFunnelsDto = {
  storeId: string;
};

export type EnsureDefaultSalesFunnelsResult = {
  created: boolean;
  funnels: Array<{ id: string; name: string; isDefault: boolean }>;
};

@Injectable()
export class EnsureDefaultSalesFunnelsUseCase implements IUseCase<
  EnsureDefaultSalesFunnelsDto,
  EnsureDefaultSalesFunnelsResult
> {
  constructor(private readonly repository: SalesFunnelRepository) {}

  async execute(
    dto: EnsureDefaultSalesFunnelsDto,
  ): Promise<EnsureDefaultSalesFunnelsResult> {
    const existingCount = await this.repository.countDefaults(dto.storeId);
    if (existingCount > 0) {
      const funnels = await this.repository.listDefaults(dto.storeId);
      return { created: false, funnels };
    }

    const now = new Date();
    const defs: Array<{ name: string; wonName: string }> = [
      { name: 'Funil de Agendamento', wonName: 'Agendada' },
      { name: 'Funil de Venda', wonName: 'Ganha' },
    ];

    const funnels = defs.map((def) => {
      const funnelId = randomUUID();
      return SalesFunnel.create(
        {
          storeId: dto.storeId,
          name: def.name,
          isDefault: true,
          stages: buildDefaultStages(
            dto.storeId,
            funnelId,
            def.wonName,
            now,
          ).map((stage) => ({ ...stage, id: randomUUID() })),
          createdAt: now,
          updatedAt: now,
        },
        funnelId,
      );
    });

    // Re-check inside createMany transaction path to shrink race window
    const stillEmpty = (await this.repository.countDefaults(dto.storeId)) === 0;
    if (!stillEmpty) {
      const existing = await this.repository.listDefaults(dto.storeId);
      return { created: false, funnels: existing };
    }

    const created = await this.repository.createMany(funnels);
    return {
      created: true,
      funnels: created.map((f) => ({
        id: f.id,
        name: f.name,
        isDefault: f.isDefault,
      })),
    };
  }
}
