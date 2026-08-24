import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { FinancialGroup } from '../../../domain/entities/financial-group.entity';
import { FinancialGroupRepository } from '../../../domain/repositories/financial-group.repository.interface';
import { FinancialGroupNotFoundError } from '../../../domain/errors/financial-group-not-found.error';
import { FinancialGroupNameTakenError } from '../../../domain/errors/financial-group-name-taken.error';
import type { RestoreFinancialGroupDto } from '../../dtos/financial-group.dto';

@Injectable()
export class RestoreFinancialGroupUseCase implements IUseCase<
  RestoreFinancialGroupDto,
  FinancialGroup
> {
  constructor(private readonly groupRepository: FinancialGroupRepository) {}

  async execute(input: RestoreFinancialGroupDto): Promise<FinancialGroup> {
    const group = await this.groupRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!group) throw new FinancialGroupNotFoundError(input.id);

    // Restaurar quem já está ativo não é erro: o botão pode ter sido clicado
    // duas vezes, e o resultado desejado — grupo ativo — é o mesmo.
    if (!group.deletedAt) return group;

    // Enquanto o grupo estava na lixeira o nome ficou livre, e alguém pode
    // tê-lo reusado. Restaurar por cima estouraria o unique do banco.
    const existing = await this.groupRepository.findByName(
      input.organizationId,
      group.name,
    );
    if (existing && existing.id !== group.id) {
      throw new FinancialGroupNameTakenError(group.name);
    }

    return this.groupRepository.save(group.restore());
  }
}
