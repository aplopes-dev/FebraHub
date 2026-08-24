import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { OperationNature } from '../../../domain/entities/operation-nature.entity';
import { OperationNatureNotFoundError } from '../../../domain/errors/operation-nature-not-found.error';
import { OperationNatureRepository } from '../../../domain/repositories/operation-nature.repository.interface';
import type { GetOperationNatureDto } from '../../dtos/operation-nature.dto';

/** Busca uma natureza de operação por id (spec erp/020). */
@Injectable()
export class GetOperationNatureUseCase implements IUseCase<
  GetOperationNatureDto,
  OperationNature
> {
  constructor(private readonly repository: OperationNatureRepository) {}

  async execute(input: GetOperationNatureDto): Promise<OperationNature> {
    const nature = await this.repository.findById(
      input.organizationId,
      input.id,
    );
    if (!nature) {
      throw new OperationNatureNotFoundError(input.id);
    }
    return nature;
  }
}
