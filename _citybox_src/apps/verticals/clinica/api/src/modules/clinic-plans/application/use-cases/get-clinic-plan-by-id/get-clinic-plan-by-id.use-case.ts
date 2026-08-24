import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClinicPlanNotFoundError } from '../../../domain/errors/clinic-plan.errors';
import { ClinicPlanRepository } from '../../../domain/repositories/clinic-plan.repository.interface';
import type {
  ClinicPlanDetailResult,
  GetClinicPlanByIdDto,
} from '../../dtos/clinic-plan.dto';

@Injectable()
export class GetClinicPlanByIdUseCase implements IUseCase<
  GetClinicPlanByIdDto,
  ClinicPlanDetailResult
> {
  constructor(private readonly repository: ClinicPlanRepository) {}

  async execute(dto: GetClinicPlanByIdDto): Promise<ClinicPlanDetailResult> {
    const aggregate = await this.repository.findAggregateById(
      dto.storeId,
      dto.id,
    );
    if (!aggregate) {
      throw new ClinicPlanNotFoundError(GetClinicPlanByIdUseCase.name, dto.id);
    }
    return aggregate;
  }
}
