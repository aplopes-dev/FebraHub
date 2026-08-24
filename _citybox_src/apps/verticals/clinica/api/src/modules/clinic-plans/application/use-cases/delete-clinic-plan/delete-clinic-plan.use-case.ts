import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  ClinicPlanNotFoundError,
  CannotDeleteDefaultPlanError,
  ClinicPlanHasPatientsError,
} from '../../../domain/errors/clinic-plan.errors';
import { ClinicPlanRepository } from '../../../domain/repositories/clinic-plan.repository.interface';
import type { DeleteClinicPlanDto } from '../../dtos/clinic-plan.dto';

@Injectable()
export class DeleteClinicPlanUseCase implements IUseCase<
  DeleteClinicPlanDto,
  void
> {
  constructor(private readonly repository: ClinicPlanRepository) {}

  async execute(dto: DeleteClinicPlanDto): Promise<void> {
    const plan = await this.repository.findById(dto.storeId, dto.id);
    if (!plan) {
      throw new ClinicPlanNotFoundError(DeleteClinicPlanUseCase.name, dto.id);
    }
    if (plan.isDefault) {
      throw new CannotDeleteDefaultPlanError(
        DeleteClinicPlanUseCase.name,
        dto.id,
      );
    }

    const linked = await this.repository.countLinkedUsage(dto.storeId, dto.id);
    if (linked > 0) {
      throw new ClinicPlanHasPatientsError(
        DeleteClinicPlanUseCase.name,
        dto.id,
      );
    }

    await this.repository.delete(dto.storeId, dto.id);
  }
}
