import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import type {
  ListMyOrganizationsDto,
  ListMyOrganizationsResult,
} from '../../dtos/organization.dto';

/**
 * As organizações em que o usuário tem vínculo ativo — é o seletor de empresa
 * do front, que roda antes de existir uma organização ativa.
 */
@Injectable()
export class ListMyOrganizationsUseCase implements IUseCase<
  ListMyOrganizationsDto,
  ListMyOrganizationsResult
> {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    input: ListMyOrganizationsDto,
  ): Promise<ListMyOrganizationsResult> {
    const items = await this.organizationRepository.findAllByUser(input.userId);
    return { items };
  }
}
