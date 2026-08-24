import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClinicPlan } from '../../../domain/entities/clinic-plan.entity';
import { ClinicPlanNotFoundError } from '../../../domain/errors/clinic-plan.errors';
import { ClinicPlanRepository } from '../../../domain/repositories/clinic-plan.repository.interface';
import type { UpdateClinicPlanStatusDto } from '../../dtos/clinic-plan.dto';

@Injectable()
export class UpdateClinicPlanStatusUseCase implements IUseCase<
  UpdateClinicPlanStatusDto,
  ClinicPlan
> {
  constructor(private readonly repository: ClinicPlanRepository) {}

  async execute(dto: UpdateClinicPlanStatusDto): Promise<ClinicPlan> {
    const plan = await this.repository.findById(dto.storeId, dto.id);
    if (!plan) {
      throw new ClinicPlanNotFoundError(
        UpdateClinicPlanStatusUseCase.name,
        dto.id,
      );
    }

    plan.changeStatus(dto.active);
    return this.repository.save(plan);
  }
}
