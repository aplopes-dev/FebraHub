import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { LeadNotFoundError } from '../../../../leads/domain/errors/lead-not-found.error';
import { LeadRepository } from '../../../../leads/domain/repositories/lead.repository.interface';
import { PropertyNotFoundError } from '../../../../properties/domain/errors/property-not-found.error';
import { PropertyRepository } from '../../../../properties/domain/repositories/property.repository.interface';
import type {
  DealEntity,
  DealType,
} from '../../../domain/entities/deal.entity';
import { DealRepository } from '../../../domain/repositories/deal.repository.interface';
import { defaultStageForProperty } from '../../policies/deal-stage.policy';

export type CreateDealInput = {
  storeId: string;
  leadId: string;
  propertyId?: string;
  type?: DealType;
  title?: string;
  agentId?: string;
};

const TYPE_LABEL: Record<DealType, string> = {
  SALE: 'Venda',
  RENTAL: 'Locação',
};

@Injectable()
export class CreateDealUseCase implements IUseCase<
  CreateDealInput,
  DealEntity
> {
  constructor(
    private readonly deals: DealRepository,
    private readonly leads: LeadRepository,
    private readonly properties: PropertyRepository,
  ) {}

  async execute(input: CreateDealInput): Promise<DealEntity> {
    const lead = await this.leads.findById(input.storeId, input.leadId);
    if (!lead) throw new LeadNotFoundError(input.leadId);

    let propertyName = '';
    if (input.propertyId) {
      const property = await this.properties.findById(
        input.storeId,
        input.propertyId,
      );
      if (!property) throw new PropertyNotFoundError(input.propertyId);
      propertyName = property.name;
    }

    const title =
      input.title?.trim() ||
      (input.type && propertyName
        ? `${TYPE_LABEL[input.type]} — ${propertyName}`
        : propertyName
          ? `Negócio — ${propertyName}`
          : `Negócio — ${lead.name}`);

    return this.deals.create({
      storeId: input.storeId,
      leadId: lead.id,
      propertyId: input.propertyId ?? null,
      propertyName,
      leadName: lead.name,
      type: input.type ?? null,
      stage: defaultStageForProperty(input.propertyId),
      title,
      agentId: input.agentId ?? lead.agentId ?? null,
    });
  }
}
