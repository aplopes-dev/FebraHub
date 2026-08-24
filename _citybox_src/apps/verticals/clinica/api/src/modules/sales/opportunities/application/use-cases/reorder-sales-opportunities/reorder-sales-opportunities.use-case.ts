import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import { SalesFunnelRepository } from '../../../../funnels/domain/repositories/sales-funnel.repository';
import { SalesOpportunityBudgetTerminalMoveError } from '../../../domain/errors/sales-opportunity-budget-terminal-move.error';
import { SalesOpportunityInvalidStageError } from '../../../domain/errors/sales-opportunity-invalid-stage.error';
import { SalesOpportunityNotFoundError } from '../../../domain/errors/sales-opportunity-not-found.error';
import { SalesOpportunityRepository } from '../../../domain/repositories/sales-opportunity.repository';

export type ReorderSalesOpportunityItem = {
  id: string;
  stageId: string;
  sortOrder: number;
};

export type ReorderSalesOpportunitiesDto = {
  storeId: string;
  items: ReorderSalesOpportunityItem[];
};

@Injectable()
export class ReorderSalesOpportunitiesUseCase implements IUseCase<
  ReorderSalesOpportunitiesDto,
  void
> {
  constructor(
    private readonly repository: SalesOpportunityRepository,
    private readonly funnelRepository: SalesFunnelRepository,
  ) {}

  async execute(dto: ReorderSalesOpportunitiesDto): Promise<void> {
    if (dto.items.length === 0) return;

    const seen = new Set<string>();
    for (const item of dto.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);

      const opportunity = await this.repository.findById(
        dto.storeId,
        item.id,
      );
      if (!opportunity) {
        throw new SalesOpportunityNotFoundError(
          ReorderSalesOpportunitiesUseCase.name,
          item.id,
        );
      }

      if (item.stageId !== opportunity.stageId) {
        const funnel = await this.funnelRepository.findById(
          dto.storeId,
          opportunity.funnelId,
        );
        const stage = funnel?.findStage(item.stageId);
        if (!stage) {
          throw new SalesOpportunityInvalidStageError(
            ReorderSalesOpportunitiesUseCase.name,
            item.stageId,
          );
        }
        if (
          opportunity.budgetId &&
          (stage.type === 'won' || stage.type === 'lost')
        ) {
          throw new SalesOpportunityBudgetTerminalMoveError(
            ReorderSalesOpportunitiesUseCase.name,
            opportunity.id,
          );
        }
      }
    }

    await this.repository.reorder(dto.storeId, dto.items);
  }
}
