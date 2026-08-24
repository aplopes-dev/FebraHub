import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PlanRepository } from '../../../domain/repositories/plan.repository.interface';
import { Plan } from '../../../domain/entities/plan.entity';
import { PlanNotFoundError } from '../../../domain/errors/plan-not-found.error';
import { PlanCodeTakenError } from '../../../domain/errors/plan-code-taken.error';
import type { UpdatePlanDto } from '../../dtos/plan.dto';
import {
  mapUpdateDtoToPlanProps,
  normalizePlanCode,
} from '../../mappers/plan.mapper';

@Injectable()
export class UpdatePlanUseCase implements IUseCase<UpdatePlanDto, Plan> {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(dto: UpdatePlanDto): Promise<Plan> {
    const existing = await this.planRepository.findById(dto.id);
    if (!existing) {
      throw new PlanNotFoundError(UpdatePlanUseCase.name, dto.id);
    }

    const code = normalizePlanCode(dto.code);
    if (code !== existing.code) {
      const duplicate = await this.planRepository.findByCode(code);
      if (duplicate) {
        throw new PlanCodeTakenError(UpdatePlanUseCase.name, code);
      }
    }

    const props = mapUpdateDtoToPlanProps(dto);
    existing.update(props);
    return this.planRepository.save(existing);
  }
}
