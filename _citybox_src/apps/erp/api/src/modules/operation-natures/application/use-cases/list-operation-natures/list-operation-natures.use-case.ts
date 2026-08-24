import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { OperationNature } from '../../../domain/entities/operation-nature.entity';
import { OperationNatureRepository } from '../../../domain/repositories/operation-nature.repository.interface';
import type { ListOperationNaturesDto } from '../../dtos/operation-nature.dto';

/** Lista as naturezas de operação da organização (spec erp/020). */
@Injectable()
export class ListOperationNaturesUseCase implements IUseCase<
  ListOperationNaturesDto,
  OperationNature[]
> {
  constructor(private readonly repository: OperationNatureRepository) {}

  execute(input: ListOperationNaturesDto): Promise<OperationNature[]> {
    return this.repository.listByOrganization(input.organizationId);
  }
}
