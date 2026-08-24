import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { Organization } from '../../../domain/entities/organization.entity';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { OrganizationNotFoundError } from '../../../domain/errors/organization-not-found.error';

@Injectable()
export class FindOrganizationByIdUseCase implements IUseCase<
  string,
  Organization
> {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(organizationId: string): Promise<Organization> {
    const organization =
      await this.organizationRepository.findById(organizationId);
    if (!organization || organization.deletedAt) {
      throw new OrganizationNotFoundError(organizationId);
    }
    return organization;
  }
}
