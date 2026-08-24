import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { Branch } from '../../../domain/entities/branch.entity';
import { BranchRepository } from '../../../domain/repositories/branch.repository.interface';
import { BranchNotFoundError } from '../../../domain/errors/branch-not-found.error';
import { HeadquartersDuplicateError } from '../../../domain/errors/headquarters-duplicate.error';
import type { UpdateBranchDto } from '../../dtos/branch.dto';

@Injectable()
export class UpdateBranchUseCase implements IUseCase<UpdateBranchDto, Branch> {
  constructor(private readonly branchRepository: BranchRepository) {}

  async execute(input: UpdateBranchDto): Promise<Branch> {
    const branch = await this.branchRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!branch || branch.deletedAt) throw new BranchNotFoundError(input.id);

    const isHeadquarters = input.isHeadquarters ?? branch.isHeadquarters;
    if (isHeadquarters && !branch.isHeadquarters) {
      const headquarters = await this.branchRepository.findHeadquarters(
        input.organizationId,
      );
      // Só conflita se a matriz atual for OUTRA unidade: promover a que já é
      // matriz de novo não é conflito.
      if (headquarters && headquarters.id !== branch.id) {
        throw new HeadquartersDuplicateError(headquarters.code);
      }
    }

    const updated = branch.update({
      legalName: input.legalName,
      tradeName: input.tradeName ?? null,
      stateRegistration: input.stateRegistration ?? null,
      municipalRegistration: input.municipalRegistration ?? null,
      taxRegime: input.taxRegime ?? branch.taxRegime,
      isHeadquarters,
      zipCode: input.zipCode ?? null,
      street: input.street ?? null,
      number: input.number ?? null,
      complement: input.complement ?? null,
      neighborhood: input.neighborhood ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      timezone: input.timezone ?? branch.timezone,
      active: input.active ?? branch.active,
    });

    return this.branchRepository.save(updated);
  }
}
