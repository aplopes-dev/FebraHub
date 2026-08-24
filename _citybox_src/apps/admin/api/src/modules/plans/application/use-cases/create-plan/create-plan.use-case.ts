import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PlanRepository } from '../../../domain/repositories/plan.repository.interface';
import { Plan } from '../../../domain/entities/plan.entity';
import { PlanCodeTakenError } from '../../../domain/errors/plan-code-taken.error';
import type { CreatePlanDto } from '../../dtos/plan.dto';
import {
  mapCreateDtoToPlanProps,
  normalizePlanCode,
} from '../../mappers/plan.mapper';

@Injectable()
export class CreatePlanUseCase implements IUseCase<CreatePlanDto, Plan> {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(dto: CreatePlanDto): Promise<Plan> {
    const code = normalizePlanCode(dto.code);
    const existing = await this.planRepository.findByCode(code);
    if (existing) {
      throw new PlanCodeTakenError(CreatePlanUseCase.name, code);
    }

    const plan = Plan.create(mapCreateDtoToPlanProps({ ...dto, code }));
    return this.planRepository.save(plan);
  }
}
