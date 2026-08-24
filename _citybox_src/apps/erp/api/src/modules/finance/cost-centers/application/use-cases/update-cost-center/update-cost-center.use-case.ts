import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CostCenter } from '../../../domain/entities/cost-center.entity';
import { CostCenterRepository } from '../../../domain/repositories/cost-center.repository.interface';
import { CostCenterNotFoundError } from '../../../domain/errors/cost-center-not-found.error';
import { CostCenterNameTakenError } from '../../../domain/errors/cost-center-name-taken.error';
import type { UpdateCostCenterDto } from '../../dtos/cost-center.dto';

@Injectable()
export class UpdateCostCenterUseCase implements IUseCase<
  UpdateCostCenterDto,
  CostCenter
> {
  constructor(private readonly costCenterRepository: CostCenterRepository) {}

  async execute(input: UpdateCostCenterDto): Promise<CostCenter> {
    const costCenter = await this.costCenterRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!costCenter) throw new CostCenterNotFoundError(input.id);

    const name = input.name.trim();
    const existing = await this.costCenterRepository.findByName(
      input.organizationId,
      name,
    );
    if (existing && existing.id !== costCenter.id) {
      throw new CostCenterNameTakenError(name);
    }

    return this.costCenterRepository.save(costCenter.update({ name }));
  }
}
