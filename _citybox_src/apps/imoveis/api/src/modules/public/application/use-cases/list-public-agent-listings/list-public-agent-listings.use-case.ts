import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { PropertyEntity } from '../../../../properties/domain/entities/property.entity';
import {
  parseCsvListingTypes,
  parseCsvPropertyTypes,
} from '../../../../properties/domain/mappers/property-enum.mapper';
import { PropertyRepository } from '../../../../properties/domain/repositories/property.repository.interface';
import { TeamMemberRepository } from '../../../../settings/domain/repositories/team-member.repository.interface';
import { resolveActivePublicAgent } from '../../policies/resolve-active-public-agent';
import { healPublicCatalogOwnership } from '../../policies/heal-public-catalog-ownership';
import { PUBLIC_CATALOG_PROPERTY_STATUSES } from '../../policies/public-catalog-property.policy';

export type ListPublicAgentListingsInput = {
  storeId: string;
  slug: string;
  page?: number;
  perPage?: number;
  search?: string;
  purpose?: string[];
  type?: string[];
};

export type ListPublicAgentListingsOutput = {
  items: PropertyEntity[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListPublicAgentListingsUseCase implements IUseCase<
  ListPublicAgentListingsInput,
  ListPublicAgentListingsOutput
> {
  constructor(
    private readonly members: TeamMemberRepository,
    private readonly properties: PropertyRepository,
  ) {}

  async execute(
    input: ListPublicAgentListingsInput,
  ): Promise<ListPublicAgentListingsOutput> {
    await resolveActivePublicAgent(
      this.members,
      input.storeId,
      input.slug,
      ListPublicAgentListingsUseCase.name,
    );

    const page = Math.max(1, Number(input.page ?? 1) || 1);
    const perPage = Math.min(
      200,
      Math.max(1, Number(input.perPage ?? 8) || 8),
    );

    let listingType;
    let type;
    try {
      listingType = parseCsvListingTypes(input.purpose);
      type = parseCsvPropertyTypes(input.type);
    } catch (err) {
      throw new ValidatorDomainError({
        internalMessage: err instanceof Error ? err.message : 'Invalid filters',
        externalMessage: 'Filtros de listagem inválidos.',
        context: ListPublicAgentListingsUseCase.name,
      });
    }

    const members = await this.members.findAll(input.storeId);
    await healPublicCatalogOwnership(this.properties, input.storeId, members);

    // Catálogo do corretor: só imóveis `available` com `agentId` = slug.
    const { items, total } = await this.properties.findMany(input.storeId, {
      page,
      perPage,
      search: input.search?.trim() || undefined,
      status: [...PUBLIC_CATALOG_PROPERTY_STATUSES],
      listingType,
      type,
      agentId: input.slug.trim(),
    });

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    return { items, total, page, perPage, totalPages };
  }
}
