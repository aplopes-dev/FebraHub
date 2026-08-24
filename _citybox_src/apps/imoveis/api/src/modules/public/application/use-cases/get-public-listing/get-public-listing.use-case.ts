import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PropertyEntity } from '../../../../properties/domain/entities/property.entity';
import { PropertyNotFoundError } from '../../../../properties/domain/errors/property-not-found.error';
import { PropertyRepository } from '../../../../properties/domain/repositories/property.repository.interface';
import { TeamMemberRepository } from '../../../../settings/domain/repositories/team-member.repository.interface';
import { resolveActivePublicAgent } from '../../policies/resolve-active-public-agent';
import { isPublicCatalogPropertyStatus } from '../../policies/public-catalog-property.policy';

export type GetPublicListingInput = {
  storeId: string;
  listingId: string;
  /**
   * Quando informado, exige imóvel do corretor ativo (`agentId === slug`).
   * Omitido: qualquer imóvel `available` da loja (link curto `/p/:id`).
   */
  agentSlug?: string;
};

@Injectable()
export class GetPublicListingUseCase implements IUseCase<
  GetPublicListingInput,
  PropertyEntity
> {
  constructor(
    private readonly members: TeamMemberRepository,
    private readonly properties: PropertyRepository,
  ) {}

  async execute(input: GetPublicListingInput): Promise<PropertyEntity> {
    const slug = input.agentSlug?.trim() ?? '';

    if (slug) {
      await resolveActivePublicAgent(
        this.members,
        input.storeId,
        slug,
        GetPublicListingUseCase.name,
      );
    }

    const property = await this.properties.findById(
      input.storeId,
      input.listingId,
    );
    if (
      !property ||
      !isPublicCatalogPropertyStatus(property.status) ||
      (slug !== '' && property.agentId !== slug)
    ) {
      throw new PropertyNotFoundError(input.listingId);
    }

    return property;
  }
}
