import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalGroup } from '../../../domain/entities/fiscal-group.entity';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import type { CreatePisCofinsGroupDto } from '../../dtos/fiscal-defaults.dto';

/** Cria um grupo de PIS/COFINS (spec erp/015). Validação de CST/alíquota na entidade. */
@Injectable()
export class CreatePisCofinsGroupUseCase implements IUseCase<
  CreatePisCofinsGroupDto,
  FiscalGroup
> {
  constructor(private readonly repository: FiscalGroupRepository) {}

  async execute(input: CreatePisCofinsGroupDto): Promise<FiscalGroup> {
    // async: a validação da entidade lança síncrono; sem async isso escaparia
    // como throw em vez de Promise rejeitada.
    const group = FiscalGroup.create({
      organizationId: input.organizationId,
      taxType: 'PIS_COFINS',
      name: input.name,
      pisCst: input.pisCst,
      pisAliquota: input.pisAliquota,
      cofinsCst: input.cofinsCst,
      cofinsAliquota: input.cofinsAliquota,
    });
    return this.repository.save(group);
  }
}
