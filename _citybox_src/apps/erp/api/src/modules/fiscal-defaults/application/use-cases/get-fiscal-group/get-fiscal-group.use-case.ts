import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalGroup } from '../../../domain/entities/fiscal-group.entity';
import { FiscalGroupNotFoundError } from '../../../domain/errors/fiscal-group-not-found.error';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import type { GetFiscalGroupDto } from '../../dtos/fiscal-defaults.dto';

/** Carrega um grupo fiscal por id (spec erp/015). 404 se não existir na org. */
@Injectable()
export class GetFiscalGroupUseCase implements IUseCase<
  GetFiscalGroupDto,
  FiscalGroup
> {
  constructor(private readonly repository: FiscalGroupRepository) {}

  async execute(input: GetFiscalGroupDto): Promise<FiscalGroup> {
    const group = await this.repository.findById(
      input.organizationId,
      input.id,
    );
    // 404 também quando o tributo não bate: a rota é por-tributo, então um grupo
    // de ICMS não deve vazar por GET /v1/fiscal-pis-cofins-groups/:id.
    if (!group || (input.taxType && group.taxType !== input.taxType)) {
      throw new FiscalGroupNotFoundError(input.id);
    }
    return group;
  }
}
