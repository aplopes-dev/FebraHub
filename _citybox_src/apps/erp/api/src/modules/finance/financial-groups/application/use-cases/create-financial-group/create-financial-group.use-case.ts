import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialGroup } from '../../../domain/entities/financial-group.entity';
import { FinancialGroupRepository } from '../../../domain/repositories/financial-group.repository.interface';
import { FinancialGroupNameTakenError } from '../../../domain/errors/financial-group-name-taken.error';
import type { CreateFinancialGroupDto } from '../../dtos/financial-group.dto';

@Injectable()
export class CreateFinancialGroupUseCase implements IUseCase<
  CreateFinancialGroupDto,
  FinancialGroup
> {
  constructor(private readonly groupRepository: FinancialGroupRepository) {}

  async execute(input: CreateFinancialGroupDto): Promise<FinancialGroup> {
    const name = input.name.trim();
    const existing = await this.groupRepository.findByName(
      input.organizationId,
      name,
    );
    if (existing) throw new FinancialGroupNameTakenError(name);

    const group = FinancialGroup.create({
      organizationId: input.organizationId,
      name,
      type: input.type,
    });

    return this.groupRepository.save(group);
  }
}
