import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalGroup } from '../../../domain/entities/fiscal-group.entity';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import type { CreateIssqnGroupDto } from '../../dtos/fiscal-defaults.dto';

/** Cria um grupo de ISSQN (spec erp/018). Validação de códigos/exigibilidade na entidade. */
@Injectable()
export class CreateIssqnGroupUseCase implements IUseCase<
  CreateIssqnGroupDto,
  FiscalGroup
> {
  constructor(private readonly repository: FiscalGroupRepository) {}

  async execute(input: CreateIssqnGroupDto): Promise<FiscalGroup> {
    // async: a validação da entidade lança síncrono; sem async escaparia como throw.
    const group = FiscalGroup.createIssqn(input.organizationId, {
      name: input.name,
      issqnServiceCode: input.issqnServiceCode,
      issqnNationalCode: input.issqnNationalCode,
      issqnRate: input.issqnRate,
      issqnTribType: input.issqnTribType,
    });
    return this.repository.save(group);
  }
}
