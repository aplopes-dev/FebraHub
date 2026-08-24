import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { Organization } from '../../../domain/entities/organization.entity';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { OrganizationNotFoundError } from '../../../domain/errors/organization-not-found.error';
import type { UpdateOrganizationDto } from '../../dtos/organization.dto';

/**
 * Atualiza os dados cadastrais. Documento e tipo de pessoa ficam de fora de
 * propósito: trocá-los transformaria a organização em outra empresa, com todo
 * o histórico fiscal pendurado.
 */
@Injectable()
export class UpdateOrganizationUseCase implements IUseCase<
  UpdateOrganizationDto,
  Organization
> {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(input: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.organizationRepository.findById(
      input.organizationId,
    );
    if (!organization || organization.deletedAt) {
      throw new OrganizationNotFoundError(input.organizationId);
    }

    const updated = organization.update({
      legalName: input.legalName,
      tradeName: input.tradeName ?? null,
      email: input.email,
      phone: input.phone ?? null,
      responsibleName: input.responsibleName,
      responsibleDocument: input.responsibleDocument ?? null,
      responsibleEmail: input.responsibleEmail ?? null,
      responsiblePhone: input.responsiblePhone ?? null,
      status: input.status ?? organization.status,
    });

    return this.organizationRepository.save(updated);
  }
}
