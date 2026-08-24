import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClinicPlanNotFoundError } from '../../../domain/errors/clinic-plan.errors';
import { ClinicPlanRepository } from '../../../domain/repositories/clinic-plan.repository.interface';
import { applyDefaultPlanFlag } from '../../utils/apply-default-plan-flag';
import { buildPlanTree } from '../../utils/build-plan-tree';
import type {
  ClinicPlanDetailResult,
  UpdateClinicPlanDto,
} from '../../dtos/clinic-plan.dto';

@Injectable()
export class UpdateClinicPlanUseCase implements IUseCase<
  UpdateClinicPlanDto,
  ClinicPlanDetailResult
> {
  constructor(private readonly repository: ClinicPlanRepository) {}

  async execute(dto: UpdateClinicPlanDto): Promise<ClinicPlanDetailResult> {
    const existing = await this.repository.findById(dto.storeId, dto.id);
    if (!existing) {
      throw new ClinicPlanNotFoundError(UpdateClinicPlanUseCase.name, dto.id);
    }

    existing.update({
      name: dto.name,
      status: dto.status,
      isDefault: dto.isDefault,
    });

    const tree = buildPlanTree(dto.storeId, dto.id, dto.specialties);
    const saved = await this.repository.replaceTree(
      existing,
      tree.specialties,
      tree.treatments,
    );

    if (dto.isDefault) {
      await applyDefaultPlanFlag(
        this.repository,
        dto.storeId,
        dto.id,
        UpdateClinicPlanUseCase.name,
      );
      const refreshed = await this.repository.findAggregateById(
        dto.storeId,
        dto.id,
      );
      return refreshed ?? saved;
    }

    return saved;
  }
}
