import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { OperationNature } from '../../../domain/entities/operation-nature.entity';
import { OperationNatureNotFoundError } from '../../../domain/errors/operation-nature-not-found.error';
import { OperationNatureRepository } from '../../../domain/repositories/operation-nature.repository.interface';
import type { UpdateOperationNatureDto } from '../../dtos/operation-nature.dto';

/** Edita uma natureza de operação existente (spec erp/020). */
@Injectable()
export class UpdateOperationNatureUseCase implements IUseCase<
  UpdateOperationNatureDto,
  OperationNature
> {
  constructor(private readonly repository: OperationNatureRepository) {}

  async execute(input: UpdateOperationNatureDto): Promise<OperationNature> {
    const current = await this.repository.findById(
      input.organizationId,
      input.id,
    );
    if (!current) {
      throw new OperationNatureNotFoundError(input.id);
    }
    return this.repository.save(
      current.update({
        name: input.name,
        description: input.description,
        cfopRules: input.cfopRules,
        groupRules: input.groupRules,
      }),
    );
  }
}
