import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalGroup } from '../../../domain/entities/fiscal-group.entity';
import { FiscalGroupNotFoundError } from '../../../domain/errors/fiscal-group-not-found.error';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import type { UpdateIcmsGroupDto } from '../../dtos/fiscal-defaults.dto';

/** Edita um grupo de ICMS existente (spec erp/016). */
@Injectable()
export class UpdateIcmsGroupUseCase implements IUseCase<
  UpdateIcmsGroupDto,
  FiscalGroup
> {
  constructor(private readonly repository: FiscalGroupRepository) {}

  async execute(input: UpdateIcmsGroupDto): Promise<FiscalGroup> {
    const current = await this.repository.findById(
      input.organizationId,
      input.id,
    );
    if (!current || current.taxType !== 'ICMS') {
      throw new FiscalGroupNotFoundError(input.id);
    }

    return this.repository.save(
      current.updateIcms({
        name: input.name,
        icmsCst: input.icmsCst,
        icmsCsosn: input.icmsCsosn,
        ufRates: input.ufRates,
      }),
    );
  }
}
