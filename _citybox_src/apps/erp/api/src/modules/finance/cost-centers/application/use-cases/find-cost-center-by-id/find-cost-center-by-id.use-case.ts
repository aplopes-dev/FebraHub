import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { CostCenter } from '../../../domain/entities/cost-center.entity';
import { CostCenterRepository } from '../../../domain/repositories/cost-center.repository.interface';
import { CostCenterNotFoundError } from '../../../domain/errors/cost-center-not-found.error';
import type { FindCostCenterByIdDto } from '../../dtos/cost-center.dto';

@Injectable()
export class FindCostCenterByIdUseCase implements IUseCase<
  FindCostCenterByIdDto,
  CostCenter
> {
  constructor(private readonly costCenterRepository: CostCenterRepository) {}

  async execute(input: FindCostCenterByIdDto): Promise<CostCenter> {
    const costCenter = await this.costCenterRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!costCenter) throw new CostCenterNotFoundError(input.id);

    return costCenter;
  }
}
