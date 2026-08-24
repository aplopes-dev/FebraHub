import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import {
  formatAuditActor,
  type AuthenticatedUser,
} from '../../../../../../shared/infra/http/auth/authenticated-user';

import { SalesFunnelRepository } from '../../../../funnels/domain/repositories/sales-funnel.repository';
import type { SalesOpportunity } from '../../../domain/entities/sales-opportunity.entity';
import { SalesOpportunityHistory } from '../../../domain/entities/sales-opportunity-history.entity';
import { SalesOpportunityBudgetTerminalMoveError } from '../../../domain/errors/sales-opportunity-budget-terminal-move.error';
import { SalesOpportunityFrozenError } from '../../../domain/errors/sales-opportunity-frozen.error';
import { SalesOpportunityInvalidStageError } from '../../../domain/errors/sales-opportunity-invalid-stage.error';
import { SalesOpportunityNotFoundError } from '../../../domain/errors/sales-opportunity-not-found.error';
import { SalesOpportunityRepository } from '../../../domain/repositories/sales-opportunity.repository';

export type MoveSalesOpportunityDto = {
  storeId: string;
  id: string;
  stageId: string;
  /** Posição na coluna de destino (0-based). Default: final da coluna. */
  sortOrder?: number;
  actor: AuthenticatedUser;
};

@Injectable()
export class MoveSalesOpportunityUseCase implements IUseCase<
  MoveSalesOpportunityDto,
  SalesOpportunity
> {
  constructor(
    private readonly repository: SalesOpportunityRepository,
    private readonly funnelRepository: SalesFunnelRepository,
  ) {}

  async execute(dto: MoveSalesOpportunityDto): Promise<SalesOpportunity> {
    const opportunity = await this.repository.findById(dto.storeId, dto.id);
    if (!opportunity) {
      throw new SalesOpportunityNotFoundError(
        MoveSalesOpportunityUseCase.name,
        dto.id,
      );
    }
    if (opportunity.isTerminal) {
      throw new SalesOpportunityFrozenError(
        MoveSalesOpportunityUseCase.name,
        dto.id,
      );
    }

    const funnel = await this.funnelRepository.findById(
      dto.storeId,
      opportunity.funnelId,
    );
    const fromStage = funnel?.findStage(opportunity.stageId);
    const toStage = funnel?.findStage(dto.stageId);
    if (!toStage) {
      throw new SalesOpportunityInvalidStageError(
        MoveSalesOpportunityUseCase.name,
        dto.stageId,
      );
    }

    if (
      opportunity.budgetId &&
      (toStage.type === 'won' || toStage.type === 'lost')
    ) {
      throw new SalesOpportunityBudgetTerminalMoveError(
        MoveSalesOpportunityUseCase.name,
        opportunity.id,
      );
    }

    const sortOrder =
      dto.sortOrder ??
      (await this.repository.nextSortOrder(dto.storeId, dto.stageId));

    const updated = opportunity.withUpdate({
      stageId: dto.stageId,
      sortOrder,
      stageType: toStage.type,
    });

    const history = SalesOpportunityHistory.create({
      storeId: dto.storeId,
      opportunityId: opportunity.id,
      actionType: 'moved',
      userId: dto.actor.sub,
      userName: formatAuditActor(dto.actor),
      isSystemAction: false,
      metadata: {
        fromColumn: fromStage?.name ?? opportunity.stageId,
        toColumn: toStage.name,
      },
    });

    return this.repository.save(updated, [history]);
  }
}
