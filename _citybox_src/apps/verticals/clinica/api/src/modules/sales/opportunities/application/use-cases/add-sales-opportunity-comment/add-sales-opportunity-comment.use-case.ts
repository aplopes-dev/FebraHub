import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import {
  formatAuditActor,
  type AuthenticatedUser,
} from '../../../../../../shared/infra/http/auth/authenticated-user';

import { SalesOpportunityHistory } from '../../../domain/entities/sales-opportunity-history.entity';
import { SalesOpportunityNotFoundError } from '../../../domain/errors/sales-opportunity-not-found.error';
import { SalesOpportunityRepository } from '../../../domain/repositories/sales-opportunity.repository';

export type AddSalesOpportunityCommentDto = {
  storeId: string;
  opportunityId: string;
  content: string;
  actor: AuthenticatedUser;
};

@Injectable()
export class AddSalesOpportunityCommentUseCase implements IUseCase<
  AddSalesOpportunityCommentDto,
  SalesOpportunityHistory
> {
  constructor(private readonly repository: SalesOpportunityRepository) {}

  async execute(
    dto: AddSalesOpportunityCommentDto,
  ): Promise<SalesOpportunityHistory> {
    const opportunity = await this.repository.findById(
      dto.storeId,
      dto.opportunityId,
    );
    if (!opportunity) {
      throw new SalesOpportunityNotFoundError(
        AddSalesOpportunityCommentUseCase.name,
        dto.opportunityId,
      );
    }

    const entry = SalesOpportunityHistory.create({
      storeId: dto.storeId,
      opportunityId: dto.opportunityId,
      actionType: 'comment',
      userId: dto.actor.sub,
      userName: formatAuditActor(dto.actor),
      content: dto.content.trim(),
      isSystemAction: false,
    });

    return this.repository.addHistory(entry);
  }
}
