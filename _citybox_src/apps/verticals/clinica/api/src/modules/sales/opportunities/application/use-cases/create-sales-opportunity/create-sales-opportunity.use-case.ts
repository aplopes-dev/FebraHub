import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { formatAuditActor } from '../../../../../../shared/infra/http/auth/authenticated-user';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';

import { SalesFunnelNotFoundError } from '../../../../funnels/domain/errors/sales-funnel-not-found.error';
import { SalesFunnelRepository } from '../../../../funnels/domain/repositories/sales-funnel.repository';
import { SalesLabelNotFoundError } from '../../../../labels/domain/errors/sales-label-not-found.error';
import { SalesLabelRepository } from '../../../../labels/domain/repositories/sales-label.repository';
import { SalesOpportunity } from '../../../domain/entities/sales-opportunity.entity';
import { SalesOpportunityHistory } from '../../../domain/entities/sales-opportunity-history.entity';
import { SalesOpportunityInvalidStageError } from '../../../domain/errors/sales-opportunity-invalid-stage.error';
import { SalesOpportunityRepository } from '../../../domain/repositories/sales-opportunity.repository';
import type { SalesOpportunityOrigin } from '../../../domain/sales-opportunity.types';

export type CreateSalesOpportunityDto = {
  storeId: string;
  funnelId: string;
  stageId: string;
  title: string;
  description?: string;
  phone?: string;
  origin?: SalesOpportunityOrigin;
  nextContact?: Date;
  patientId?: string;
  labelId?: string;
  submissionId?: string;
  budgetId?: string;
  /** Usuário autenticado (backoffice). Omitir com `asSystem` para origem automática. */
  actor?: AuthenticatedUser;
  asSystem?: boolean;
  systemName?: string;
};

@Injectable()
export class CreateSalesOpportunityUseCase implements IUseCase<
  CreateSalesOpportunityDto,
  SalesOpportunity
> {
  constructor(
    private readonly repository: SalesOpportunityRepository,
    private readonly funnelRepository: SalesFunnelRepository,
    private readonly labelRepository: SalesLabelRepository,
  ) {}

  async execute(dto: CreateSalesOpportunityDto): Promise<SalesOpportunity> {
    const funnel = await this.funnelRepository.findById(
      dto.storeId,
      dto.funnelId,
    );
    if (!funnel) {
      throw new SalesFunnelNotFoundError(
        CreateSalesOpportunityUseCase.name,
        dto.funnelId,
      );
    }

    const stage = funnel.findStage(dto.stageId);
    if (!stage) {
      throw new SalesOpportunityInvalidStageError(
        CreateSalesOpportunityUseCase.name,
        dto.stageId,
      );
    }

    if (dto.labelId) {
      const label = await this.labelRepository.findById(
        dto.storeId,
        dto.labelId,
      );
      if (!label) {
        throw new SalesLabelNotFoundError(
          CreateSalesOpportunityUseCase.name,
          dto.labelId,
        );
      }
    }

    const opportunity = SalesOpportunity.create({
      storeId: dto.storeId,
      funnelId: dto.funnelId,
      stageId: dto.stageId,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      phone: dto.phone ?? null,
      origin: dto.origin ?? null,
      nextContact: dto.nextContact ?? null,
      patientId: dto.patientId ?? null,
      labelId: dto.labelId ?? null,
      submissionId: dto.submissionId ?? null,
      budgetId: dto.budgetId ?? null,
      sortOrder: await this.repository.nextSortOrder(dto.storeId, dto.stageId),
      stageType: stage.type,
    });

    const asSystem = dto.asSystem === true;
    if (!asSystem && !dto.actor) {
      throw new ValidatorDomainError({
        internalMessage: 'actor is required when asSystem is false',
        externalMessage: 'Usuário autenticado é obrigatório',
        context: CreateSalesOpportunityUseCase.name,
      });
    }

    const history = SalesOpportunityHistory.create({
      storeId: dto.storeId,
      opportunityId: opportunity.id,
      actionType: 'created',
      userId: asSystem ? null : dto.actor!.sub,
      userName: asSystem ? null : formatAuditActor(dto.actor!),
      isSystemAction: asSystem,
      systemName: asSystem ? (dto.systemName ?? 'Campanha') : null,
      metadata: asSystem
        ? {
            origin: dto.origin ?? 'campaign',
            submissionId: dto.submissionId ?? null,
            budgetId: dto.budgetId ?? null,
          }
        : null,
    });

    return this.repository.create(opportunity, history);
  }
}
