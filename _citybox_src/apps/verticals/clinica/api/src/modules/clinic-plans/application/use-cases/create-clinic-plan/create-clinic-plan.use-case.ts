import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClinicPlan } from '../../../domain/entities/clinic-plan.entity';
import { NoDefaultPlanError } from '../../../domain/errors/clinic-plan.errors';
import { ClinicPlanRepository } from '../../../domain/repositories/clinic-plan.repository.interface';
import { applyDefaultPlanFlag } from '../../utils/apply-default-plan-flag';
import {
  buildPlanTree,
  clonePlanTreeFromAggregate,
} from '../../utils/build-plan-tree';
import type {
  ClinicPlanDetailResult,
  CreateClinicPlanDto,
} from '../../dtos/clinic-plan.dto';

@Injectable()
export class CreateClinicPlanUseCase implements IUseCase<
  CreateClinicPlanDto,
  ClinicPlanDetailResult
> {
  constructor(private readonly repository: ClinicPlanRepository) {}

  async execute(dto: CreateClinicPlanDto): Promise<ClinicPlanDetailResult> {
    const maxSortOrder = await this.repository.getMaxSortOrder(dto.storeId);
    const plan = ClinicPlan.create({
      storeId: dto.storeId,
      name: dto.name.trim(),
      sortOrder: maxSortOrder + 1,
      status: dto.status,
      isDefault: false,
      treatmentInit: dto.treatmentInit ?? null,
    });

    const specialtyInputs = dto.specialties;

    if (dto.treatmentInit === 'copy_default' && specialtyInputs.length === 0) {
      const defaultPlan = await this.repository.findDefaultActiveByStoreId(
        dto.storeId,
      );
      if (!defaultPlan) {
        throw new NoDefaultPlanError(CreateClinicPlanUseCase.name, dto.storeId);
      }
      const defaultAggregate = await this.repository.findAggregateById(
        dto.storeId,
        defaultPlan.id,
      );
      if (!defaultAggregate) {
        throw new NoDefaultPlanError(CreateClinicPlanUseCase.name, dto.storeId);
      }

      const cloned = clonePlanTreeFromAggregate(
        dto.storeId,
        plan.id,
        defaultAggregate.specialties,
        defaultAggregate.treatments,
      );

      const saved = await this.repository.saveAggregate({
        plan,
        specialties: cloned.specialties,
        treatments: cloned.treatments,
      });

      if (dto.isDefault) {
        await applyDefaultPlanFlag(
          this.repository,
          dto.storeId,
          saved.plan.id,
          CreateClinicPlanUseCase.name,
        );
        const refreshed = await this.repository.findAggregateById(
          dto.storeId,
          saved.plan.id,
        );
        return refreshed ?? saved;
      }

      return saved;
    }

    const tree = buildPlanTree(dto.storeId, plan.id, specialtyInputs, {
      idMode: 'create',
    });
    const saved = await this.repository.saveAggregate({
      plan,
      specialties: tree.specialties,
      treatments: tree.treatments,
    });

    if (dto.isDefault) {
      await applyDefaultPlanFlag(
        this.repository,
        dto.storeId,
        saved.plan.id,
        CreateClinicPlanUseCase.name,
      );
      const refreshed = await this.repository.findAggregateById(
        dto.storeId,
        saved.plan.id,
      );
      return refreshed ?? saved;
    }

    return saved;
  }
}
