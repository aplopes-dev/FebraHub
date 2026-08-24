import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CostCenter } from '../../../domain/entities/cost-center.entity';
import { CostCenterRepository } from '../../../domain/repositories/cost-center.repository.interface';
import { CostCenterNameTakenError } from '../../../domain/errors/cost-center-name-taken.error';
import type { CreateCostCenterDto } from '../../dtos/cost-center.dto';

@Injectable()
export class CreateCostCenterUseCase implements IUseCase<
  CreateCostCenterDto,
  CostCenter
> {
  constructor(private readonly costCenterRepository: CostCenterRepository) {}

  async execute(input: CreateCostCenterDto): Promise<CostCenter> {
    const name = input.name.trim();
    const existing = await this.costCenterRepository.findByName(
      input.organizationId,
      name,
    );
    if (existing) throw new CostCenterNameTakenError(name);

    const costCenter = CostCenter.create({
      organizationId: input.organizationId,
      name,
    });

    return this.costCenterRepository.save(costCenter);
  }
}
