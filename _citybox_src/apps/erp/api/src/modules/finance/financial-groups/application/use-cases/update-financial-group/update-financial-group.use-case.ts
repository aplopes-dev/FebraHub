import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { FinancialGroup } from '../../../domain/entities/financial-group.entity';
import { FinancialGroupRepository } from '../../../domain/repositories/financial-group.repository.interface';
import { FinancialGroupNotFoundError } from '../../../domain/errors/financial-group-not-found.error';
import { FinancialGroupNameTakenError } from '../../../domain/errors/financial-group-name-taken.error';
import { FinancialGroupImmutableFieldError } from '../../../domain/errors/financial-group-immutable-field.error';
import type { UpdateFinancialGroupDto } from '../../dtos/financial-group.dto';

@Injectable()
export class UpdateFinancialGroupUseCase implements IUseCase<
  UpdateFinancialGroupDto,
  FinancialGroup
> {
  constructor(private readonly groupRepository: FinancialGroupRepository) {}

  async execute(input: UpdateFinancialGroupDto): Promise<FinancialGroup> {
    const group = await this.groupRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!group) throw new FinancialGroupNotFoundError(input.id);

    // Renomear é livre; o tipo é o que a aplicação lê para classificar receita
    // e despesa, então num grupo de sistema ele fica travado.
    if (group.isSystem && input.type !== group.type) {
      throw new FinancialGroupImmutableFieldError(input.id, 'type');
    }

    const name = input.name.trim();
    const existing = await this.groupRepository.findByName(
      input.organizationId,
      name,
    );
    if (existing && existing.id !== group.id) {
      throw new FinancialGroupNameTakenError(name);
    }

    return this.groupRepository.save(group.update({ name, type: input.type }));
  }
}
