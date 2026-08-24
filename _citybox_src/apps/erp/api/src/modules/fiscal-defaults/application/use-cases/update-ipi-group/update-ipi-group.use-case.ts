import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalGroup } from '../../../domain/entities/fiscal-group.entity';
import { FiscalGroupNotFoundError } from '../../../domain/errors/fiscal-group-not-found.error';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import type { UpdateIpiGroupDto } from '../../dtos/fiscal-defaults.dto';

/** Edita um grupo de IPI existente (spec erp/019). */
@Injectable()
export class UpdateIpiGroupUseCase implements IUseCase<
  UpdateIpiGroupDto,
  FiscalGroup
> {
  constructor(private readonly repository: FiscalGroupRepository) {}

  async execute(input: UpdateIpiGroupDto): Promise<FiscalGroup> {
    const current = await this.repository.findById(
      input.organizationId,
      input.id,
    );
    if (!current || current.taxType !== 'IPI') {
      throw new FiscalGroupNotFoundError(input.id);
    }

    return this.repository.save(
      current.updateIpi({
        name: input.name,
        ipiCst: input.ipiCst,
        ipiEnquadramento: input.ipiEnquadramento,
        ipiRate: input.ipiRate,
      }),
    );
  }
}
