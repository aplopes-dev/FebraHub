import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { Branch } from '../../../domain/entities/branch.entity';
import { BranchRepository } from '../../../domain/repositories/branch.repository.interface';
import { BranchNotFoundError } from '../../../domain/errors/branch-not-found.error';
import type { FindBranchByIdDto } from '../../dtos/branch.dto';

@Injectable()
export class FindBranchByIdUseCase implements IUseCase<
  FindBranchByIdDto,
  Branch
> {
  constructor(private readonly branchRepository: BranchRepository) {}

  async execute(input: FindBranchByIdDto): Promise<Branch> {
    const branch = await this.branchRepository.findById(
      input.organizationId,
      input.id,
    );
    // Filial de outra organização e filial inexistente devolvem o mesmo 404 —
    // a diferença revelaria que o id existe em outro tenant.
    if (!branch || branch.deletedAt) throw new BranchNotFoundError(input.id);

    // Mesmo dentro da organização o recorte vale: um MEMBER restrito à unidade
    // A não pode ler o cadastro fiscal da unidade B só por saber o id dela.
    // `null` em `allowedBranchIds` é OWNER/ADMIN — acessam tudo.
    const allowed = input.allowedBranchIds;
    if (allowed && !allowed.includes(branch.id)) {
      throw new BranchNotFoundError(input.id);
    }

    return branch;
  }
}
