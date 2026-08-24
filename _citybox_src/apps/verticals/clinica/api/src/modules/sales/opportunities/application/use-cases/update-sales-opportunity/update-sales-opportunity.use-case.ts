import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import {
  formatAuditActor,
  type AuthenticatedUser,
} from '../../../../../../shared/infra/http/auth/authenticated-user';

import { SalesFunnelRepository } from '../../../../funnels/domain/repositories/sales-funnel.repository';
import { SalesLabelNotFoundError } from '../../../../labels/domain/errors/sales-label-not-found.error';
import { SalesLabelRepository } from '../../../../labels/domain/repositories/sales-label.repository';
import type { SalesOpportunity } from '../../../domain/entities/sales-opportunity.entity';
import { SalesOpportunityHistory } from '../../../domain/entities/sales-opportunity-history.entity';
import { SalesOpportunityBudgetTerminalMoveError } from '../../../domain/errors/sales-opportunity-budget-terminal-move.error';
import { SalesOpportunityFrozenError } from '../../../domain/errors/sales-opportunity-frozen.error';
import { SalesOpportunityInvalidStageError } from '../../../domain/errors/sales-opportunity-invalid-stage.error';
import { SalesOpportunityNotFoundError } from '../../../domain/errors/sales-opportunity-not-found.error';
import { SalesOpportunityRepository } from '../../../domain/repositories/sales-opportunity.repository';
import type { SalesOpportunityOrigin } from '../../../domain/sales-opportunity.types';

export type UpdateSalesOpportunityDto = {
  storeId: string;
  id: string;
  title?: string;
  description?: string | null;
  phone?: string | null;
  origin?: SalesOpportunityOrigin | null;
  nextContact?: Date | null;
  patientId?: string | null;
  labelId?: string | null;
  stageId?: string;
  actor: AuthenticatedUser;
};

@Injectable()
export class UpdateSalesOpportunityUseCase implements IUseCase<
  UpdateSalesOpportunityDto,
  SalesOpportunity
> {
  constructor(
    private readonly repository: SalesOpportunityRepository,
    private readonly funnelRepository: SalesFunnelRepository,
    private readonly labelRepository: SalesLabelRepository,
  ) {}

  async execute(dto: UpdateSalesOpportunityDto): Promise<SalesOpportunity> {
    const opportunity = await this.repository.findById(dto.storeId, dto.id);
    if (!opportunity) {
      throw new SalesOpportunityNotFoundError(
        UpdateSalesOpportunityUseCase.name,
        dto.id,
      );
    }
    if (opportunity.isTerminal) {
      throw new SalesOpportunityFrozenError(
        UpdateSalesOpportunityUseCase.name,
        dto.id,
      );
    }

    if (dto.labelId) {
      const label = await this.labelRepository.findById(
        dto.storeId,
        dto.labelId,
      );
      if (!label) {
        throw new SalesLabelNotFoundError(
          UpdateSalesOpportunityUseCase.name,
          dto.labelId,
        );
      }
    }

    let stageType = opportunity.stageType;
    if (dto.stageId && dto.stageId !== opportunity.stageId) {
      const funnel = await this.funnelRepository.findById(
        dto.storeId,
        opportunity.funnelId,
      );
      const stage = funnel?.findStage(dto.stageId);
      if (!stage) {
        throw new SalesOpportunityInvalidStageError(
          UpdateSalesOpportunityUseCase.name,
          dto.stageId,
        );
      }
      if (
        opportunity.budgetId &&
        (stage.type === 'won' || stage.type === 'lost')
      ) {
        throw new SalesOpportunityBudgetTerminalMoveError(
          UpdateSalesOpportunityUseCase.name,
          opportunity.id,
        );
      }
      stageType = stage.type;
    }

    const historyEntries: SalesOpportunityHistory[] = [];
    const actorName = formatAuditActor(dto.actor);

    // `undefined` = campo omitido (não alterar). `null` = limpar rótulo.
    // Não usar `'labelId' in dto`: a rota sempre monta o objeto com a chave.
    if (dto.labelId !== undefined && dto.labelId !== opportunity.labelId) {
      const fromLabel = opportunity.labelId
        ? (
            await this.labelRepository.findById(
              dto.storeId,
              opportunity.labelId,
            )
          )?.name
        : undefined;
      const toLabel = dto.labelId
        ? (await this.labelRepository.findById(dto.storeId, dto.labelId))?.name
        : undefined;
      historyEntries.push(
        SalesOpportunityHistory.create({
          storeId: dto.storeId,
          opportunityId: opportunity.id,
          actionType: 'label_changed',
          userId: dto.actor.sub,
          userName: actorName,
          isSystemAction: false,
          metadata: { fromLabel, toLabel },
        }),
      );
    }

    const changedFields: Array<{
      field: string;
      oldValue: unknown;
      newValue: unknown;
    }> = [];
    const scalarChecks: Array<{
      field: string;
      next: unknown;
      prev: unknown;
      present: boolean;
    }> = [
      {
        field: 'title',
        present: dto.title !== undefined,
        next: dto.title?.trim(),
        prev: opportunity.title,
      },
      {
        field: 'description',
        present: dto.description !== undefined,
        next: dto.description,
        prev: opportunity.description,
      },
      {
        field: 'phone',
        present: dto.phone !== undefined,
        next: dto.phone,
        prev: opportunity.phone,
      },
      {
        field: 'origin',
        present: dto.origin !== undefined,
        next: dto.origin,
        prev: opportunity.origin,
      },
      {
        field: 'nextContact',
        present: dto.nextContact !== undefined,
        next: dto.nextContact,
        prev: opportunity.nextContact,
      },
      {
        field: 'patientId',
        present: dto.patientId !== undefined,
        next: dto.patientId,
        prev: opportunity.patientId,
      },
      {
        field: 'stageId',
        present: dto.stageId !== undefined,
        next: dto.stageId,
        prev: opportunity.stageId,
      },
    ];

    for (const check of scalarChecks) {
      if (check.present && check.next !== check.prev) {
        changedFields.push({
          field: check.field,
          oldValue: check.prev,
          newValue: check.next,
        });
      }
    }

    if (changedFields.length > 0) {
      historyEntries.push(
        SalesOpportunityHistory.create({
          storeId: dto.storeId,
          opportunityId: opportunity.id,
          actionType: 'updated',
          userId: dto.actor.sub,
          userName: actorName,
          isSystemAction: false,
          metadata: { changedFields },
        }),
      );
    }

    const updated = opportunity.withUpdate({
      title: dto.title?.trim(),
      description: dto.description,
      phone: dto.phone,
      origin: dto.origin,
      nextContact: dto.nextContact,
      patientId: dto.patientId,
      labelId: dto.labelId,
      stageId: dto.stageId,
      stageType,
    });

    return this.repository.save(updated, historyEntries);
  }
}
