import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalGroup } from '../../../domain/entities/fiscal-group.entity';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import type { CreateIpiGroupDto } from '../../dtos/fiscal-defaults.dto';

/** Cria um grupo de IPI (spec erp/019). Validação de CST/cEnq/percentual na entidade. */
@Injectable()
export class CreateIpiGroupUseCase implements IUseCase<
  CreateIpiGroupDto,
  FiscalGroup
> {
  constructor(private readonly repository: FiscalGroupRepository) {}

  async execute(input: CreateIpiGroupDto): Promise<FiscalGroup> {
    // async: a validação da entidade lança síncrono; sem async escaparia como throw.
    const group = FiscalGroup.createIpi(input.organizationId, {
      name: input.name,
      ipiCst: input.ipiCst,
      ipiEnquadramento: input.ipiEnquadramento,
      ipiRate: input.ipiRate,
    });
    return this.repository.save(group);
  }
}
