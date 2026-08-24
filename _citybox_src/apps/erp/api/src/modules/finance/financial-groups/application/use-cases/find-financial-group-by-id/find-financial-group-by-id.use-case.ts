import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { FinancialGroup } from '../../../domain/entities/financial-group.entity';
import { FinancialGroupRepository } from '../../../domain/repositories/financial-group.repository.interface';
import { FinancialGroupNotFoundError } from '../../../domain/errors/financial-group-not-found.error';
import type { FindFinancialGroupByIdDto } from '../../dtos/financial-group.dto';

/**
 * Devolve também o grupo excluído: a aba "Excluídos" da listagem leva até ele,
 * e a tela precisa mostrar o cadastro antes de restaurar.
 */
@Injectable()
export class FindFinancialGroupByIdUseCase implements IUseCase<
  FindFinancialGroupByIdDto,
  FinancialGroup
> {
  constructor(private readonly groupRepository: FinancialGroupRepository) {}

  async execute(input: FindFinancialGroupByIdDto): Promise<FinancialGroup> {
    const group = await this.groupRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!group) throw new FinancialGroupNotFoundError(input.id);

    return group;
  }
}
