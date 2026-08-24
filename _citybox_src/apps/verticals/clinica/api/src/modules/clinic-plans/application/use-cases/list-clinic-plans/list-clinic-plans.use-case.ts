import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClinicPlan } from '../../../domain/entities/clinic-plan.entity';
import { ClinicPlanRepository } from '../../../domain/repositories/clinic-plan.repository.interface';
import type { ListClinicPlansDto } from '../../dtos/clinic-plan.dto';

@Injectable()
export class ListClinicPlansUseCase implements IUseCase<
  ListClinicPlansDto,
  ClinicPlan[]
> {
  constructor(private readonly repository: ClinicPlanRepository) {}

  async execute(dto: ListClinicPlansDto): Promise<ClinicPlan[]> {
    return this.repository.findByStoreId(dto.storeId);
  }
}
