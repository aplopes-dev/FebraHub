import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PropertyRepository } from '../../../../properties/domain/repositories/property.repository.interface';
import { LeadRepository } from '../../../../leads/domain/repositories/lead.repository.interface';
import { TransactionRepository } from '../../../../transactions/domain/repositories/transaction.repository.interface';
import { applyDealAwaitingPropertySideEffects } from '../../policies/deal-awaiting-property.side-effects';
import { applyDealHandoverSideEffects } from '../../policies/deal-handover.side-effects';
import { applyDealPropertyAvailabilitySideEffects } from '../../policies/deal-property-availability.side-effects';
import type {
  DealEntity,
  DealStage,
} from '../../../domain/entities/deal.entity';
import { DealNotActiveError } from '../../../domain/errors/deal-not-active.error';
import { DealNotFoundError } from '../../../domain/errors/deal-not-found.error';
import { DealRepository } from '../../../domain/repositories/deal.repository.interface';
import {
  assertDealStageTransition,
  resolveStatusAfterStage,
} from '../../policies/deal-stage.policy';

export type UpdateDealStageInput = {
  storeId: string;
  id: string;
  stage: DealStage;
};

@Injectable()
export class UpdateDealStageUseCase implements IUseCase<
  UpdateDealStageInput,
  DealEntity
> {
  constructor(
    private readonly deals: DealRepository,
    private readonly transactions: TransactionRepository,
    private readonly properties: PropertyRepository,
    private readonly leads: LeadRepository,
  ) {}

  async execute(input: UpdateDealStageInput): Promise<DealEntity> {
    const existing = await this.deals.findById(input.storeId, input.id);
    if (!existing) throw new DealNotFoundError(input.id);
    if (existing.status !== 'active') throw new DealNotActiveError(input.id);

    assertDealStageTransition(existing, input.stage);

    const status = resolveStatusAfterStage(input.stage);

    const updated = await this.deals.updateStage(input.storeId, input.id, {
      stage: input.stage,
      status,
    });
    if (!updated) throw new DealNotFoundError(input.id);

    if (input.stage === 'awaiting_property') {
      return applyDealAwaitingPropertySideEffects(input.storeId, updated, {
        deals: this.deals,
        leads: this.leads,
        transactions: this.transactions,
        properties: this.properties,
      });
    }

    if (input.stage === 'handover') {
      await applyDealHandoverSideEffects(input.storeId, updated, {
        transactions: this.transactions,
        properties: this.properties,
        leads: this.leads,
        deals: this.deals,
      });
      return updated;
    }

    await applyDealPropertyAvailabilitySideEffects(
      input.storeId,
      {
        previousPropertyId: existing.propertyId,
        nextPropertyId: updated.propertyId,
        nextStage: input.stage,
      },
      {
        properties: this.properties,
        transactions: this.transactions,
      },
    );

    return updated;
  }
}
