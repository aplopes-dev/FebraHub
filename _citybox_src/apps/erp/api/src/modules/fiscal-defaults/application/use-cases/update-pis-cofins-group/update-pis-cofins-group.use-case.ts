import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalGroup } from '../../../domain/entities/fiscal-group.entity';
import { FiscalGroupNotFoundError } from '../../../domain/errors/fiscal-group-not-found.error';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import type { UpdatePisCofinsGroupDto } from '../../dtos/fiscal-defaults.dto';

/** Edita um grupo de PIS/COFINS existente (spec erp/015). */
@Injectable()
export class UpdatePisCofinsGroupUseCase implements IUseCase<
  UpdatePisCofinsGroupDto,
  FiscalGroup
> {
  constructor(private readonly repository: FiscalGroupRepository) {}

  async execute(input: UpdatePisCofinsGroupDto): Promise<FiscalGroup> {
    const current = await this.repository.findById(
      input.organizationId,
      input.id,
    );
    if (!current || current.taxType !== 'PIS_COFINS') {
      throw new FiscalGroupNotFoundError(input.id);
    }

    return this.repository.save(
      current.update({
        name: input.name,
        pisCst: input.pisCst,
        pisAliquota: input.pisAliquota,
        cofinsCst: input.cofinsCst,
        cofinsAliquota: input.cofinsAliquota,
      }),
    );
  }
}
