import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalGroup } from '../../../domain/entities/fiscal-group.entity';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import type { CreateIcmsGroupDto } from '../../dtos/fiscal-defaults.dto';

/** Cria um grupo de ICMS (spec erp/016). Validação de situação/UF na entidade. */
@Injectable()
export class CreateIcmsGroupUseCase implements IUseCase<
  CreateIcmsGroupDto,
  FiscalGroup
> {
  constructor(private readonly repository: FiscalGroupRepository) {}

  async execute(input: CreateIcmsGroupDto): Promise<FiscalGroup> {
    // async: a validação da entidade lança síncrono; sem async escaparia como throw.
    const group = FiscalGroup.createIcms(input.organizationId, {
      name: input.name,
      icmsCst: input.icmsCst,
      icmsCsosn: input.icmsCsosn,
      ufRates: input.ufRates,
    });
    return this.repository.save(group);
  }
}
