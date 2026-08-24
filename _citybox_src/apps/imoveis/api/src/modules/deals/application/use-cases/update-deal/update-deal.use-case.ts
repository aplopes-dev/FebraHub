import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PropertyNotFoundError } from '../../../../properties/domain/errors/property-not-found.error';
import { PropertyRepository } from '../../../../properties/domain/repositories/property.repository.interface';
import type {
  DealEntity,
  DealStage,
  DealStatus,
  DealType,
} from '../../../domain/entities/deal.entity';
import { DealNotFoundError } from '../../../domain/errors/deal-not-found.error';
import { DealRepository } from '../../../domain/repositories/deal.repository.interface';
import { assertDealStageTransition } from '../../policies/deal-stage.policy';

export type UpdateDealInput = {
  storeId: string;
  id: string;
  propertyId?: string | null;
  type?: DealType | null;
  status?: DealStatus;
  stage?: DealStage;
  title?: string;
  agentId?: string | null;
};

@Injectable()
export class UpdateDealUseCase implements IUseCase<
  UpdateDealInput,
  DealEntity
> {
  constructor(
    private readonly deals: DealRepository,
    private readonly properties: PropertyRepository,
  ) {}

  async execute(input: UpdateDealInput): Promise<DealEntity> {
    const existing = await this.deals.findById(input.storeId, input.id);
    if (!existing) throw new DealNotFoundError(input.id);

    const patch: Parameters<DealRepository['update']>[2] = {};

    if (input.propertyId !== undefined) {
      if (input.propertyId === null) {
        patch.propertyId = null;
        patch.propertyName = '';
      } else {
        const property = await this.properties.findById(
          input.storeId,
          input.propertyId,
        );
        if (!property) throw new PropertyNotFoundError(input.propertyId);
        patch.propertyId = property.id;
        patch.propertyName = property.name;
      }
    }

    if (input.type !== undefined) patch.type = input.type;
    if (input.status !== undefined) patch.status = input.status;
    if (input.stage !== undefined) patch.stage = input.stage;
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.agentId !== undefined) patch.agentId = input.agentId;

    if (input.stage !== undefined) {
      assertDealStageTransition(
        {
          id: existing.id,
          propertyId:
            patch.propertyId !== undefined
              ? patch.propertyId
              : existing.propertyId,
          propertyName:
            patch.propertyName !== undefined
              ? patch.propertyName
              : existing.propertyName,
        },
        input.stage,
      );
    }

    const updated = await this.deals.update(input.storeId, input.id, patch);
    if (!updated) throw new DealNotFoundError(input.id);
    return updated;
  }
}
