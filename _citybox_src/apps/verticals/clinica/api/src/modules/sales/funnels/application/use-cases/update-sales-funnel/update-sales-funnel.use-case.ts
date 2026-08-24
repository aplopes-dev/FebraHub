import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import type {
  CreateStageInput,
  SalesFunnel,
  SalesFunnelStageProps,
} from '../../../domain/entities/sales-funnel.entity';
import { SalesFunnelNotFoundError } from '../../../domain/errors/sales-funnel-not-found.error';
import { SalesFunnelStageHasOpportunitiesError } from '../../../domain/errors/sales-funnel-stage-has-opportunities.error';
import { SalesFunnelRepository } from '../../../domain/repositories/sales-funnel.repository';

export type UpdateSalesFunnelDto = {
  storeId: string;
  id: string;
  name?: string;
  stages?: CreateStageInput[];
};

@Injectable()
export class UpdateSalesFunnelUseCase implements IUseCase<
  UpdateSalesFunnelDto,
  SalesFunnel
> {
  constructor(private readonly repository: SalesFunnelRepository) {}

  async execute(dto: UpdateSalesFunnelDto): Promise<SalesFunnel> {
    const funnel = await this.repository.findById(dto.storeId, dto.id);
    if (!funnel) {
      throw new SalesFunnelNotFoundError(UpdateSalesFunnelUseCase.name, dto.id);
    }

    let next = funnel;
    if (dto.name !== undefined) {
      next = next.withName(dto.name.trim());
    }

    let stageIdsToDelete: string[] = [];
    if (dto.stages) {
      const now = new Date();
      const existingById = new Map(funnel.stages.map((s) => [s.id, s]));
      const incomingIds = new Set(
        dto.stages.filter((s) => s.id).map((s) => s.id as string),
      );

      stageIdsToDelete = funnel.stages
        .filter((s) => !incomingIds.has(s.id))
        .map((s) => s.id);

      for (const stageId of stageIdsToDelete) {
        const count = await this.repository.countOpportunitiesByStage(
          dto.storeId,
          stageId,
        );
        if (count > 0) {
          throw new SalesFunnelStageHasOpportunitiesError(
            UpdateSalesFunnelUseCase.name,
            stageId,
          );
        }
      }

      const stages: SalesFunnelStageProps[] = dto.stages.map((stage) => {
        const existing = stage.id ? existingById.get(stage.id) : undefined;
        const type = stage.type;
        const order =
          type === 'won' ? 998 : type === 'lost' ? 999 : stage.order;
        return {
          id: stage.id ?? randomUUID(),
          storeId: dto.storeId,
          funnelId: funnel.id,
          name: stage.name.trim(),
          type,
          color: stage.color.trim().toUpperCase(),
          order,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
      });

      next = next.withStages(stages);
    }

    return this.repository.save(next, { stageIdsToDelete });
  }
}
