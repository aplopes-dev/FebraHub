import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { OperationNature } from '../../../domain/entities/operation-nature.entity';
import { OperationNatureRepository } from '../../../domain/repositories/operation-nature.repository.interface';
import type { CreateOperationNatureDto } from '../../dtos/operation-nature.dto';

/** Cria uma natureza de operação (spec erp/020). Validação das listas na entidade. */
@Injectable()
export class CreateOperationNatureUseCase implements IUseCase<
  CreateOperationNatureDto,
  OperationNature
> {
  constructor(private readonly repository: OperationNatureRepository) {}

  async execute(input: CreateOperationNatureDto): Promise<OperationNature> {
    const nature = OperationNature.create({
      organizationId: input.organizationId,
      name: input.name,
      description: input.description,
      cfopRules: input.cfopRules,
      groupRules: input.groupRules,
    });
    return this.repository.save(nature);
  }
}
