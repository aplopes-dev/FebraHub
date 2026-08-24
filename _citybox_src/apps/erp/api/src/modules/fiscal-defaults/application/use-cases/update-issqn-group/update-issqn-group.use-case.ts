import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalGroup } from '../../../domain/entities/fiscal-group.entity';
import { FiscalGroupNotFoundError } from '../../../domain/errors/fiscal-group-not-found.error';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import type { UpdateIssqnGroupDto } from '../../dtos/fiscal-defaults.dto';

/** Edita um grupo de ISSQN existente (spec erp/018). */
@Injectable()
export class UpdateIssqnGroupUseCase implements IUseCase<
  UpdateIssqnGroupDto,
  FiscalGroup
> {
  constructor(private readonly repository: FiscalGroupRepository) {}

  async execute(input: UpdateIssqnGroupDto): Promise<FiscalGroup> {
    const current = await this.repository.findById(
      input.organizationId,
      input.id,
    );
    if (!current || current.taxType !== 'ISSQN') {
      throw new FiscalGroupNotFoundError(input.id);
    }

    return this.repository.save(
      current.updateIssqn({
        name: input.name,
        issqnServiceCode: input.issqnServiceCode,
        issqnNationalCode: input.issqnNationalCode,
        issqnRate: input.issqnRate,
        issqnTribType: input.issqnTribType,
      }),
    );
  }
}
