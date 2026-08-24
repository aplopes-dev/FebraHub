import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import {
  SalesFunnel,
  type CreateStageInput,
} from '../../../domain/entities/sales-funnel.entity';
import { SalesFunnelRepository } from '../../../domain/repositories/sales-funnel.repository';
import { buildDefaultStages } from '../../../domain/sales-funnel.types';

export type CreateSalesFunnelDto = {
  storeId: string;
  name: string;
  stages?: CreateStageInput[];
  isDefault?: boolean;
};

@Injectable()
export class CreateSalesFunnelUseCase implements IUseCase<
  CreateSalesFunnelDto,
  SalesFunnel
> {
  constructor(private readonly repository: SalesFunnelRepository) {}

  async execute(dto: CreateSalesFunnelDto): Promise<SalesFunnel> {
    const funnelId = randomUUID();
    const now = new Date();

    const stages = dto.stages
      ? dto.stages.map((stage) => ({
          id: stage.id ?? randomUUID(),
          storeId: dto.storeId,
          funnelId,
          name: stage.name.trim(),
          type: stage.type,
          color: stage.color.trim().toUpperCase(),
          order:
            stage.type === 'won'
              ? 998
              : stage.type === 'lost'
                ? 999
                : stage.order,
          createdAt: now,
          updatedAt: now,
        }))
      : buildDefaultStages(dto.storeId, funnelId).map((stage) => ({
          ...stage,
          id: randomUUID(),
        }));

    const funnel = SalesFunnel.create(
      {
        storeId: dto.storeId,
        name: dto.name.trim(),
        isDefault: dto.isDefault ?? false,
        stages,
      },
      funnelId,
    );

    return this.repository.create(funnel);
  }
}
