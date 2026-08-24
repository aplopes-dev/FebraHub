import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { LeadEntity } from '../../../../leads/domain/entities/lead.entity';
import type { DealEntity } from '../../../domain/entities/deal.entity';
import { DealRepository } from '../../../domain/repositories/deal.repository.interface';
import { PropertyRepository } from '../../../../properties/domain/repositories/property.repository.interface';
import { TransactionRepository } from '../../../../transactions/domain/repositories/transaction.repository.interface';
import { applyDealPropertyAvailabilitySideEffects } from '../../policies/deal-property-availability.side-effects';
import { applyLeadCancelSideEffects } from '../../policies/lead-cancel.side-effects';
import {
  buildDealTitle,
  resolveLeadPrimaryProperty,
  resolveTargetDealStageFromLead,
  shouldSyncDealStage,
} from '../../policies/lead-deal-sync.policy';

@Injectable()
export class SyncActiveDealForLeadUseCase implements IUseCase<
  LeadEntity,
  DealEntity | null
> {
  constructor(
    private readonly deals: DealRepository,
    private readonly properties: PropertyRepository,
    private readonly transactions: TransactionRepository,
  ) {}

  async execute(lead: LeadEntity): Promise<DealEntity | null> {
    if (lead.status === 'cancelled') {
      await applyLeadCancelSideEffects(lead.storeId, lead, {
        deals: this.deals,
        transactions: this.transactions,
        properties: this.properties,
      });
      return null;
    }

    const property = resolveLeadPrimaryProperty(lead);
    const targetStage = resolveTargetDealStageFromLead(lead);
    const title = buildDealTitle(lead.name, property.propertyName);

    const existing = await this.deals.findActiveByLeadId(lead.storeId, lead.id);
    const previousPropertyId = existing?.propertyId ?? null;

    if (!existing) {
      const created = await this.deals.create({
        storeId: lead.storeId,
        leadId: lead.id,
        propertyId: property.propertyId,
        propertyName: property.propertyName,
        leadName: lead.name,
        stage: targetStage,
        title,
        agentId: lead.agentId,
      });
      await this.syncPropertyAvailability({
        storeId: lead.storeId,
        previousPropertyId: null,
        nextPropertyId: property.propertyId,
        nextStage: targetStage,
      });
      return created;
    }

    if (!shouldSyncDealStage(existing.stage, targetStage)) {
      const updated = await this.deals.update(lead.storeId, existing.id, {
        leadName: lead.name,
        agentId: lead.agentId,
      });
      const next = updated ?? existing;
      // Mesmo sem avançar etapa, alinha status do imóvel (ex.: deals já em contract_sent).
      await this.syncPropertyAvailability({
        storeId: lead.storeId,
        previousPropertyId: next.propertyId,
        nextPropertyId: next.propertyId,
        nextStage: next.stage,
      });
      return next;
    }

    const updated = await this.deals.update(lead.storeId, existing.id, {
      propertyId: property.propertyId,
      propertyName: property.propertyName,
      leadName: lead.name,
      agentId: lead.agentId,
      stage: targetStage,
      title,
    });
    const next = updated ?? existing;
    await this.syncPropertyAvailability({
      storeId: lead.storeId,
      previousPropertyId,
      nextPropertyId: property.propertyId,
      nextStage: targetStage,
    });
    return next;
  }

  private async syncPropertyAvailability(input: {
    storeId: string;
    previousPropertyId: string | null;
    nextPropertyId: string | null;
    nextStage: DealEntity['stage'];
  }): Promise<void> {
    await applyDealPropertyAvailabilitySideEffects(
      input.storeId,
      {
        previousPropertyId: input.previousPropertyId,
        nextPropertyId: input.nextPropertyId,
        nextStage: input.nextStage,
      },
      {
        properties: this.properties,
        transactions: this.transactions,
      },
    );
  }
}
